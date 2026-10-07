from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, status, HTTPException
from jose import jwt, JWTError
import auth
import json
from repositories import message_repo, conversation_repo, user_repo
from gemini_client import chat_with_assistant
from chat_suggestion_service import generate_chat_suggestions
from schemas import message_schema, conversation_schema, result as result_schema
from datetime import datetime
from typing import Dict, Set, List
from controllers.auth_ctrl import require_role
from supabase_client import supabase

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        # user_id (str) -> Set of WebSockets
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        # Set of WebSockets for online admins
        self.admin_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket, user_id: str, role: int):
        if role == 0:  # Role 0 is Admin
            self.admin_connections.add(websocket)
        
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        self.active_connections[user_id].add(websocket)
        print(f"User {user_id} (Role {role}) connected. Total connections for user: {len(self.active_connections[user_id])}")

    def disconnect(self, websocket: WebSocket, user_id: str, role: int):
        if role == 0:
            self.admin_connections.discard(websocket)
        
        if user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
        print(f"User {user_id} disconnected.")

    async def send_personal_message(self, message: dict, user_id: str):
        if user_id in self.active_connections:
            for connection in self.active_connections[user_id]:
                await connection.send_json(message)

    async def broadcast_to_admins(self, message: dict):
        for connection in self.admin_connections:
            await connection.send_json(message)

manager = ConnectionManager()

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, token: str = None):
    # If token not in query param, check subprotocols (common for some clients)
    if not token:
        # Fallback to checking url if needed or just reject
        pass

    try:
        if not token:
            print("[WS CHAT] Missing token")
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

        payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        user_id: str = payload.get("sub")
        role: int = payload.get("role")
        
        if not user_id:
            print("[WS CHAT] Token missing user_id (sub)")
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

        # Accept connection only after validation
        await websocket.accept()
        print(f"[WS CHAT] Connection accepted for user: {user_id}, role: {role}")

    except JWTError as e:
        print(f"[WS CHAT] JWT Error during handshake: {e}")
        # Connection hasn't been accepted yet, so we can't call close() in the standard way for some versions
        # but for FastAPI/Uvicorn, if we haven't accepted, we can just return or raise
        return

    await manager.connect(websocket, user_id, role)
    print(f"[WS CHAT] Connected - user_id: {user_id}, role: {role}, admin_connections: {len(manager.admin_connections)}")
    
    try:
        while True:
            data = await websocket.receive_text()
            message_info = json.loads(data)
            print(f"[WS CHAT] Received message from user {user_id}: {message_info}")
            
            # Expected format: { "conversation_id": "...", "content": "..." }
            conv_id = message_info.get("conversation_id")
            content = message_info.get("content")
            
            if not conv_id or not content:
                continue

            # Check if conversation exists
            conv = conversation_repo.get_conversations_by_id(conv_id)
            if not conv:
                print(f"[WS CHAT] Conversation not found: {conv_id}")
                continue
            
            # Determine role for the message
            # Existing message roles are "user" and "assistant"
            # We'll use "assistant" for admin messages
            msg_role = "user" if role != 0 else "assistant"
            
            msg_create = message_schema.MessageCreate(
                conversation_id=conv_id,
                content=content,
                role=msg_role,
                token_count=len(content.split()),
                created_at=datetime.now()
            )
            
            # Save to DB
            created_msg = message_repo.create_message(msg_create)
            print(f"[WS CHAT] Message saved to DB: {created_msg}")
            
            # Real-time relay
            if role != 0:
                # From normal user -> notify admins
                print(f"[WS CHAT] Broadcasting to {len(manager.admin_connections)} admin connections")
                await manager.broadcast_to_admins(created_msg)
            else:
                # From admin -> notify the specific user
                target_user_id = conv[0]["user_id"]
                print(f"[WS CHAT] Sending to user: {target_user_id}")
                await manager.send_personal_message(created_msg, target_user_id)
                
            # Also send back to the sender (optional, but good for confirmation)
            # await websocket.send_json(created_msg)

    except WebSocketDisconnect:
        print(f"[WS CHAT] Disconnected - user_id: {user_id}")
        manager.disconnect(websocket, user_id, role)
    except Exception as e:
        print(f"[WS CHAT] Error: {e}")
        manager.disconnect(websocket, user_id, role)


@router.get("/admin-conversation", response_model=conversation_schema.ConversationResponse)
async def get_or_create_admin_conversation(token: str):
    # Manual token validation to allow easy access from frontend hook
    try:
        payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        user_id: str = payload.get("sub")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    # Look for an existing conversation titled "Hỗ trợ trực tuyến"
    convs, _ = user_repo.get_conversations_by_user(user_id, search="Hỗ trợ trực tuyến")
    
    if convs:
        # Sort by updated_at or id to get latest (though usually only one)
        return convs[0]
    
    # Create a new conversation for support
    new_conv = conversation_schema.ConversationCreate(
        user_id=user_id,
        title="Hỗ trợ trực tuyến",
        created_at=datetime.now()
    )
    return conversation_repo.create_conversation(new_conv)

