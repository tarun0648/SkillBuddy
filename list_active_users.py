#!/usr/bin/env python3
"""
Script to list all active users from Firebase
"""

import os
import sys
from datetime import datetime

# Check if service account key exists
if not os.path.exists('serviceAccountKey.json'):
    print("❌ serviceAccountKey.json not found!")
    sys.exit(1)

try:
    import firebase_admin
    from firebase_admin import credentials, firestore
except ImportError as e:
    print(f"❌ Firebase Admin SDK not installed: {e}")
    sys.exit(1)

def format_timestamp(timestamp):
    """Format Firebase timestamp to readable string"""
    if hasattr(timestamp, 'isoformat'):
        return timestamp.isoformat()
    elif isinstance(timestamp, str):
        return timestamp
    else:
        return str(timestamp)

def main():
    """List all active users"""
    print("👥 ACTIVE USERS LIST")
    print("=" * 80)
    
    # Initialize Firebase
    try:
        if not firebase_admin._apps:
            cred = credentials.Certificate('serviceAccountKey.json')
            firebase_admin.initialize_app(cred)
        
        db = firestore.client()
        print("✅ Connected to Firebase")
        
    except Exception as e:
        print(f"❌ Error connecting to Firebase: {e}")
        return
    
    # Get all users
    try:
        users_ref = db.collection('users')
        users = users_ref.get()
        
        active_users = []
        total_users = 0
        
        for user in users:
            total_users += 1
            user_data = user.to_dict()
            
            # Check if user is active
            if user_data.get('is_active', True):
                active_users.append({
                    'id': user.id,
                    'data': user_data
                })
        
        print(f"\n📊 Total users: {total_users}")
        print(f"✅ Active users: {len(active_users)}")
        print(f"❌ Inactive users: {total_users - len(active_users)}")
        
        if not active_users:
            print("\n❌ No active users found")
            return
        
        # Display active users in a table format
        print(f"\n{'='*80}")
        print(f"{'ID':<20} {'Email':<25} {'Name':<20} {'Profession':<15} {'XP':<8} {'Status':<12}")
        print(f"{'='*80}")
        
        for i, user in enumerate(active_users, 1):
            user_data = user['data']
            
            # Extract user info
            email = user_data.get('email', 'N/A')
            name = user_data.get('profile', {}).get('name', 'N/A')
            profession = user_data.get('profile', {}).get('profession', 'N/A')
            xp = user_data.get('xp', {}).get('total_xp', 0)
            completion_status = user_data.get('profile', {}).get('completion_status', 0)
            
            # Determine status
            if completion_status == 100:
                status = "Complete"
            elif completion_status > 0:
                status = f"{completion_status}%"
            else:
                status = "Incomplete"
            
            print(f"{user['id']:<20} {email:<25} {name:<20} {profession:<15} {xp:<8} {status:<12}")
        
        # Detailed user information
        print(f"\n{'='*80}")
        print("📋 DETAILED USER INFORMATION")
        print(f"{'='*80}")
        
        for i, user in enumerate(active_users, 1):
            user_data = user['data']
            
            print(f"\n👤 User {i}: {user['id']}")
            print("-" * 50)
            
            # Basic info
            print(f"📧 Email: {user_data.get('email', 'N/A')}")
            print(f"📅 Created: {format_timestamp(user_data.get('created_at', 'N/A'))}")
            print(f"🔄 Last Updated: {format_timestamp(user_data.get('updated_at', 'N/A'))}")
            print(f"🕒 Last Login: {format_timestamp(user_data.get('last_login', 'N/A'))}")
            
            # Profile info
            profile = user_data.get('profile', {})
            print(f"\n📝 Profile:")
            print(f"   Name: {profile.get('name', 'N/A')}")
            print(f"   Profession: {profile.get('profession', 'N/A')}")
            print(f"   College: {profile.get('college_name', 'N/A')}")
            print(f"   College Email: {profile.get('college_email', 'N/A')}")
            print(f"   Phone: {profile.get('phone', 'N/A')}")
            print(f"   Completion: {profile.get('completion_status', 0)}%")
            print(f"   Complete: {profile.get('is_profile_complete', False)}")
            
            # Career choices
            career_choices = profile.get('career_choices', [])
            if career_choices:
                print(f"   Career Choices: {', '.join(career_choices)}")
            else:
                print(f"   Career Choices: None selected")
            
            # XP system
            xp_data = user_data.get('xp', {})
            print(f"\n⭐ XP System:")
            print(f"   Total XP: {xp_data.get('total_xp', 0)}")
            print(f"   Level: {xp_data.get('level', 1)}")
            print(f"   Badges: {len(xp_data.get('badges', []))}")
            
            # Authentication
            print(f"\n🔐 Authentication:")
            print(f"   Provider: {user_data.get('sso_provider', 'email')}")
            print(f"   Verified: {user_data.get('is_verified', False)}")
            print(f"   Active: {user_data.get('is_active', True)}")
            
            # Settings
            settings = user_data.get('settings', {})
            print(f"\n⚙️ Settings:")
            print(f"   Notifications: {settings.get('notifications', True)}")
            print(f"   Email Updates: {settings.get('email_updates', True)}")
            print(f"   Privacy Level: {settings.get('privacy_level', 'normal')}")
            
            print("-" * 50)
        
        # Summary statistics
        print(f"\n{'='*80}")
        print("📈 SUMMARY STATISTICS")
        print(f"{'='*80}")
        
        # Profession breakdown
        professions = {}
        completion_stats = {'complete': 0, 'incomplete': 0, 'partial': 0}
        total_xp = 0
        
        for user in active_users:
            profile = user['data'].get('profile', {})
            profession = profile.get('profession', 'Unknown')
            completion = profile.get('completion_status', 0)
            xp = user['data'].get('xp', {}).get('total_xp', 0)
            
            professions[profession] = professions.get(profession, 0) + 1
            total_xp += xp
            
            if completion == 100:
                completion_stats['complete'] += 1
            elif completion == 0:
                completion_stats['incomplete'] += 1
            else:
                completion_stats['partial'] += 1
        
        print(f"👥 Total Active Users: {len(active_users)}")
        print(f"⭐ Total XP: {total_xp}")
        print(f"📊 Average XP: {total_xp // len(active_users) if active_users else 0}")
        
        print(f"\n🎓 Profession Breakdown:")
        for profession, count in sorted(professions.items()):
            percentage = (count / len(active_users)) * 100
            print(f"   {profession}: {count} users ({percentage:.1f}%)")
        
        print(f"\n📋 Profile Completion:")
        print(f"   Complete (100%): {completion_stats['complete']} users")
        print(f"   Partial: {completion_stats['partial']} users")
        print(f"   Incomplete (0%): {completion_stats['incomplete']} users")
        
    except Exception as e:
        print(f"❌ Error fetching users: {e}")

if __name__ == "__main__":
    main() 