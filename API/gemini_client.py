from schemas.result import TripPlan, ChatSuggestions, ChatAssistantResponse
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

if HAS_JSON_REPAIR:
    logger.info("✓ json-repair library available")
else:
    logger.warning("⚠ json-repair not installed, using fallback strategies only")

load_dotenv()

# Configuration - Use Vertex AI for stability (like Chatbot)
USE_VERTEX_AI = os.getenv("USE_VERTEX_AI", "true").lower() == "true"
GCP_PROJECT_ID = os.getenv("GCP_PROJECT_ID", "travelweb-485107")
GCP_LOCATION = os.getenv("GCP_LOCATION", "global")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3-flash-preview")

logger.info(f"Gemini Config: USE_VERTEX_AI={USE_VERTEX_AI}, MODEL={GEMINI_MODEL}, PROJECT={GCP_PROJECT_ID}")

def extract_json(text: str) -> str:
    """
    Extract JSON from text that might contain markdown code blocks or other formatting.
    More aggressive extraction.
    """
    # Try to extract JSON from code blocks first (```json ... ```)
    code_block_match = re.search(r'```(?:json)?\s*(\{[\s\S]*?\})\s*```', text, re.DOTALL)
    if code_block_match:
        logger.info("Extracted JSON from code block")
        return code_block_match.group(1)

    # Try to find the outermost JSON object
    # Find first { and last }
    first_brace = text.find('{')
    last_brace = text.rfind('}')

    if first_brace >= 0 and last_brace > first_brace:
        json_str = text[first_brace:last_brace + 1]
        logger.info(f"Extracted JSON from position {first_brace} to {last_brace}")
        return json_str

    # Return original if no match
    logger.warning("Could not extract JSON boundaries, returning original text")
    return text

def fix_json_string(json_str: str) -> str:
    """
    Try to fix common JSON syntax errors more aggressively.
    """
    # Remove trailing commas before closing braces/brackets
    json_str = re.sub(r',\s*}', '}', json_str)
    json_str = re.sub(r',\s*]', ']', json_str)

    # Remove comments (// or /* */)
    json_str = re.sub(r'//.*?\n', '\n', json_str)
    json_str = re.sub(r'/\*.*?\*/', '', json_str, flags=re.DOTALL)

    # Fix single quotes to double quotes (but be careful with contractions)
    # Only fix single quotes that look like JSON string delimiters
    json_str = re.sub(r"(?<!\\)'([^']*?)(?<!\\)'", r'"\1"', json_str)

    # Remove any non-printable characters except newlines and tabs
    json_str = ''.join(char for char in json_str if char.isprintable() or char in '\n\t')

    # Fix missing commas between objects in arrays (basic pattern)
    # Pattern: }\s*{ should be },\n{
    json_str = re.sub(r'}\s*{', '},\n{', json_str)

    # Fix missing commas after closing brace followed by quote (very common error)
    json_str = re.sub(r'}\s*"', '},"', json_str)

    # Fix missing commas after closing bracket followed by quote
    json_str = re.sub(r']\s*"', '],"', json_str)

    # Fix missing commas between string and opening brace
    json_str = re.sub(r'"\s*{', '",{', json_str)

    # Fix missing commas between number and opening brace
    json_str = re.sub(r'(\d)\s*{', r'\1,{', json_str)

    # Fix specific pattern: rating value followed by new property (common Gemini error)
    # Pattern: "rating": 4.5\n} should have comma before the next property
    json_str = re.sub(r'(\d+\.?\d*)\s*}\s*{', r'\1},{', json_str)
    json_str = re.sub(r'(\d+\.?\d*)\s*}\s*"', r'\1},"', json_str)

    return json_str

# Removed Google AI Studio - using Vertex AI only for better stability

