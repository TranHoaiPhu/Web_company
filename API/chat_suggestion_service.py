from schemas.result import ChatSuggestions
from dotenv import load_dotenv
import os
import json
import re
import requests
import logging

# Import JSON repair library for fixing broken JSON
try:
    from json_repair import repair_json
    HAS_JSON_REPAIR = True
except ImportError:
    HAS_JSON_REPAIR = False

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

def extract_json(text: str) -> str:
    """
    Extract JSON from text that might contain markdown code blocks or other formatting.
    """
    code_block_match = re.search(r'```(?:json)?\s*(\{[\s\S]*?\})\s*```', text, re.DOTALL)
    if code_block_match:
        return code_block_match.group(1)

    first_brace = text.find('{')
    last_brace = text.rfind('}')

    if first_brace >= 0 and last_brace > first_brace:
        return text[first_brace:last_brace + 1]

    return text

def generate_chat_suggestions(history_text: str) -> ChatSuggestions:
    """
    Generate chat suggestions using dedicated CHAT_SUGGESTION_API_KEY for AI Studio.
    This bypasses Vertex AI/OAuth restrictions.
    """
    api_key = os.getenv("CHAT_SUGGESTION_API_KEY")
    
    if not api_key:
        logger.warning("No CHAT_SUGGESTION_API_KEY found for chat suggestions")
        return ChatSuggestions(suggestions=[
            {"label": "Chào khách", "content": "Chào anh/chị!"},
            {"label": "Hỗ trợ", "content": "Tôi có thể giúp gì cho anh/chị?"}
        ])

    logger.info("Generating chat suggestions (Dedicated API Key)")
    # Using v1beta for better JSON support
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
    
    schema_description = """
CRITICAL: Trả về VALID JSON format:
{
  "suggestions": [
    {
      "label": "Tiêu đề ngắn",
      "content": "Nội dung phản hồi đầy đủ"
    }
  ]
}
"""
    full_prompt = f"Lịch sử trò chuyện:\n{history_text}\n\nDựa trên lịch sử trên, hãy đưa ra 3 gợi ý phản hồi tiếp theo cho Admin.\n{schema_description}"
    
    request_body = {
        "contents": [{"parts": [{"text": full_prompt}]}],
        "generationConfig": {
            "temperature": 0.7,
            "response_mime_type": "application/json"
        }
    }

    try:
        logger.info(f"[CHAT SUGGESTIONS] Sending prompt...")
        response = requests.post(url, json=request_body, timeout=30)
        
        if not response.ok:
            logger.error(f"[CHAT SUGGESTIONS] API Error: {response.status_code} - {response.text}")
            raise Exception(f"API error: {response.status_code}")
        
        data = response.json()
        if 'candidates' not in data or not data['candidates']:
            raise Exception("No candidates in Gemini response")

        text = data['candidates'][0]['content']['parts'][0]['text']
        logger.info(f"[CHAT SUGGESTIONS] Raw response: {text}")
        
        clean_json = extract_json(text)
        
        try:
            suggestions_data = json.loads(clean_json)
        except json.JSONDecodeError:
            if HAS_JSON_REPAIR:
                suggestions_data = json.loads(repair_json(clean_json))
            else:
                raise

        return ChatSuggestions(**suggestions_data)

    except Exception as e:
        logger.error(f"[CHAT SUGGESTIONS] Error: {str(e)}")
        # Ultimate fallback
        return ChatSuggestions(suggestions=[
            {"label": "Chào khách", "content": "Chào anh/chị, tôi có thể giúp gì cho anh/chị ạ?"},
            {"label": "Hỏi thông tin", "content": "Anh/chị vui lòng cung cấp thêm thông tin về yêu cầu của mình ạ?"},
            {"label": "Hẹn gặp", "content": "Cảm ơn anh/chị đã quan tâm, chúng tôi sẽ liên hệ lại sớm nhất."}
        ])
