# Community Integration Guide

This guide explains how the community feature has been integrated into the Skill Buddy backend instead of using separate microservices.

## Overview

The community functionality is now part of the main `skill-buddy-backend` and includes:

- **Post Management**: Create, read, update, delete posts
- **Like System**: Like/unlike posts
- **Reply System**: Add replies to posts
- **User Management**: User-specific posts and interactions
- **Search & Trending**: Advanced post discovery features

## Backend Structure

### Files Added/Modified

1. **`skill-buddy-backend/models/community_model.py`** (NEW)
   - Handles all community data operations
   - Uses Firestore collections for posts, likes, and replies
   - Implements soft delete for data integrity

2. **`skill-buddy-backend/routes/community_routes.py`** (EXISTING)
   - RESTful API endpoints for community features
   - Authentication and authorization
   - Error handling and validation

3. **`interview-app/services/communityApiService.js`** (UPDATED)
   - Updated to use skill-buddy-backend endpoints
   - Improved error handling and response validation
   - Added new features like search and trending

4. **`interview-app/screens/CommunityScreen.js`** (UPDATED)
   - Updated to work with new API structure
   - Better error handling and user feedback
   - Improved data transformation

## API Endpoints

### Base URL
```
http://YOUR_LOCAL_IP:5000/community
```

### Authentication
All endpoints require the `X-User-ID` header with a valid user ID.

### Endpoints

#### 1. Get Posts
```
GET /community/posts?limit=20&page=1
```
**Response:**
```json
{
  "success": true,
  "data": {
    "posts": [...],
    "page": 1,
    "limit": 20,
    "total_posts": 5
  }
}
```

#### 2. Create Post
```
POST /community/posts
Content-Type: application/json
X-User-ID: user123

{
  "content": "Post content here"
}
```
**Response:**
```json
{
  "success": true,
  "message": "Post created successfully",
  "data": {
    "post_id": "uuid",
    "user_id": "user123",
    "content": "Post content here",
    "timestamp": "2024-01-01T12:00:00",
    ...
  }
}
```

#### 3. Like/Unlike Post
```
POST /community/posts/{post_id}/like
X-User-ID: user123
```
**Response:**
```json
{
  "success": true,
  "message": "Post liked successfully",
  "data": {
    "post_id": "uuid",
    "action": "liked",
    "likes_count": 5,
    "user_liked": true
  }
}
```

#### 4. Add Reply
```
POST /community/posts/{post_id}/replies
Content-Type: application/json
X-User-ID: user123

{
  "text": "Reply text here"
}
```
**Response:**
```json
{
  "success": true,
  "message": "Reply added successfully",
  "data": {
    "reply_id": "uuid",
    "post_id": "uuid",
    "text": "Reply text here",
    ...
  }
}
```

#### 5. Get Specific Post
```
GET /community/posts/{post_id}
X-User-ID: user123
```

#### 6. Delete Post
```
DELETE /community/posts/{post_id}
X-User-ID: user123
```

#### 7. Delete Reply
```
DELETE /community/posts/{post_id}/replies/{reply_id}
X-User-ID: user123
```

#### 8. Get User's Posts
```
GET /community/my-posts
X-User-ID: user123
```

#### 9. Search Posts
```
GET /community/search?q=search_term
X-User-ID: user123
```

#### 10. Get Trending Posts
```
GET /community/trending
X-User-ID: user123
```

## Setup Instructions

### 1. Backend Setup

1. **Ensure skill-buddy-backend is running:**
   ```bash
   cd skill-buddy-backend
   python app.py
   ```

2. **Verify community routes are registered:**
   - Check that `community_bp` is imported and registered in `app.py`
   - Ensure the `CommunityModel` is properly imported

3. **Test the endpoints:**
   ```bash
   python test_community_endpoints.py
   ```

### 2. Frontend Setup

1. **Update IP address in API service:**
   ```javascript
   // interview-app/services/communityApiService.js
   const getBaseUrl = () => {
     return 'http://YOUR_LOCAL_IP'; // Replace with your IP
   };
   ```

2. **Ensure user authentication is working:**
   - The community features require a valid user ID
   - Make sure the auth context provides user information

### 3. Database Setup

The community features use Firestore collections:
- `community_posts`: Stores all posts
- `community_likes`: Stores like relationships
- `community_replies`: Stores replies to posts

## Data Structure

### Post Document
```json
{
  "post_id": "uuid",
  "user_id": "user123",
  "user_name": "John Doe",
  "user_email": "john@example.com",
  "user_profession": "Software Engineer",
  "content": "Post content",
  "timestamp": "2024-01-01T12:00:00",
  "likes_count": 5,
  "replies_count": 3,
  "is_deleted": false
}
```

### Like Document
```json
{
  "post_id": "uuid",
  "user_id": "user123",
  "user_name": "John Doe",
  "timestamp": "2024-01-01T12:00:00"
}
```

### Reply Document
```json
{
  "reply_id": "uuid",
  "post_id": "uuid",
  "user_id": "user123",
  "user_name": "John Doe",
  "user_email": "john@example.com",
  "text": "Reply text",
  "timestamp": "2024-01-01T12:00:00",
  "is_deleted": false
}
```

## Testing

### Manual Testing
1. Start the skill-buddy-backend
2. Run the test script: `python test_community_endpoints.py`
3. Test the React Native app

### Frontend Testing
1. Open the community screen in the app
2. Try creating a post
3. Test liking and replying to posts
4. Verify data persistence

## Troubleshooting

### Common Issues

1. **"User ID required" error**
   - Ensure the `X-User-ID` header is set
   - Verify user authentication is working

2. **"Database not available" error**
   - Check Firestore connection
   - Verify Firebase configuration

3. **CORS errors**
   - Ensure CORS is properly configured in the backend
   - Check that the frontend is using the correct IP address

4. **Posts not loading**
   - Check network connectivity
   - Verify the backend is running on the correct port
   - Check browser/device console for errors

### Debug Steps

1. **Check backend logs:**
   ```bash
   # Look for community-related logs
   tail -f skill-buddy-backend/logs/app.log
   ```

2. **Test endpoints manually:**
   ```bash
   curl -H "X-User-ID: test-user" http://localhost:5000/community/posts
   ```

3. **Check Firestore:**
   - Verify collections exist
   - Check data is being written correctly

## Security Considerations

1. **Authentication**: All endpoints require valid user ID
2. **Authorization**: Users can only delete their own posts/replies
3. **Input Validation**: All inputs are validated and sanitized
4. **Soft Delete**: Data is soft-deleted to maintain referential integrity

## Performance Optimizations

1. **Pagination**: Posts are paginated to handle large datasets
2. **Indexing**: Firestore indexes are used for efficient queries
3. **Caching**: Consider implementing Redis for frequently accessed data
4. **Lazy Loading**: Comments are loaded on demand

## Future Enhancements

1. **Real-time Updates**: WebSocket integration for live updates
2. **Media Support**: Image and video uploads
3. **Moderation**: Content moderation and reporting
4. **Notifications**: Push notifications for interactions
5. **Analytics**: Post engagement metrics

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the backend logs
3. Test endpoints manually
4. Verify database connectivity 