def get_trip_plan_vertex_ai(prompt: str) -> TripPlan:
    """
    Generate trip plan using Vertex AI with gcloud auth.
    Pattern based on working Chatbot implementation.
    """
    from google.auth import default
    from google.auth.transport.requests import Request
    import requests

    try:
        logger.info("Using Vertex AI with gcloud auth")

        # Get credentials using gcloud auth (same as Chatbot)
        credentials, project = default(scopes=['https://www.googleapis.com/auth/cloud-platform'])
        logger.info(f"Credentials obtained for project: {project}")

        # Refresh credentials to get access token
        auth_req = Request()
        credentials.refresh(auth_req)
        access_token = credentials.token

        # Construct endpoint - for location=global, use aiplatform.googleapis.com directly
        # This matches the working Chatbot implementation
        if GCP_LOCATION == 'global':
            base_url = 'https://aiplatform.googleapis.com'
        else:
            base_url = f'https://{GCP_LOCATION}-aiplatform.googleapis.com'

        # Use the model from env, fallback to gemini-1.5-flash
        model = GEMINI_MODEL if GEMINI_MODEL else "gemini-1.5-flash"
        endpoint = f'{base_url}/v1/projects/{GCP_PROJECT_ID}/locations/{GCP_LOCATION}/publishers/google/models/{model}:generateContent'
        logger.info(f"Vertex AI endpoint: {endpoint}")

        # Schema description for JSON structure - VERY STRICT
        schema_description = """

CRITICAL: Bạn PHẢI trả về VALID JSON với cấu trúc SAU ĐÂY. Không được có lỗi syntax!

```json
{
  "name": "Tên chuyến đi",
  "parameters": {
    "location": "Địa điểm chính",
    "days": [
      {
        "day": 1,
        "date": "YYYY-MM-DD",
        "activities": [
          {
            "time": "HH:MM - HH:MM",
            "name": "Tên hoạt động",
            "lat": 10.123,
            "lon": 106.456,
            "description": "Mô tả ngắn gọn (tối đa 100 từ)",
            "namePlace": "Tên địa điểm",
            "city": "Thành phố",
            "province": "Tỉnh",
            "address": "Địa chỉ đầy đủ",
            "rating": 4.5
          }
        ]
      }
    ]
  }
}
```

QUY TẮC BẮT BUỘC:
1. CHỈ trả về JSON, KHÔNG có text giải thích phía trước/sau
2. Tất cả string PHẢI dùng double quotes "..."
3. KHÔNG được có trailing comma (dấu phẩy thừa ở cuối)
4. Mô tả ngắn gọn, súc tích (max 100 từ/activity)
5. Latitude/Longitude phải là số thực
6. Rating từ 0-5
7. KIỂM TRA kỹ syntax trước khi trả về
"""

        full_prompt = prompt + "\n\n" + schema_description

        # Request body - NO responseMimeType (not supported on Vertex AI)
        request_body = {
            "contents": [{
                "role": "user",
                "parts": [{"text": full_prompt}]
            }],
            "generationConfig": {
                "temperature": 0.3,  # Lower temperature for more consistent JSON
                "topK": 40,
                "topP": 0.95,
                "maxOutputTokens": 8192,
                "candidateCount": 1  # Only one response
                # NO responseMimeType - causes 400 error!
            }
        }

        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json',
        }

        logger.info("Sending request to Vertex AI...")
        response = requests.post(endpoint, headers=headers, json=request_body, timeout=120)

        if not response.ok:
            error_text = response.text
            logger.error(f"Vertex AI error: {response.status_code} - {error_text}")
            raise Exception(f'Vertex AI error: {response.status_code} - {error_text}')

        data = response.json()

        if not data.get('candidates') or len(data['candidates']) == 0:
            raise Exception('No response from Vertex AI')

        text = data['candidates'][0]['content']['parts'][0]['text']
        logger.info("Response received from Vertex AI")
        
        # Clean and extract JSON with multiple strategies
        clean_json = extract_json(text)
        clean_json = fix_json_string(clean_json)

        # Parse JSON response with multiple fallback strategies
        trip_plan_data = None
        last_error = None

        # Strategy 1: Parse directly
        try:
            logger.info("Strategy 1: Parsing JSON directly...")
            trip_plan_data = json.loads(clean_json)
            logger.info("✓ Strategy 1 succeeded")
        except json.JSONDecodeError as je:
            last_error = je
            logger.warning(f"Strategy 1 failed: {str(je)}")

            # Strategy 2: Fix and retry
            try:
                logger.info("Strategy 2: Fixing JSON and retrying...")
                fixed_json = fix_json_string(clean_json)
                trip_plan_data = json.loads(fixed_json)
                logger.info("✓ Strategy 2 succeeded")
            except json.JSONDecodeError as je2:
                last_error = je2
                logger.warning(f"Strategy 2 failed: {str(je2)}")

                # Strategy 3: Remove all descriptions and try again
                try:
                    logger.info("Strategy 3: Simplifying JSON (removing long descriptions)...")
                    # Try to fix by removing very long lines
                    lines = clean_json.split('\n')
                    # Remove very long lines that might have syntax issues
                    fixed_lines = [line for line in lines if len(line) < 500]
                    simplified_json = '\n'.join(fixed_lines)
                    simplified_json = fix_json_string(simplified_json)

                    trip_plan_data = json.loads(simplified_json)
                    logger.info("✓ Strategy 3 succeeded")
                except json.JSONDecodeError as je3:
                    last_error = je3
                    logger.error(f"Strategy 3 failed: {str(je3)}")

                    # Strategy 4: Use json_repair library (if available)
                    if HAS_JSON_REPAIR:
                        try:
                            logger.info("Strategy 4: Using json_repair library...")
                            repaired_json = repair_json(clean_json)
                            trip_plan_data = json.loads(repaired_json)
                            logger.info("✓ Strategy 4 succeeded with json_repair!")
                        except Exception as je4:
                            last_error = je4
                            logger.error(f"Strategy 4 failed: {str(je4)}")
                    else:
                        logger.warning("Strategy 4 skipped: json_repair not available")

                    # If still failed, log detailed error info
                    if trip_plan_data is None:
                        logger.error(f"JSON length: {len(clean_json)} chars")
                        logger.error(f"Error at position: {je3.pos if hasattr(je3, 'pos') else 'unknown'}")
                        logger.error(f"Error line: {je3.lineno if hasattr(je3, 'lineno') else 'unknown'}")
                        logger.error(f"First 500 chars: {clean_json[:500]}")
                        logger.error(f"Last 500 chars: {clean_json[-500:]}")

                        # Save to file for debugging
                        try:
                            with open('/tmp/failed_json.txt', 'w', encoding='utf-8') as f:
                                f.write(clean_json)
                            logger.error("Failed JSON saved to /tmp/failed_json.txt")
                        except:
                            pass

                        raise Exception(
                            f"All JSON parsing strategies failed. Last error: {str(last_error)}. "
                            f"Try reducing the number of days or simplifying your request."
                        )

        if trip_plan_data is None:
            raise Exception("Failed to parse JSON from Vertex AI response")

        # Validate with Pydantic
        trip_plan = TripPlan(**trip_plan_data)
        logger.info(f"Trip plan generated successfully: {trip_plan.name}")

        return trip_plan

    except Exception as e:
        logger.error(f"Vertex AI error: {str(e)}", exc_info=True)
        raise Exception(f"Vertex AI failed: {str(e)}")