@router.get("/conversations", response_model=List[dict])
async def get_all_support_conversations(current_user = Depends(require_role([0]))):
    """
    Admin endpoint to get all active support conversations with user details.
    """
    try:
        # Join with users table to get name and avatar
        res = supabase.table("conversations").select("*, user:users(name, avatar, email)").eq("title", "Hỗ trợ trực tuyến").order("updated_at", desc=True).execute()
        return res.data
    except Exception as e:
        print(f"Error fetching support conversations: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/messages/{conversation_id}", response_model=List[message_schema.MessageResponse])
async def get_conversation_messages(conversation_id: str, current_user = Depends(require_role([0, 1]))):
    """
    Get all messages for a specific conversation.
    """
    try:
        # Verify the user has access to this conversation
        conv = conversation_repo.get_conversations_by_id(conversation_id)
        if not conv:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        # If not admin, must be the owner
        if current_user["role"] != 0 and conv[0]["user_id"] != current_user["iduser"]:
            raise HTTPException(status_code=403, detail="Forbidden")

        messages, _ = conversation_repo.get_messages_by_conversation(conversation_id, page=1, limit=1000)
        return messages
    except Exception as e:
        print(f"Error fetching conversation messages: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/suggestions/{conversation_id}")
async def get_chat_suggestions(conversation_id: str):
    """
    Get AI-generated chat suggestions for a conversation.
    """
    try:
        # Get last 10 messages for context
        messages, count = conversation_repo.get_messages_by_conversation(conversation_id, page=1, limit=10, descending=True)
        
        # Guard against None
        if messages is None:
            messages = []

        history = []
        # messages usually come in descending order (newest first), so reverse for chronological context
        for m in reversed(messages):
            role = "Customer" if m.get("role") == "user" else "Admin"
            content = m.get("content", "")
            history.append(f"{role}: {content}")
        
        history_text = "\n".join(history)
        
        try:
            suggestions = generate_chat_suggestions(history_text)
            return suggestions
        except Exception as e:
            print(f"Gemini suggestion generation failed: {e}")
            # Controller-level fallback if gemini_client fallback also fails
            return result_schema.ChatSuggestions(suggestions=[
                result_schema.ChatSuggestion(label="Chào khách", content="Chào anh/chị, tôi có thể giúp gì cho anh/chị ạ?"),
                result_schema.ChatSuggestion(label="Hỏi tour", content="Anh/chị đang quan tâm đến tour du lịch nào ạ?")
            ])
            
    except Exception as e:
        print(f"Error in get_chat_suggestions controller: {e}")
        # Always return SOMETHING instead of 500
        return result_schema.ChatSuggestions(suggestions=[
            result_schema.ChatSuggestion(label="Hỗ trợ", content="Chào anh/chị, tôi là trợ lý AI. Tôi có thể giúp gì cho anh/chị?")
        ])

@router.post("/assistant-chat")
async def assistant_chat(req: result_schema.ChatAssistantRequest):
    """
    Direct chat with Gemini assistant for admin.
    """
    try:
        return chat_with_assistant(req.query, req.history_context)
    except Exception as e:
        print(f"Error in assistant chat: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/get-or-create-by-email")
async def get_or_create_conversation_by_email(email_data: dict, current_user = Depends(require_role([0]))):
    """
    Find or create a support conversation for a user by their email.
    """
    email = email_data.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")

    try:
        # 1. Find user by email
        users = user_repo.get_user_by_email(email)
        if not users:
            raise HTTPException(status_code=404, detail=f"User with email {email} not found")
        
        user = users[0]
        user_id = user["iduser"]

        # 2. Check if a support conversation already exists
        convs, _ = user_repo.get_conversations_by_user(user_id, search="Hỗ trợ trực tuyến")
        
        if convs:
            # Add user info to the conversation result
            conv = convs[0]
            conv["user"] = {
                "name": user.get("name") or user.get("username"),
                "avatar": user.get("avatar"),
                "email": user.get("email")
            }
            return conv

        # 3. Create a new conversation if not found
        from schemas.conversation_schema import ConversationCreate
        new_conv_schema = ConversationCreate(
            user_id=user_id,
            title="Hỗ trợ trực tuyến",
            created_at=datetime.now()
        )
        created_conv = conversation_repo.create_conversation(new_conv_schema)
        
        # Add user info to the fresh conversation
        created_conv["user"] = {
            "name": user.get("name") or user.get("username"),
            "avatar": user.get("avatar"),
            "email": user.get("email")
        }
        return created_conv

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in get_or_create_conversation_by_email: {e}")
        raise HTTPException(status_code=500, detail=str(e))
