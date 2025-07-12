#!/usr/bin/env python3
"""
Test script to verify the connection between frontend and backend
"""

import requests
import json
import time

def test_backend_health():
    """Test if the backend is running and healthy"""
    try:
        response = requests.get('http://192.168.1.4:5000/', timeout=5)
        if response.status_code == 200:
            data = response.json()
            print("✅ Backend is running and healthy!")
            print(f"   Message: {data.get('message', 'N/A')}")
            print(f"   Status: {data.get('status', 'N/A')}")
            return True
        else:
            print(f"❌ Backend responded with status code: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to backend. Make sure it's running on port 5000")
        return False
    except requests.exceptions.Timeout:
        print("❌ Backend connection timed out")
        return False
    except Exception as e:
        print(f"❌ Error testing backend: {e}")
        return False

def test_api_endpoints():
    """Test basic API endpoints"""
    base_url = 'http://192.168.1.4:5000/api'
    
    # Test registration endpoint (should return validation error for empty data)
    try:
        response = requests.post(f'{base_url}/auth/register', 
                               json={}, 
                               headers={'Content-Type': 'application/json'},
                               timeout=5)
        if response.status_code == 400:
            print("✅ Registration endpoint is working (validation working)")
        else:
            print(f"⚠️  Registration endpoint returned unexpected status: {response.status_code}")
    except Exception as e:
        print(f"❌ Error testing registration endpoint: {e}")

def main():
    print("🔍 Testing Skill Buddy Backend Connection...")
    print("=" * 50)
    
    # Test backend health
    if test_backend_health():
        print("\n🔍 Testing API endpoints...")
        test_api_endpoints()
        print("\n✅ Backend connection test completed!")
        print("\n📱 To test the full frontend-backend connection:")
        print("   1. Start the frontend: cd interview-app && npm start")
        print("   2. Open the Expo app on your device/simulator")
        print("   3. Try to register or login")
        print("   4. Check the backend console for incoming requests")
    else:
        print("\n❌ Backend connection test failed!")
        print("   Make sure to start the backend first:")
        print("   cd skill-buddy-backend && source venv/bin/activate && python app.py")

if __name__ == "__main__":
    main() 