import os
import sys
from dotenv import load_dotenv

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from gemini_client import generate_chat_suggestions
from repositories import conversation_repo

def test_suggestions():
    load_dotenv()
    conv_id = "dfe4be59-568a-429d-88a8-602ccb8b8d25"
    print(f"Testing suggestions for conversation: {conv_id}")
    
    try:
        messages, _ = conversation_repo.get_messages_by_conversation(conv_id, page=1, limit=10, descending=True)
        print(f"Found {len(messages)} messages")
        
        history = []
        for m in reversed(messages):
            role = "Customer" if m["role"] == "user" else "Admin"
            history.append(f"{role}: {m['content']}")
        
        history_text = "\n".join(history)
        print("History context constructed.")
        
        suggestions = generate_chat_suggestions(history_text)
        print("Suggestions generated:")
        print(suggestions.model_dump_json(indent=2))
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_suggestions()
