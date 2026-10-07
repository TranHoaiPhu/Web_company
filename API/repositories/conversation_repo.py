from schemas.conversation_schema import ConversationCreate, ConversationUpdate
import uuid
from supabase_client import supabase
from datetime import datetime
from utils.db_utils import with_retry

@with_retry()
def get_conversations_by_id(id: str):
    return supabase.table("conversations").select("*").eq("id", id).execute().data

@with_retry()
def create_conversation(conversation: ConversationCreate):
    idConversation = str(uuid.uuid4())
        
    created_at_str = conversation.created_at.isoformat()
        
    db_conversation = {
        "id": idConversation,
        "user_id": conversation.user_id,
        "title": conversation.title,
        "created_at": created_at_str,
        "updated_at": created_at_str,
        "is_archived": False
    }
    
    response = supabase.table("conversations").insert(db_conversation).execute()
    return response.data[0]

def update_conversation(idConversation: str, conversation: ConversationUpdate):
    updated_data = conversation.model_dump(exclude_unset=True)
    if "updated_at" in updated_data:
        updated_data["updated_at"] = conversation.updated_at.isoformat()
        
    response = supabase.table("conversations").update(updated_data).eq("id", idConversation).execute()
    return response.data[0]

def delete_conversation(idConversation: str):
    supabase.table("conversations").update({"is_archived": True, "updated_at": datetime.now().isoformat()}).eq("id", idConversation).execute()
    return {"message": "Conversation archived successfully"}

def get_user_by_conversation(id: str):
    return supabase.table("conversations").select("user_id").eq("id", id).execute().data[0]["user_id"]

@with_retry()
def get_messages_by_conversation(id: str, page: int = 1, limit: int = 20, descending: bool = False):
    offset = (page - 1) * limit
    
    res = supabase.table("messages").select("*", count="exact").eq("conversation_id", id).order("created_at", desc=descending).range(offset, offset + limit - 1).execute()
    
    return res.data, res.count
    