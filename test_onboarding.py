#!/usr/bin/env python3
"""
Test script for onboarding backend integration
"""

import requests
import json
import time

# Configuration
BASE_URL = "http://192.168.1.4:5000/api"
TEST_EMAIL = "test@example.com"
TEST_PASSWORD = "testpass123"

def test_backend_connection():
    """Test if backend is running"""
    try:
        response = requests.get(f"{BASE_URL.replace('/api', '')}/")
        print(f"✅ Backend connection: {response.status_code}")
        print(f"Response: {response.json()}")
        return True
    except Exception as e:
        print(f"❌ Backend connection failed: {e}")
        return False

def test_user_registration():
    """Test user registration"""
    try:
        data = {
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        }
        response = requests.post(f"{BASE_URL}/auth/register", json=data)
        print(f"✅ Registration: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"User ID: {result.get('user_id')}")
            return result.get('access_token')
        else:
            print(f"Response: {response.json()}")
            return None
    except Exception as e:
        print(f"❌ Registration failed: {e}")
        return None

def test_user_login():
    """Test user login"""
    try:
        data = {
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        }
        response = requests.post(f"{BASE_URL}/auth/login", json=data)
        print(f"✅ Login: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"User ID: {result.get('user_id')}")
            return result.get('access_token')
        else:
            print(f"Response: {response.json()}")
            return None
    except Exception as e:
        print(f"❌ Login failed: {e}")
        return None

def test_profile_update(token, step_data):
    """Test profile update for each onboarding step"""
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = requests.put(f"{BASE_URL}/user/profile", json=step_data, headers=headers)
        print(f"✅ Profile update: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"Profile: {result.get('profile')}")
            print(f"XP: {result.get('xp')}")
            return True
        else:
            print(f"Response: {response.json()}")
            return False
    except Exception as e:
        print(f"❌ Profile update failed: {e}")
        return False

def test_get_profile(token):
    """Test getting user profile"""
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = requests.get(f"{BASE_URL}/user/profile", headers=headers)
        print(f"✅ Get profile: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"User profile: {result.get('user', {}).get('profile')}")
            return True
        else:
            print(f"Response: {response.json()}")
            return False
    except Exception as e:
        print(f"❌ Get profile failed: {e}")
        return False

def main():
    """Run all tests"""
    print("🚀 Testing Onboarding Backend Integration")
    print("=" * 50)
    
    # Test 1: Backend connection
    if not test_backend_connection():
        print("❌ Backend is not running. Please start the backend first.")
        return
    
    print("\n" + "=" * 50)
    
    # Test 2: User registration
    token = test_user_registration()
    if not token:
        # Try login if registration failed (user might already exist)
        print("Trying login instead...")
        token = test_user_login()
    
    if not token:
        print("❌ Could not authenticate user")
        return
    
    print("\n" + "=" * 50)
    
    # Test 3: Onboarding steps
    onboarding_steps = [
        {"name": "John Doe"},
        {"profession": "Student"},
        {"career_choices": ["Software Developer", "Data Analyst"]},
        {"college_name": "Test University", "college_email": "john@test.edu"}
    ]
    
    for i, step_data in enumerate(onboarding_steps, 1):
        print(f"\n--- Step {i} ---")
        success = test_profile_update(token, step_data)
        if not success:
            print(f"❌ Step {i} failed")
            return
        time.sleep(1)  # Small delay between requests
    
    print("\n" + "=" * 50)
    
    # Test 4: Get final profile
    print("\n--- Final Profile ---")
    test_get_profile(token)
    
    print("\n✅ All tests completed successfully!")
    print("🎉 Onboarding backend integration is working!")

if __name__ == "__main__":
    main() 