def get_trip_plan(prompt: str) -> TripPlan:
    """
    Main entry point for trip plan generation.
    Tries Vertex AI first, then fallbacks to AI Studio if api_key is available.
    """
    if USE_VERTEX_AI:
        try:
            logger.info("Using Vertex AI (like Chatbot)")
            return get_trip_plan_vertex_ai(prompt)
        except Exception as e:
            logger.warning(f"Vertex AI failed: {str(e)}. Trying AI Studio...")
    
    return get_trip_plan_ai_studio(prompt)

def get_trip_plan_ai_studio(prompt: str) -> TripPlan:
    """
    Fallback to Google AI Studio using API key.
    """
    api_key = os.getenv("api_key")
    if not api_key:
        raise Exception("No Vertex AI auth and no api_key found in .env")

    logger.info("Using Google AI Studio with API Key")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
    
    schema_description = """
CRITICAL: Bạn PHẢI trả về VALID JSON với cấu trúc SAU ĐÂY.
{
  "name": "Tên chuyến đi",
  "parameters": {
    "location": "Địa điểm chính",
    "days": [
      {
        "day": 1,
        "date": "YYYY-MM-DD",
        "activities": [
          {
            "time": "HH:MM - HH:MM",
            "name": "Tên hoạt động",
            "lat": 10.123,
            "lon": 106.456,
            "description": "Mô tả",
            "namePlace": "Tên địa điểm",
            "city": "Thành phố",
            "province": "Tỉnh",
            "address": "Địa chỉ",
            "rating": 4.5
          }
        ]
      }
    ]
  }
}
"""
    full_prompt = prompt + "\n\n" + schema_description
    
    request_body = {
        "contents": [{"parts": [{"text": full_prompt}]}],
        "generationConfig": {
            "temperature": 0.2,
            "response_mime_type": "application/json"
        }
    }

    response = requests.post(url, json=request_body, timeout=60)
    if not response.ok:
        raise Exception(f"AI Studio error: {response.status_code} - {response.text}")
    
    text = response.json()['candidates'][0]['content']['parts'][0]['text']
    clean_json = extract_json(text)
    trip_plan_data = json.loads(clean_json)
    return TripPlan(**trip_plan_data)

