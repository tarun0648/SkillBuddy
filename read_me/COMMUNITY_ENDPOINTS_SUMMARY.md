# Community Endpoints Summary

This document provides a comprehensive overview of all community endpoints in the Skill Buddy application, including their functionality, request/response formats, and usage examples.

## Base URL
```
http://192.168.1.10:5000/api/community
```

## Authentication
All community endpoints require authentication via the `X-User-ID` header:
```
X-User-ID: <user_id>
```

## Endpoints Overview

### 1. Health Check
**GET** `/health`
- **Purpose**: Check if the community service is running and healthy
- **Authentication**: Not required
- **Response**: Service status and basic statistics

### 2. Posts Management

#### 2.1 Create Post
**POST** `/posts`
- **Purpose**: Create a new community post
- **Authentication**: Required
- **Request Body**:
  ```json
  {
    "content": "Your post content here"
  }
  ```
- **Response**: Created post data with post_id

#### 2.2 Get All Posts
**GET** `/posts`
- **Purpose**: Retrieve all community posts with pagination
- **Authentication**: Required
- **Query Parameters**:
  - `limit` (optional): Number of posts to return (default: 20)
  - `page` (optional): Page number (default: 1)
- **Response**: List of posts with metadata

#### 2.3 Get Specific Post
**GET** `/posts/{post_id}`
- **Purpose**: Get a specific post with all its details
- **Authentication**: Required
- **Response**: Complete post data including likes and replies

#### 2.4 Delete Post
**DELETE** `/posts/{post_id}`
- **Purpose**: Delete a post (only by the author)
- **Authentication**: Required
- **Response**: Success confirmation

### 3. User Posts

#### 3.1 Get My Posts
**GET** `/my-posts`
- **Purpose**: Get posts created by the authenticated user
- **Authentication**: Required
- **Response**: List of user's posts

#### 3.2 Get User Posts
**GET** `/users/{user_id}/posts`
- **Purpose**: Get posts created by a specific user
- **Authentication**: Required
- **Response**: List of posts by the specified user

### 4. Engagement Features

#### 4.1 Like/Unlike Post
**POST** `/posts/{post_id}/like`
- **Purpose**: Toggle like on a post
- **Authentication**: Required
- **Response**: Updated like status and count

#### 4.2 Add Reply
**POST** `/posts/{post_id}/replies`
- **Purpose**: Add a reply to a post
- **Authentication**: Required
- **Request Body**:
  ```json
  {
    "text": "Your reply text here"
  }
  ```
- **Response**: Created reply data

#### 4.3 Get Replies
**GET** `/posts/{post_id}/replies`
- **Purpose**: Get all replies for a specific post
- **Authentication**: Required
- **Response**: List of replies sorted by timestamp

#### 4.4 Delete Reply
**DELETE** `/posts/{post_id}/replies/{reply_id}`
- **Purpose**: Delete a reply (only by the author)
- **Authentication**: Required
- **Response**: Success confirmation

### 5. Discovery Features

#### 5.1 Search Posts
**GET** `/search?q={search_term}`
- **Purpose**: Search posts by content
- **Authentication**: Required
- **Query Parameters**:
  - `q` (required): Search term
  - `limit` (optional): Number of results (default: 20)
- **Response**: Matching posts

#### 5.2 Get Trending Posts
**GET** `/trending`
- **Purpose**: Get trending posts based on engagement
- **Authentication**: Required
- **Query Parameters**:
  - `limit` (optional): Number of posts (default: 10)
  - `days` (optional): Time period in days (default: 7)
- **Response**: Trending posts sorted by engagement

### 6. Statistics

#### 6.1 Get Community Stats
**GET** `/stats`
- **Purpose**: Get community platform statistics
- **Authentication**: Required
- **Response**: Platform statistics including total posts, likes, replies, and active users

## Data Models

### Post Structure
```json
{
  "post_id": "uuid",
  "user_id": "user_id",
  "user_name": "User Name",
  "user_email": "user@example.com",
  "user_profession": "Software Developer",
  "content": "Post content",
  "timestamp": "2024-01-01T12:00:00",
  "likes_count": 5,
  "replies_count": 3,
  "is_deleted": false,
  "likes": [...],
  "replies": [...]
}
```

### Reply Structure
```json
{
  "reply_id": "uuid",
  "post_id": "post_uuid",
  "user_id": "user_id",
  "user_name": "User Name",
  "user_email": "user@example.com",
  "text": "Reply text",
  "timestamp": "2024-01-01T12:00:00",
  "is_deleted": false
}
```

### Like Structure
```json
{
  "post_id": "post_uuid",
  "user_id": "user_id",
  "user_name": "User Name",
  "timestamp": "2024-01-01T12:00:00"
}
```

## Error Handling

All endpoints return consistent error responses:

### Success Response
```json
{
  "success": true,
  "data": {...},
  "message": "Operation successful"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "details": "Additional error details"
}
```

### Common HTTP Status Codes
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized (missing or invalid X-User-ID)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `500`: Internal Server Error

## Frontend Integration

### API Service Usage
The frontend uses `communityApiService.js` to interact with these endpoints:

```javascript
// Get all posts
const posts = await communityApiService.getPosts();

// Create a post
const result = await communityApiService.createPost("Hello community!");

// Like a post
const likeResult = await communityApiService.likePost(postId);

// Reply to a post
const replyResult = await communityApiService.replyToPost(postId, "Great post!");

// Search posts
const searchResults = await communityApiService.searchPosts("keyword");

// Get trending posts
const trendingPosts = await communityApiService.getTrendingPosts();
```

### Authentication
The frontend automatically includes the `X-User-ID` header by retrieving the user ID from AsyncStorage.

## Testing

Use the provided test script to verify all endpoints:

```bash
python test_community_endpoints.py
```

This script tests all endpoints and provides a comprehensive report of their functionality.

## Database Collections

The community system uses the following Firestore collections:
- `community_posts`: Stores all posts
- `community_likes`: Stores post likes
- `community_replies`: Stores post replies

## Security Features

1. **Authentication**: All endpoints require valid user ID
2. **Authorization**: Users can only delete their own posts and replies
3. **Soft Deletion**: Posts and replies are soft-deleted (marked as deleted but not removed from database)
4. **Input Validation**: All inputs are validated and sanitized
5. **Rate Limiting**: Consider implementing rate limiting for production use

## Performance Considerations

1. **Pagination**: Posts are paginated to handle large datasets
2. **Indexing**: Firestore queries are optimized with proper indexing
3. **Caching**: Consider implementing caching for frequently accessed data
4. **Search**: Current search is basic; consider implementing full-text search for production

## Future Enhancements

1. **Real-time Updates**: Implement WebSocket connections for live updates
2. **Media Support**: Add support for images and videos in posts
3. **Advanced Search**: Implement full-text search with Elasticsearch or similar
4. **Moderation**: Add content moderation features
5. **Notifications**: Implement notification system for likes and replies
6. **Analytics**: Add detailed analytics and insights 