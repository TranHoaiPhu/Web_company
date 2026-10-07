#!/usr/bin/env python3
"""
Test script for Vertex AI integration
Run this to verify Vertex AI authentication and API calls work correctly.

Usage:
    python test_vertex_ai.py
"""

import sys
import os

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from gemini_client import get_trip_plan
from dotenv import load_dotenv

load_dotenv()

def test_authentication():
    """Test if authentication works"""
    print("=" * 60)
    print("TEST 1: Authentication")
    print("=" * 60)

    try:
        from google.auth import default
        credentials, project = default(scopes=['https://www.googleapis.com/auth/cloud-platform'])
        print(f"✅ Authentication successful")
        print(f"   Project: {project}")
        return True
    except Exception as e:
        print(f"❌ Authentication failed: {str(e)}")
        print("\nTroubleshooting:")
        print("1. Run: gcloud auth application-default login")
        print("2. Ensure you have access to project: travelweb-485107")
        return False

def test_simple_trip():
    """Test a simple trip generation"""
    print("\n" + "=" * 60)
    print("TEST 2: Simple Trip Generation")
    print("=" * 60)

    prompt = """Lập kế hoạch du lịch 2 ngày từ Hà Nội đến Hạ Long cho 2 người, bắt đầu từ ngày 2024-02-01, với ngân sách khoảng 5 - 10 triệu đồng cho cả chuyến đi.

    Yêu cầu lập lịch trình chi tiết theo từng ngày, chia rõ theo các mốc thời gian:

    - **06:30 - 08:00:** Ăn sáng (gợi ý món và địa điểm cụ thể, giá hợp lý)
    - **08:00 - 11:30:** Hoạt động buổi sáng (tham quan, vui chơi, v.v.)
    - **11:30 - 13:30:** Ăn trưa (gợi ý nhà hàng + món ăn phù hợp với ngân sách)
    - **13:30 - 15:00:** Nghỉ trưa tại khách sạn hoặc nơi yên tĩnh
    - **15:00 - 18:00:** Hoạt động buổi chiều (tham quan, giải trí, tắm biển...)
    - **18:30 - 20:00:** Ăn tối (gợi ý nhà hàng, món ăn đặc sản)
    - **20:00 - 22:00:** Hoạt động buổi tối (mua sắm, dạo biển, xem show, v.v.)
    - **22:00:** Về lại khách sạn để nghỉ ngơi, mô tả khách sạn, tiện nghi

    Với mỗi hoạt động, cần bao gồm:
    - **Tên hoạt động**
    - **Thời gian cụ thể (giờ bắt đầu - giờ kết thúc)**
    - **Địa điểm (tên, địa chỉ, có thể kèm toạ độ GPS nếu có)**
    - **Mô tả chi tiết hoạt động**
    - **Đánh giá chất lượng (1-5 sao)**

    Tổng số hoạt động trong ngày phải lớn hơn 5. Tránh trùng lặp hoạt động giữa các ngày.
    """

    try:
        print("Sending request to Vertex AI...")
        trip_plan = get_trip_plan(prompt)

        print(f"✅ Trip plan generated successfully!")
        print(f"\n📋 Trip Details:")
        print(f"   Name: {trip_plan.name}")
        print(f"   Location: {trip_plan.parameters.location}")
        print(f"   Total days: {len(trip_plan.parameters.days)}")

        for day in trip_plan.parameters.days:
            print(f"\n   Day {day.day} ({day.date}):")
            print(f"      Activities: {len(day.activities)}")
            for i, activity in enumerate(day.activities[:3], 1):  # Show first 3
                print(f"         {i}. {activity.name or 'Activity'} at {activity.namePlace}")

        if len(trip_plan.parameters.days) > 0:
            total_activities = sum(len(day.activities) for day in trip_plan.parameters.days)
            print(f"\n   📊 Total activities: {total_activities}")

        return True

    except Exception as e:
        print(f"❌ Trip generation failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def test_configuration():
    """Test environment configuration"""
    print("\n" + "=" * 60)
    print("TEST 3: Configuration Check")
    print("=" * 60)

    config = {
        "USE_VERTEX_AI": os.getenv("USE_VERTEX_AI"),
        "GCP_PROJECT_ID": os.getenv("GCP_PROJECT_ID"),
        "GCP_LOCATION": os.getenv("GCP_LOCATION"),
        "GEMINI_MODEL": os.getenv("GEMINI_MODEL"),
    }

    all_set = True
    for key, value in config.items():
        if value:
            print(f"✅ {key}: {value}")
        else:
            print(f"❌ {key}: NOT SET")
            all_set = False

    if all_set:
        print("\n✅ All required environment variables are set")
    else:
        print("\n❌ Some environment variables are missing")
        print("   Check your .env file")

    return all_set

def main():
    print("\n🧪 VERTEX AI INTEGRATION TEST")
    print("Testing Vertex AI setup for AI Trip System API\n")

    # Test 1: Configuration
    config_ok = test_configuration()

    if not config_ok:
        print("\n⚠️  Configuration issues found. Please fix .env file first.")
        sys.exit(1)

    # Test 2: Authentication
    auth_ok = test_authentication()

    if not auth_ok:
        print("\n⚠️  Authentication failed. Cannot proceed with API tests.")
        sys.exit(1)

    # Test 3: API Call
    api_ok = test_simple_trip()

    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    print(f"Configuration: {'✅ PASS' if config_ok else '❌ FAIL'}")
    print(f"Authentication: {'✅ PASS' if auth_ok else '❌ FAIL'}")
    print(f"API Call: {'✅ PASS' if api_ok else '❌ FAIL'}")

    if config_ok and auth_ok and api_ok:
        print("\n🎉 All tests passed! Vertex AI integration is working correctly.")
        print("   You can now deploy to Cloud Run.")
        sys.exit(0)
    else:
        print("\n❌ Some tests failed. Please fix the issues above.")
        sys.exit(1)

if __name__ == "__main__":
    main()
