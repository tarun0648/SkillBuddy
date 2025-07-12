import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  FlatList,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { communityApiService } from '../services/communityApiService';
import { useAuth } from '../context/AuthContext';

const CommunityScreen = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newPostText, setNewPostText] = useState('');
  const [showCommentInput, setShowCommentInput] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [posting, setPosting] = useState(false);
  const [liking, setLiking] = useState({});

  // Fetch posts from backend
  const fetchPosts = async () => {
    try {
      setLoading(true);
      const postsData = await communityApiService.getPosts();
      
      // Transform backend data to match our UI structure
      const transformedPosts = postsData.map(post => ({
        id: post.post_id,
        user: {
          name: user?.email?.split('@')[0] || 'Anonymous User',
          avatar: 'https://via.placeholder.com/40',
          profession: 'Community Member'
        },
        content: post.content,
        timestamp: formatTimestamp(post.timestamp),
        likes: post.like_count || 0,
        comments: post.reply_count || 0,
        isLiked: false, // We'll need to track this separately
        commentsList: (post.replies || []).map((reply, index) => ({
          ...reply,
          reply_id: reply.reply_id || reply.id || `reply-${post.post_id}-${index}`
        }))
      }));
      
      setPosts(transformedPosts);
    } catch (error) {
      console.error('Error fetching posts:', error);
      Alert.alert('Error', 'Failed to load posts. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Format timestamp for display
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Just now';
    
    const now = new Date();
    const postTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - postTime) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return `${Math.floor(diffInMinutes / 1440)} days ago`;
  };

  // Load posts on component mount
  useEffect(() => {
    fetchPosts();
  }, []);

  // Handle pull to refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchPosts();
  };

  // Handle like post
  const handleLike = async (postId) => {
    if (liking[postId]) return; // Prevent double-clicking
    
    try {
      setLiking(prev => ({ ...prev, [postId]: true }));
      
      await communityApiService.likePost(postId);
      
      // Update local state
      setPosts(posts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            likes: post.likes + 1,
            isLiked: true
          };
        }
        return post;
      }));
    } catch (error) {
      console.error('Error liking post:', error);
      Alert.alert('Error', 'Failed to like post. Please try again.');
    } finally {
      setLiking(prev => ({ ...prev, [postId]: false }));
    }
  };

  // Handle add comment
  const handleAddComment = async (postId) => {
    if (!commentText.trim()) return;
    
    try {
      await communityApiService.replyToPost(postId, commentText);
      
      // Update local state
      setPosts(posts.map(post => {
        if (post.id === postId) {
          const newComment = {
            reply_id: Date.now().toString(),
            text: commentText,
            timestamp: new Date().toISOString()
          };
          return {
            ...post,
            comments: post.comments + 1,
            commentsList: [...post.commentsList, newComment]
          };
        }
        return post;
      }));
      
      setCommentText('');
      setShowCommentInput(null);
    } catch (error) {
      console.error('Error adding comment:', error);
      Alert.alert('Error', 'Failed to add comment. Please try again.');
    }
  };

  // Handle create post
  const handleCreatePost = async () => {
    if (!newPostText.trim() || posting) return;
    
    try {
      setPosting(true);
      await communityApiService.createPost(newPostText);
      
      // Refresh posts to get the new one
      await fetchPosts();
      setNewPostText('');
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('Error', 'Failed to create post. Please try again.');
    } finally {
      setPosting(false);
    }
  };

  const renderComment = ({ item }) => (
    <View style={styles.commentContainer}>
      <View style={styles.commentHeader}>
        <Text style={styles.commentUserName}>Anonymous User</Text>
        <Text style={styles.commentTimestamp}>{formatTimestamp(item.timestamp)}</Text>
      </View>
      <Text style={styles.commentText}>{item.text}</Text>
    </View>
  );

  const renderPost = ({ item }) => (
    <View style={styles.postContainer}>
      {/* Post Header */}
      <View style={styles.postHeader}>
        <Image source={{ uri: item.user.avatar }} style={styles.avatar} />
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.user.name}</Text>
          <Text style={styles.userProfession}>{item.user.profession}</Text>
          <Text style={styles.timestamp}>{item.timestamp}</Text>
        </View>
      </View>

      {/* Post Content */}
      <Text style={styles.postContent}>{item.content}</Text>

      {/* Post Actions */}
      <View style={styles.postActions}>
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={() => handleLike(item.id)}
          disabled={liking[item.id]}
        >
          <Ionicons 
            name={item.isLiked ? "heart" : "heart-outline"} 
            size={20} 
            color={item.isLiked ? "#4CAF50" : "#666"} 
          />
          <Text style={[styles.actionText, item.isLiked && styles.likedText]}>
            {item.likes}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => setShowCommentInput(showCommentInput === item.id ? null : item.id)}
        >
          <Ionicons name="chatbubble-outline" size={20} color="#666" />
          <Text style={styles.actionText}>{item.comments}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="share-outline" size={20} color="#666" />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
      </View>

      {/* Comments Section */}
      {item.comments > 0 && (
        <View style={styles.commentsSection}>
          <Text style={styles.commentsTitle}>Comments ({item.comments})</Text>
          <FlatList
            data={item.commentsList}
            renderItem={renderComment}
            keyExtractor={(comment, index) => comment.reply_id || comment.id || `comment-${index}`}
            scrollEnabled={false}
          />
        </View>
      )}

      {/* Comment Input */}
      {showCommentInput === item.id && (
        <View style={styles.commentInputContainer}>
          <TextInput
            style={styles.commentInput}
            placeholder="Write a comment..."
            placeholderTextColor="#999"
            value={commentText}
            onChangeText={setCommentText}
            multiline
          />
          <TouchableOpacity 
            style={styles.sendButton}
            onPress={() => handleAddComment(item.id)}
          >
            <Ionicons name="send" size={20} color="#4CAF50" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Community Wall</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Loading posts...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Community Wall</Text>
        <TouchableOpacity style={styles.headerButton}>
          <Ionicons name="notifications-outline" size={24} color="#4CAF50" />
        </TouchableOpacity>
      </View>

      {/* Create Post Section */}
      <View style={styles.createPostContainer}>
        <View style={styles.createPostHeader}>
          <Image source={{ uri: 'https://via.placeholder.com/40' }} style={styles.avatar} />
          <Text style={styles.createPostText}>What's on your mind?</Text>
        </View>
        <TextInput
          style={styles.createPostInput}
          placeholder="Share your thoughts, achievements, or questions..."
          placeholderTextColor="#999"
          value={newPostText}
          onChangeText={setNewPostText}
          multiline
          editable={!posting}
        />
        <TouchableOpacity 
          style={[styles.createPostButton, (!newPostText.trim() || posting) && styles.createPostButtonDisabled]}
          onPress={handleCreatePost}
          disabled={!newPostText.trim() || posting}
        >
          {posting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.createPostButtonText}>Post</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Posts List */}
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.postsList}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={48} color="#666" />
            <Text style={styles.emptyText}>No posts yet</Text>
            <Text style={styles.emptySubtext}>Be the first to share something!</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  headerButton: {
    padding: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 10,
  },
  emptySubtext: {
    color: '#666',
    fontSize: 14,
    marginTop: 5,
  },
  createPostContainer: {
    backgroundColor: '#111',
    margin: 15,
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  createPostHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  createPostText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  createPostInput: {
    backgroundColor: '#222',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 10,
  },
  createPostButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: 'flex-end',
    minWidth: 80,
    alignItems: 'center',
  },
  createPostButtonDisabled: {
    backgroundColor: '#333',
  },
  createPostButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  postsList: {
    paddingHorizontal: 15,
  },
  postContainer: {
    backgroundColor: '#111',
    marginBottom: 15,
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: '#333',
  },
  postHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '600',
  },
  userProfession: {
    color: '#ccc',
    fontSize: 12,
    marginTop: 2,
  },
  timestamp: {
    color: '#666',
    fontSize: 11,
    marginTop: 2,
  },
  postContent: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 15,
  },
  postActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#333',
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  actionText: {
    color: '#666',
    marginLeft: 5,
    fontSize: 14,
  },
  likedText: {
    color: '#4CAF50',
  },
  commentsSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  commentsTitle: {
    color: '#ccc',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  commentContainer: {
    marginBottom: 8,
    paddingLeft: 10,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  commentUserName: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '600',
  },
  commentTimestamp: {
    color: '#666',
    fontSize: 10,
  },
  commentText: {
    color: '#ccc',
    fontSize: 12,
    lineHeight: 16,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#222',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    color: '#fff',
    fontSize: 14,
    marginRight: 10,
  },
  sendButton: {
    padding: 8,
  },
});

export default CommunityScreen;
