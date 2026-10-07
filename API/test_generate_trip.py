"""
Test script for generate-trip endpoint
"""
import requests
import json
from datetime import datetime
import sys
import io

# Fix Windows console encoding issue
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

API_BASE_URL = "https://ai-trip-api-40205731279.us-central1.run.app/api/v1"

def register_or_login():
    """Register a test user or login if exists"""
    # Try to register (simple params, not JSON)
    username = "testuser_trip"
    password = "TestPassword123!"

    print("🔐 Attempting to register test user...")
    register_params = {
        "username": username,
        "password": password
    }
    response = requests.post(f"{API_BASE_URL}/auth/register", params=register_params)

    if response.status_code == 200 or response.status_code == 201:
        print("✅ Registration successful")
    else:
        print(f"⚠️ Registration failed (may already exist): {response.status_code}")

    # Login to get token (form-data, not JSON)
    print("🔐 Logging in...")
    login_data = {
        "username": username,
        "password": password
    }

    response = requests.post(f"{API_BASE_URL}/auth/login", data=login_data)

    if response.status_code == 200:
        data = response.json()
        token = data.get("access_token")
        print(f"✅ Login successful! Token: {token[:50]}...")
        return token
    else:
        print(f"❌ Login failed: {response.status_code}")
        print(response.text)
        return None

def test_generate_trip(token):
    """Test the generate-trip endpoint"""
    print("\n🧪 Testing generate-trip endpoint...")

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    # Test request
    trip_request = {
        "departure": "Hà Nội",
        "destination": "Đà Lạt",
        "people": 2,
        "days": 2,
        "time": "2026-02-15",
        "money": "5 - 10 triệu",
        "transportation": "Máy bay",
        "travelStyle": "Lãng mạn",
        "interests": ["Thiên nhiên", "Ẩm thực"],
        "accommodation": "Khách sạn 3-4 sao"
    }

    print(f"📤 Request data: {json.dumps(trip_request, ensure_ascii=False, indent=2)}")
    print("\n⏳ Generating trip plan... (this may take 10-30 seconds)")

    response = requests.post(
        f"{API_BASE_URL}/ai_recs/generate-trip",
        headers=headers,
        json=trip_request,
        timeout=120
    )

    print(f"\n📊 Response status: {response.status_code}")

    if response.status_code == 200:
        data = response.json()
        print("✅ SUCCESS! Trip plan generated:")
        print(json.dumps(data, ensure_ascii=False, indent=2))

        # Summary
        print("\n📋 Summary:")
        print(f"   Trip name: {data.get('name')}")
        if 'parameters' in data and 'days' in data['parameters']:
            days = data['parameters']['days']
            print(f"   Total days: {len(days)}")
            for day in days:
                activities_count = len(day.get('activities', []))
                print(f"   Day {day.get('day')}: {activities_count} activities")

        return True
    else:
        print(f"❌ FAILED! Error: {response.status_code}")
        print(response.text)
        return False

if __name__ == "__main__":
    print("="*60)
    print("🧳 AI Trip System - Generate Trip Test")
    print("="*60)

    # Get authentication token
    token = register_or_login()

    if not token:
        print("\n❌ Cannot proceed without authentication token")
        exit(1)

    # Test generate-trip endpoint
    success = test_generate_trip(token)

    print("\n" + "="*60)
    if success:
        print("✅ TEST PASSED - API is working with Vertex AI!")
    else:
        print("❌ TEST FAILED - Check logs above")
    print("="*60)
