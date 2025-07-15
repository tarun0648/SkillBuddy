# Onboarding Backend Integration

This document describes the complete integration of the onboarding flow with the backend, including data persistence, authentication, and profile management.

## Overview

The onboarding system now saves user data to the backend in real-time as users progress through the 4-step onboarding process:

1. **Step 1**: Name input
2. **Step 2**: Profession selection
3. **Step 3**: Career choices (up to 3 selections)
4. **Step 4**: College/University information

## Architecture

### Frontend Components

#### 1. Onboarding Store (`services/onboardingStore.js`)
- **Technology**: Zustand (state management)
- **Purpose**: Manages onboarding state and backend communication
- **Features**:
  - Local data persistence using SecureStore
  - Backend API integration
  - Loading states and error handling
  - Step-by-step data saving

#### 2. Updated Onboarding Screens
- **Step1Name.js**: Name input with backend saving
- **Step2Profession.js**: Profession selection with backend saving
- **step3careerchoices.js**: Career choices with backend saving
- **step4university.js**: College info with backend saving

#### 3. API Service (`services/apiService.js`)
- **New Methods**:
  - `updateProfile(profileData)`: Updates user profile
  - `getProfile()`: Retrieves user profile

### Backend Components

#### 1. Profile Update Endpoint (`/api/user/profile`)
- **Method**: PUT
- **Authentication**: Required (JWT token)
- **Features**:
  - Incremental profile updates
  - Completion status tracking
  - XP rewards for milestones
  - Validation and error handling

#### 2. Profile Retrieval Endpoint (`/api/user/profile`)
- **Method**: GET
- **Authentication**: Required (JWT token)
- **Features**:
  - Returns complete user profile
  - Includes XP and completion status

## Data Flow

### 1. User Registration/Login
```
User → Login/Register → Backend → JWT Token → Frontend Store
```

### 2. Onboarding Data Saving
```
User Input → Onboarding Store → API Service → Backend → Database
```

### 3. Data Persistence
```
Local Storage ← Onboarding Store → Backend Database
```

## Implementation Details

### Backend Profile Structure

```json
{
  "profile": {
    "name": "string",
    "profession": "string",
    "career_choices": ["array"],
    "college_name": "string",
    "college_email": "string",
    "completion_status": 0-100,
    "is_profile_complete": boolean
  },
  "xp": {
    "total_xp": number,
    "level": number,
    "badges": ["array"]
  }
}
```

### Completion Status Tracking

- **Step 1 (Name)**: 25% completion
- **Step 2 (Profession)**: 50% completion
- **Step 3 (Career Choices)**: 75% completion
- **Step 4 (College Info)**: 100% completion

### XP Rewards

- **Step 1**: +10 XP
- **Step 2**: +15 XP
- **Step 3**: +20 XP
- **Step 4**: +50 XP

## Error Handling

### Frontend Error Handling
- Network connectivity issues
- Backend API errors
- Validation errors
- Loading states with user feedback

### Backend Error Handling
- Authentication failures
- Validation errors
- Database errors
- Rate limiting

## Testing

### Test Script
Run the test script to verify backend integration:

```bash
python test_onboarding.py
```

This script tests:
1. Backend connectivity
2. User registration/login
3. Profile updates for each step
4. Profile retrieval

### Manual Testing
1. Start the backend server
2. Run the React Native app
3. Complete the onboarding flow
4. Verify data appears in Firebase console

## Security Features

### Authentication
- JWT token-based authentication
- Token refresh mechanism
- Secure token storage (SecureStore)

### Data Validation
- Email format validation
- Required field validation
- Career choices limit (max 3)
- Input sanitization

### Rate Limiting
- API rate limiting (10 requests per minute for auth)
- Request throttling to prevent abuse

## Configuration

### Backend Configuration
- Firebase configuration in `config/firebase_config.py`
- Environment variables for secrets
- CORS configuration for mobile app

### Frontend Configuration
- API base URL in `services/apiService.js`
- IP address configuration for development
- SecureStore for sensitive data

## Troubleshooting

### Common Issues

1. **Backend Connection Failed**
   - Check if backend is running on correct port
   - Verify IP address in `apiService.js`
   - Check firewall settings

2. **Authentication Errors**
   - Verify JWT token is valid
   - Check token expiration
   - Ensure proper Authorization header

3. **Data Not Saving**
   - Check network connectivity
   - Verify backend API endpoints
   - Check Firebase configuration

4. **Profile Not Loading**
   - Verify user authentication
   - Check profile endpoint response
   - Ensure proper error handling

### Debug Steps

1. Check backend logs for errors
2. Verify API responses using test script
3. Check Firebase console for data
4. Use React Native debugger for frontend issues

## Future Enhancements

### Planned Features
- Profile picture upload
- Social media integration
- Advanced validation rules
- Offline data sync
- Profile completion reminders

### Performance Optimizations
- Data caching strategies
- Optimistic updates
- Background sync
- Reduced API calls

## API Documentation

### Update Profile
```
PUT /api/user/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "string",
  "profession": "string",
  "career_choices": ["array"],
  "college_name": "string",
  "college_email": "string"
}
```

### Get Profile
```
GET /api/user/profile
Authorization: Bearer <token>
```

### Response Format
```json
{
  "message": "Profile updated successfully",
  "profile": {
    "name": "string",
    "profession": "string",
    "career_choices": ["array"],
    "college_name": "string",
    "college_email": "string",
    "completion_status": number,
    "is_profile_complete": boolean
  },
  "xp": {
    "total_xp": number,
    "level": number,
    "badges": ["array"]
  }
}
```

## Conclusion

The onboarding backend integration provides a robust, secure, and user-friendly experience for collecting and storing user profile information. The system is designed to be scalable, maintainable, and provides real-time feedback to users throughout the onboarding process. 