def generate_chat_suggestions(history_text: str) -> ChatSuggestions:
    """
    Generate chat suggestions based on conversation history.
    Tries Vertex AI first, then AI Studio.
    """
    if USE_VERTEX_AI:
        try:
            return generate_chat_suggestions_vertex_ai(history_text)
        except Exception as e:
            logger.warning(f"Suggestions Vertex AI failed: {str(e)}. Trying AI Studio...")
    
    return generate_chat_suggestions_ai_studio(history_text)

def generate_chat_suggestions_vertex_ai(history_text: str) -> ChatSuggestions:
    from google.auth import default
    from google.auth.transport.requests import Request
    import requests

    logger.info("Generating chat suggestions (Vertex)")
    credentials, project = default(scopes=['https://www.googleapis.com/auth/cloud-platform'])
    auth_req = Request()
    credentials.refresh(auth_req)
    access_token = credentials.token

    if GCP_LOCATION == 'global':
        base_url = 'https://aiplatform.googleapis.com'
    else:
        base_url = f'https://{GCP_LOCATION}-aiplatform.googleapis.com'

    model = GEMINI_MODEL
    endpoint = f'{base_url}/v1/projects/{GCP_PROJECT_ID}/locations/{GCP_LOCATION}/publishers/google/models/{model}:generateContent'

    schema_description = """
CRITICAL: Trả về VALID JSON:
{
  "suggestions": [
    {
      "label": "Tiêu đề",
      "content": "Nội dung"
    }
  ]
}
"""
    full_prompt = f"Lịch sử:\n{history_text}\n\n{schema_description}"
    request_body = {
        "contents": [{"role": "user", "parts": [{"text": full_prompt}]}],
        "generationConfig": {"temperature": 0.5, "maxOutputTokens": 1024}
    }
    logger.info(f"[CHAT SUGGESTIONS] Sending prompt to Vertex: {full_prompt[:200]}...")
    response = requests.post(endpoint, headers=headers, json=request_body, timeout=60)
    if not response.ok:
        logger.error(f"[CHAT SUGGESTIONS] Vertex AI error: {response.status_code} - {response.text}")
        raise Exception(f'Vertex AI error: {response.status_code}')
    
    data = response.json()
    text = data['candidates'][0]['content']['parts'][0]['text']
    logger.info(f"[CHAT SUGGESTIONS] Raw response from Vertex: {text}")
    clean_json = extract_json(text)
    suggestions_data = json.loads(clean_json)
    return ChatSuggestions(**suggestions_data)

