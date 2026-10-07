import os
from dotenv import load_dotenv
import json
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

GCP_PROJECT_ID = os.getenv("GCP_PROJECT_ID", "travelweb-485107")
GCP_LOCATION = os.getenv("GCP_LOCATION", "global")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3-flash-preview")

from google.auth import default
from google.auth.transport.requests import Request
import requests

def test_chat():
    try:
        logger.info(f"Testing Gemini Assistant with Project ID: {GCP_PROJECT_ID}")
        
        credentials, project = default(scopes=['https://www.googleapis.com/auth/cloud-platform'])
        logger.info(f"Using Project: {project}")
        
        auth_req = Request()
        credentials.refresh(auth_req)
        access_token = credentials.token
        logger.info("Access token obtained.")

        if GCP_LOCATION == 'global':
            base_url = 'https://aiplatform.googleapis.com'
        else:
            base_url = f'https://{GCP_LOCATION}-aiplatform.googleapis.com'

        endpoint = f'{base_url}/v1/projects/{GCP_PROJECT_ID}/locations/{GCP_LOCATION}/publishers/google/models/{GEMINI_MODEL}:generateContent'
        logger.info(f"Endpoint: {endpoint}")

        request_body = {
            "contents": [{
                "role": "user",
                "parts": [{"text": "Hello, who are you?"}]
            }],
            "generationConfig": {
                "temperature": 0.7,
                "maxOutputTokens": 100
            }
        }

        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json',
        }

        response = requests.post(endpoint, headers=headers, json=request_body, timeout=30)

        if not response.ok:
            logger.error(f"Response Error: {response.status_code} - {response.text}")
        else:
            logger.info("Success!")
            logger.info(response.json())

    except Exception as e:
        logger.error(f"Test Failed: {str(e)}")

if __name__ == "__main__":
    test_chat()
