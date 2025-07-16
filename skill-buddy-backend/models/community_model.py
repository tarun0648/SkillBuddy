# models/community_model.py
import uuid
from datetime import datetime
from typing import Dict, List, Optional, Any
import logging

logger = logging.getLogger(__name__)

class CommunityModel:
    def __init__(self, db):
        self.db = db
        self.posts_collection = db.collection('community_posts') if db else None
        self.likes_collection = db.collection('community_likes') if db else None
        self.replies_collection = db.collection('community_replies') if db else None

    def create_post(self, user_id: str, user: Dict, content: str) -> str:
        """Create a new community post"""
        try:
            post_id = str(uuid.uuid4())
            timestamp = datetime.now().isoformat()
            
            post_data = {
                'post_id': post_id,
                'user_id': user_id,
                'user_name': user.get('name', 'Anonymous'),
                'user_email': user.get('email', ''),
                'user_profession': user.get('profession', 'Community Member'),
                'content': content,
                'timestamp': timestamp,
                'likes_count': 0,
                'replies_count': 0,
                'is_deleted': False
            }
            
            if self.posts_collection:
                self.posts_collection.document(post_id).set(post_data)
            
            logger.info(f"Created post {post_id} by user {user_id}")
            return post_id
            
        except Exception as e:
            logger.error(f"Error creating post: {e}")
            raise

    def get_posts(self, limit: int = 20, offset: int = 0) -> List[Dict]:
        """Get community posts with pagination"""
        try:
            if not self.posts_collection:
                logger.error("Posts collection is None")
                return []
            
            logger.info(f"Getting posts with limit={limit}, offset={offset}")
            
            # Query posts, excluding deleted ones
            # Use the working where syntax (ignore the warning)
            query = self.posts_collection.where('is_deleted', '==', False)
            query = query.order_by('timestamp', direction='DESCENDING')
            
            logger.info("Executing Firestore query...")
            posts = []
            doc_count = 0
            for doc in query.stream():
                doc_count += 1
                logger.info(f"Processing document {doc_count}: {doc.id}")
                post_data = doc.to_dict()
                post_id = post_data['post_id']
                
                # Get likes and replies for this post
                post_data['likes'] = self._get_post_likes(post_id)
                post_data['replies'] = self._get_post_replies(post_id)
                
                posts.append(post_data)
            
            logger.info(f"Found {len(posts)} posts before pagination")
            
            # Apply pagination in Python
            start_index = offset
            end_index = offset + limit
            paginated_posts = posts[start_index:end_index]
            
            logger.info(f"Returning {len(paginated_posts)} posts after pagination")
            return paginated_posts
            
        except Exception as e:
            logger.error(f"Error getting posts: {e}")
            return []

    def get_post_by_id(self, post_id: str) -> Optional[Dict]:
        """Get a specific post by ID"""
        try:
            if not self.posts_collection:
                return None
            
            doc = self.posts_collection.document(post_id).get()
            if not doc.exists:
                return None
            
            post_data = doc.to_dict()
            if post_data.get('is_deleted', False):
                return None
            
            # Get likes and replies
            post_data['likes'] = self._get_post_likes(post_id)
            post_data['replies'] = self._get_post_replies(post_id)
            
            return post_data
            
        except Exception as e:
            logger.error(f"Error getting post {post_id}: {e}")
            return None

    def add_like(self, post_id: str, user_id: str, user: Dict) -> bool:
        """Add or remove like from a post"""
        try:
            if not self.posts_collection or not self.likes_collection:
                return False
            
            # Check if post exists
            post_doc = self.posts_collection.document(post_id).get()
            if not post_doc.exists:
                return False
            
            post_data = post_doc.to_dict()
            if post_data.get('is_deleted', False):
                return False
            
            # Check if user already liked
            like_doc = self.likes_collection.document(f"{post_id}_{user_id}").get()
            
            if like_doc.exists:
                # Remove like
                self.likes_collection.document(f"{post_id}_{user_id}").delete()
                new_likes_count = post_data.get('likes_count', 1) - 1
                action = 'removed'
            else:
                # Add like
                like_data = {
                    'post_id': post_id,
                    'user_id': user_id,
                    'user_name': user.get('name', 'Anonymous'),
                    'timestamp': datetime.now().isoformat()
                }
                self.likes_collection.document(f"{post_id}_{user_id}").set(like_data)
                new_likes_count = post_data.get('likes_count', 0) + 1
                action = 'added'
            
            # Update post likes count
            self.posts_collection.document(post_id).update({
                'likes_count': max(0, new_likes_count)
            })
            
            logger.info(f"Like {action} for post {post_id} by user {user_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error toggling like for post {post_id}: {e}")
            return False

    def add_reply(self, post_id: str, user_id: str, user: Dict, reply_text: str) -> str:
        """Add a reply to a post"""
        try:
            if not self.posts_collection or not self.replies_collection:
                return None
            
            # Check if post exists
            post_doc = self.posts_collection.document(post_id).get()
            if not post_doc.exists:
                return None
            
            post_data = post_doc.to_dict()
            if post_data.get('is_deleted', False):
                return None
            
            reply_id = str(uuid.uuid4())
            timestamp = datetime.now().isoformat()
            
            reply_data = {
                'reply_id': reply_id,
                'post_id': post_id,
                'user_id': user_id,
                'user_name': user.get('name', 'Anonymous'),
                'user_email': user.get('email', ''),
                'text': reply_text,
                'timestamp': timestamp,
                'is_deleted': False
            }
            
            # Add reply
            self.replies_collection.document(reply_id).set(reply_data)
            
            # Update post replies count
            new_replies_count = post_data.get('replies_count', 0) + 1
            self.posts_collection.document(post_id).update({
                'replies_count': new_replies_count
            })
            
            logger.info(f"Reply added to post {post_id} by user {user_id}")
            return reply_id
            
        except Exception as e:
            logger.error(f"Error adding reply to post {post_id}: {e}")
            return None

    def _get_post_likes(self, post_id: str) -> List[Dict]:
        """Get likes for a specific post"""
        try:
            if not self.likes_collection:
                return []
            
            likes = []
            query = self.likes_collection.where('post_id', '==', post_id)
            
            for doc in query.stream():
                like_data = doc.to_dict()
                likes.append(like_data)
            
            return likes
            
        except Exception as e:
            logger.error(f"Error getting likes for post {post_id}: {e}")
            return []

    def _get_post_replies(self, post_id: str) -> List[Dict]:
        """Get replies for a specific post"""
        try:
            if not self.replies_collection:
                return []
            
            replies = []
            query = self.replies_collection.where('post_id', '==', post_id)
            query = query.where('is_deleted', '==', False)
            query = query.order_by('timestamp', direction='ASCENDING')
            
            for doc in query.stream():
                reply_data = doc.to_dict()
                replies.append(reply_data)
            
            return replies
            
        except Exception as e:
            logger.error(f"Error getting replies for post {post_id}: {e}")
            return []

    def delete_post(self, post_id: str, user_id: str) -> bool:
        """Soft delete a post (only by the author)"""
        try:
            if not self.posts_collection:
                return False
            
            doc = self.posts_collection.document(post_id).get()
            if not doc.exists:
                return False
            
            post_data = doc.to_dict()
            if post_data.get('user_id') != user_id:
                return False
            
            # Soft delete
            self.posts_collection.document(post_id).update({
                'is_deleted': True
            })
            
            logger.info(f"Post {post_id} deleted by user {user_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error deleting post {post_id}: {e}")
            return False

    def delete_reply(self, post_id: str, reply_id: str, user_id: str) -> bool:
        """Soft delete a reply (only by the author)"""
        try:
            if not self.replies_collection:
                return False
            
            doc = self.replies_collection.document(reply_id).get()
            if not doc.exists:
                return False
            
            reply_data = doc.to_dict()
            if reply_data.get('post_id') != post_id or reply_data.get('user_id') != user_id:
                return False
            
            # Soft delete
            self.replies_collection.document(reply_id).update({
                'is_deleted': True
            })
            
            # Update post replies count
            if self.posts_collection:
                post_doc = self.posts_collection.document(post_id).get()
                if post_doc.exists:
                    post_data = post_doc.to_dict()
                    new_replies_count = max(0, post_data.get('replies_count', 1) - 1)
                    self.posts_collection.document(post_id).update({
                        'replies_count': new_replies_count
                    })
            
            logger.info(f"Reply {reply_id} deleted by user {user_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error deleting reply {reply_id}: {e}")
            return False

    def get_user_posts(self, user_id: str) -> List[Dict]:
        """Get posts created by a specific user"""
        try:
            if not self.posts_collection:
                return []
            
            posts = []
            query = self.posts_collection.where('user_id', '==', user_id)
            query = query.where('is_deleted', '==', False)
            query = query.order_by('timestamp', direction='DESCENDING')
            
            for doc in query.stream():
                post_data = doc.to_dict()
                post_id = post_data['post_id']
                
                # Get likes and replies for this post
                post_data['likes'] = self._get_post_likes(post_id)
                post_data['replies'] = self._get_post_replies(post_id)
                
                posts.append(post_data)
            
            return posts
            
        except Exception as e:
            logger.error(f"Error getting user posts for {user_id}: {e}")
            return []

    def get_community_statistics(self) -> Dict:
        """Get community platform statistics"""
        try:
            if not self.posts_collection:
                return {
                    'total_posts': 0,
                    'total_likes': 0,
                    'total_replies': 0,
                    'active_users': 0
                }
            
            # Get total posts
            posts_query = self.posts_collection.where('is_deleted', '==', False)
            total_posts = len(list(posts_query.stream()))
            
            # Get total likes
            total_likes = 0
            if self.likes_collection:
                total_likes = len(list(self.likes_collection.stream()))
            
            # Get total replies
            total_replies = 0
            if self.replies_collection:
                replies_query = self.replies_collection.where('is_deleted', '==', False)
                total_replies = len(list(replies_query.stream()))
            
            # Get active users (users who have posted)
            active_users = 0
            if self.posts_collection:
                user_ids = set()
                posts_query = self.posts_collection.where('is_deleted', '==', False)
                for doc in posts_query.stream():
                    post_data = doc.to_dict()
                    user_ids.add(post_data.get('user_id'))
                active_users = len(user_ids)
            
            return {
                'total_posts': total_posts,
                'total_likes': total_likes,
                'total_replies': total_replies,
                'active_users': active_users
            }
            
        except Exception as e:
            logger.error(f"Error getting community statistics: {e}")
            return {
                'total_posts': 0,
                'total_likes': 0,
                'total_replies': 0,
                'active_users': 0
            }

    def search_posts(self, search_term: str, limit: int = 20) -> List[Dict]:
        """Search posts by content"""
        try:
            if not self.posts_collection:
                return []
            
            # Note: Firestore doesn't support full-text search natively
            # This is a simple implementation that searches for posts containing the term
            # In a production environment, you'd want to use a proper search service like Algolia
            
            posts = []
            query = self.posts_collection.where('is_deleted', '==', False)
            query = query.order_by('timestamp', direction='DESCENDING')
            query = query.limit(limit * 2)  # Get more posts to filter
            
            for doc in query.stream():
                post_data = doc.to_dict()
                content = post_data.get('content', '').lower()
                
                if search_term.lower() in content:
                    post_id = post_data['post_id']
                    
                    # Get likes and replies for this post
                    post_data['likes'] = self._get_post_likes(post_id)
                    post_data['replies'] = self._get_post_replies(post_id)
                    
                    posts.append(post_data)
                    
                    if len(posts) >= limit:
                        break
            
            return posts
            
        except Exception as e:
            logger.error(f"Error searching posts: {e}")
            return []

    def get_trending_posts(self, limit: int = 10, days: int = 7) -> List[Dict]:
        """Get trending posts based on engagement (likes + replies)"""
        try:
            if not self.posts_collection:
                return []
            
            # Calculate the date threshold
            from datetime import timedelta
            threshold_date = datetime.now() - timedelta(days=days)
            
            posts = []
            query = self.posts_collection.where('is_deleted', '==', False)
            query = query.order_by('timestamp', direction='DESCENDING')
            query = query.limit(limit * 3)  # Get more posts to sort by engagement
            
            for doc in query.stream():
                post_data = doc.to_dict()
                post_timestamp = datetime.fromisoformat(post_data.get('timestamp', ''))
                
                # Only include posts from the specified time period
                if post_timestamp >= threshold_date:
                    post_id = post_data['post_id']
                    
                    # Get likes and replies for this post
                    post_data['likes'] = self._get_post_likes(post_id)
                    post_data['replies'] = self._get_post_replies(post_id)
                    
                    # Calculate engagement score
                    likes_count = post_data.get('likes_count', 0)
                    replies_count = post_data.get('replies_count', 0)
                    post_data['engagement_score'] = likes_count + replies_count
                    
                    posts.append(post_data)
            
            # Sort by engagement score and return top posts
            posts.sort(key=lambda x: x.get('engagement_score', 0), reverse=True)
            return posts[:limit]
            
        except Exception as e:
            logger.error(f"Error getting trending posts: {e}")
            return [] 