def generate_chat_suggestions_ai_studio(history_text: str) -> ChatSuggestions:
    """
    Generate suggestions using dedicated CHAT_SUGGESTION_API_KEY.
    """
    # Try the dedicated key first, then fallback to general api_key
    api_key = os.getenv("CHAT_SUGGESTION_API_KEY") or os.getenv("api_key")
    
    if not api_key:
        logger.warning("No API key found for chat suggestions")
        return ChatSuggestions(suggestions=[
            {"label": "Chào khách", "content": "Chào anh/chị!"}
        ])

    logger.info("Generating chat suggestions (AI Studio - Dedicated Key)")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
    
    schema_description = """
CRITICAL: Trả về VALID JSON:
{
  "suggestions": [
    {
      "label": "Tiêu đề",
      "content": "Nội dung"
    }
  ]
}
"""
    full_prompt = f"Lịch sử:\n{history_text}\n\n{schema_description}"
    # AI Studio requires slightly different format or no responseMimeType in some versions, but 1.5-flash supports it
    request_body = {
        "contents": [{"parts": [{"text": full_prompt}]}],
        "generationConfig": {"response_mime_type": "application/json"}
    }
    try:
        logger.info(f"[CHAT SUGGESTIONS] Sending prompt to AI Studio: {full_prompt[:200]}...")
        response = requests.post(url, json=request_body, timeout=60)
        if not response.ok:
            logger.error(f"[CHAT SUGGESTIONS] AI Studio API error: {response.status_code} - {response.text}")
            raise Exception(f"AI Studio error: {response.status_code}")
        
        data = response.json()
        if 'candidates' not in data or not data['candidates']:
            logger.warning(f"[CHAT SUGGESTIONS] No candidates in Gemini response. Data: {data}")
            return ChatSuggestions(suggestions=[
                {"label": "Chào khách", "content": "Chào anh/chị!"}
            ])

        text = data['candidates'][0]['content']['parts'][0]['text']
        logger.info(f"[CHAT SUGGESTIONS] Raw response from AI Studio: {text}")
        clean_json = extract_json(text)
        
        try:
            suggestions_data = json.loads(clean_json)
        except json.JSONDecodeError:
            # Try repairing if available
            if HAS_JSON_REPAIR:
                suggestions_data = json.loads(repair_json(clean_json))
            else:
                raise

        return ChatSuggestions(**suggestions_data)

    except Exception as e:
        logger.error(f"Final fallback for suggestions due to error: {str(e)}")
        return ChatSuggestions(suggestions=[
            {"label": "Chào khách", "content": "Chào anh/chị!"},
            {"label": "Hỏi nhu cầu", "content": "Anh/chị cần hỗ trợ gì không ạ?"}
        ])

def chat_with_assistant(query: str, history_context: str = None) -> ChatAssistantResponse:
    """
    Direct chat with Gemini for admin assistant purposes.
    Returns structured response with suggested messages for admin to use.
    """
    api_key = os.getenv("CHAT_SUGGESTION_API_KEY") or os.getenv("api_key")
    if not api_key:
        return ChatAssistantResponse(response="Lỗi: Chưa cấu hình API Key.")

    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent?key={api_key}"
        
        system_instruction = """
Bạn là trợ lý AI chuyên nghiệp hỗ trợ Admin chăm sóc khách hàng du lịch.
Nhiệm vụ: Phân tích yêu cầu của Admin và lịch sử chat, sau đó đưa ra lời khuyên và các PHƯƠNG ÁN PHẢN HỒI MẪU.

BẮT BUỘC trả về định dạng JSON:
{
  "response": "Lời khuyên hoặc giải thích ngắn gọn của trợ lý",
  "suggestions": [
    {
      "label": "Tên nút gợi ý",
      "content": "Nội dung tin nhắn chuẩn để Admin nhấn vào gửi cho khách"
    }
  ]
}
"""
        prompt = f"{system_instruction}\n\n"
        if history_context:
            prompt += f"Lịch sử chat khách hàng:\n{history_context}\n\n"
        prompt += f"Câu hỏi của Admin: {query}"

        request_body = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 0.7,
                "response_mime_type": "application/json"
            }
        }

        logger.info(f"[ASSISTANT] Sending prompt to AI Studio...")
        response = requests.post(url, json=request_body, timeout=60)
        
        if not response.ok:
            return ChatAssistantResponse(response=f"Lỗi API: {response.status_code}")
        
        data = response.json()
        if 'candidates' not in data or not data['candidates']:
            return ChatAssistantResponse(response="Không có phản hồi từ AI.")

        text = data['candidates'][0]['content']['parts'][0]['text']
        logger.info(f"[ASSISTANT] Raw response: {text}")
        
        try:
            # Clean and parse JSON
            clean_json = extract_json(text)
            res_data = json.loads(clean_json)
            return ChatAssistantResponse(**res_data)
        except Exception as parse_err:
            logger.error(f"[ASSISTANT] JSON Parse Error: {parse_err}")
            return ChatAssistantResponse(response=text, suggestions=[])

    except Exception as e:
        logger.error(f"[ASSISTANT] Error: {str(e)}")
        return ChatAssistantResponse(response=f"Lỗi hệ thống: {str(e)}")



