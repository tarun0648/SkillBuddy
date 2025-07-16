import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  Image,
  SafeAreaView,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { COLORS, SHADOWS, cardStyle, textStyle, titleStyle, containerStyle } from '../styles';
import { communityApiService } from '../services/communityApiService';
import { useAuth } from '../context/AuthContext';

const CommunityScreen = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [showNewPostInput, setShowNewPostInput] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState(null);

  // Load posts on component mount
  useEffect(() => {
    loadPosts();
  }, []);

  // Load posts from API
  const loadPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedPosts = await communityApiService.getPosts();
      
      // Transform the data to match our UI structure
      const transformedPosts = fetchedPosts.map(post => ({
        id: post.post_id,
        author: post.user_name || 'Anonymous',
        avatar: getAvatarEmoji(post.user_profession || 'Community Member'),
        content: post.content,
        likes: post.likes_count || 0,
        comments: post.replies_count || 0,
        timestamp: formatTimestamp(post.timestamp),
        isLiked: checkIfUserLiked(post.likes || [], user?.uid),
        user_id: post.user_id,
        profession: post.user_profession || 'Community Member',
      }));
      
      setPosts(transformedPosts);
    } catch (error) {
      console.error('Error loading posts:', error);
      setError('Failed to load posts. Please check your connection.');
      // Set some sample data for demo purposes
      setPosts(getSamplePosts());
    } finally {
      setLoading(false);
    }
  };

  // Refresh posts (pull to refresh)
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPosts();
    setRefreshing(false);
  }, []);

  // Handle like/unlike post
  const handleLike = async (postId) => {
    try {
      const response = await communityApiService.likePost(postId);
      
      if (response.success) {
        // Update the post in our local state
        setPosts(posts.map(post => {
          if (post.id === postId) {
            const isLiked = response.data.user_liked;
            return {
              ...post,
              likes: isLiked ? post.likes + 1 : post.likes - 1,
              isLiked: isLiked
            };
          }
          return post;
        }));
      }
    } catch (error) {
      console.error('Error liking post:', error);
      Alert.alert('Error', 'Failed to like post. Please try again.');
    }
  };

  // Handle comment (placeholder for now)
  const handleComment = (postId) => {
    Alert.alert('Comments', 'Comment functionality coming soon!');
  };

  // Handle share (placeholder for now)
  const handleShare = (postId) => {
    Alert.alert('Share', 'Share functionality coming soon!');
  };

  // Handle creating new post
  const handlePost = async () => {
    if (!newPost.trim()) {
      Alert.alert('Error', 'Please enter some content for your post.');
      return;
    }

    try {
      setPosting(true);
      const response = await communityApiService.createPost(newPost);
      
      if (response.success) {
        // Add the new post to the beginning of the list
        const newPostObj = {
          id: response.data.post_id,
          author: user?.name || 'You',
          avatar: getAvatarEmoji(user?.profession || 'Community Member'),
          content: newPost,
          likes: 0,
          comments: 0,
          timestamp: 'Just now',
          isLiked: false,
          user_id: user?.uid,
          profession: user?.profession || 'Community Member',
        };
        
        setPosts([newPostObj, ...posts]);
        setNewPost('');
        setShowNewPostInput(false);
        Alert.alert('Success', 'Post created successfully!');
      }
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('Error', 'Failed to create post. Please try again.');
    } finally {
      setPosting(false);
    }
  };

  // Get avatar emoji based on profession
  const getAvatarEmoji = (profession) => {
    const emojiMap = {
      'Software Developer': '👨‍💻',
      'Data Analyst': '📊',
      'UI/UX Designer': '👩‍🎨',
      'Digital Marketer': '📱',
      'Student': '🎓',
      'Professional': '👔',
      'Community Member': '👤',
    };
    return emojiMap[profession] || '👤';
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Just now';
    
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffInHours = (now - date) / (1000 * 60 * 60);
      
      if (diffInHours < 1) return 'Just now';
      if (diffInHours < 24) return `${Math.floor(diffInHours)} hours ago`;
      if (diffInHours < 48) return '1 day ago';
      return `${Math.floor(diffInHours / 24)} days ago`;
    } catch (error) {
      return 'Just now';
    }
  };

  // Check if user liked the post
  const checkIfUserLiked = (likes, userId) => {
    if (!userId || !likes) return false;
    return likes.some(like => like.user_id === userId);
  };

  // Sample posts for fallback
  const getSamplePosts = () => [
    {
      id: '1',
      author: 'John Doe',
      avatar: '👨‍💻',
      content: 'Just completed my first React Native project! The learning curve was steep but totally worth it. Any tips for optimizing performance?',
      likes: 24,
      comments: 8,
      timestamp: '2 hours ago',
      isLiked: false,
    },
    {
      id: '2',
      author: 'Sarah Wilson',
      avatar: '👩‍🎨',
      content: 'Excited to share my new portfolio website! Built with modern web technologies and focused on clean design. What do you think?',
      likes: 42,
      comments: 15,
      timestamp: '5 hours ago',
      isLiked: true,
    },
    {
      id: '3',
      author: 'Mike Chen',
      avatar: '👨‍💼',
      content: 'Looking for a mentor in data science. Anyone experienced with Python and machine learning willing to help a beginner?',
      likes: 18,
      comments: 12,
      timestamp: '1 day ago',
      isLiked: false,
    },
    {
      id: '4',
      author: 'Emma Rodriguez',
      avatar: '👩‍🔬',
      content: 'Just got my first freelance gig as a UI/UX designer! The client loved my portfolio. Hard work really does pay off! 🎉',
      likes: 67,
      comments: 23,
      timestamp: '2 days ago',
      isLiked: false,
    },
  ];

  const renderPost = ({ item }) => (
    <View style={styles.postCard}>
      {/* Post Header */}
      <View style={styles.postHeader}>
        <View style={styles.authorInfo}>
          <Text style={styles.avatar}>{item.avatar}</Text>
          <View style={styles.authorDetails}>
            <Text style={styles.authorName}>{item.author}</Text>
            <Text style={styles.timestamp}>{item.timestamp}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.moreButton}>
          <Text style={styles.moreButtonText}>•••</Text>
        </TouchableOpacity>
      </View>

      {/* Post Content */}
      <Text style={styles.postContent}>{item.content}</Text>

      {/* Post Actions */}
      <View style={styles.postActions}>
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={() => handleLike(item.id)}
        >
          <Text style={[styles.actionIcon, item.isLiked && styles.likedIcon]}>
            {item.isLiked ? '❤️' : '🤍'}
          </Text>
          <Text style={styles.actionText}>{item.likes}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={() => handleComment(item.id)}
        >
          <Text style={styles.actionIcon}>💬</Text>
          <Text style={styles.actionText}>{item.comments}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={() => handleShare(item.id)}
        >
          <Text style={styles.actionIcon}>📤</Text>
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Loading component
  if (loading && posts.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Community</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading posts...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Community</Text>
        <TouchableOpacity 
          style={styles.newPostButton}
          onPress={() => setShowNewPostInput(!showNewPostInput)}
        >
          <Text style={styles.newPostButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Error Message */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadPosts}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* New Post Input */}
      {showNewPostInput && (
        <View style={styles.newPostContainer}>
          <TextInput
            style={styles.newPostInput}
            placeholder="What's on your mind?"
            placeholderTextColor={COLORS.gray}
            value={newPost}
            onChangeText={setNewPost}
            multiline
            maxLength={500}
            editable={!posting}
          />
          <View style={styles.newPostActions}>
            <Text style={styles.characterCount}>
              {newPost.length}/500
            </Text>
            <TouchableOpacity 
              style={[styles.postButton, (!newPost.trim() || posting) && styles.postButtonDisabled]}
              onPress={handlePost}
              disabled={!newPost.trim() || posting}
            >
              {posting ? (
                <ActivityIndicator size="small" color={COLORS.dark} />
              ) : (
                <Text style={styles.postButtonText}>Post</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Posts List */}
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.postsList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No posts yet</Text>
              <Text style={styles.emptySubtext}>Be the first to share something!</Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.darkGray,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  newPostButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.green,
  },
  newPostButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.white,
    fontSize: 16,
    marginTop: 10,
  },
  errorContainer: {
    backgroundColor: COLORS.surface,
    margin: 20,
    padding: 15,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#ff6b6b',
  },
  errorText: {
    color: COLORS.white,
    fontSize: 14,
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
    alignSelf: 'flex-start',
  },
  retryButtonText: {
    color: COLORS.dark,
    fontWeight: 'bold',
    fontSize: 12,
  },
  newPostContainer: {
    backgroundColor: COLORS.surface,
    margin: 20,
    borderRadius: 12,
    padding: 15,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    ...SHADOWS.dark,
  },
  newPostInput: {
    color: COLORS.white,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
    fontFamily: 'sans-serif',
  },
  newPostActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.darkGray,
  },
  characterCount: {
    color: COLORS.gray,
    fontSize: 12,
  },
  postButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 60,
    alignItems: 'center',
  },
  postButtonDisabled: {
    backgroundColor: COLORS.darkGray,
  },
  postButtonText: {
    color: COLORS.dark,
    fontWeight: 'bold',
    fontSize: 14,
  },
  postsList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  emptySubtext: {
    color: COLORS.gray,
    fontSize: 14,
  },
  postCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    ...SHADOWS.dark,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    fontSize: 32,
    marginRight: 12,
  },
  authorDetails: {
    flex: 1,
  },
  authorName: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  timestamp: {
    color: COLORS.gray,
    fontSize: 12,
    marginTop: 2,
  },
  moreButton: {
    padding: 5,
  },
  moreButtonText: {
    color: COLORS.gray,
    fontSize: 18,
    fontWeight: 'bold',
  },
  postContent: {
    color: COLORS.white,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 15,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: COLORS.darkGray,
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  actionIcon: {
    fontSize: 18,
    marginRight: 6,
  },
  likedIcon: {
    fontSize: 18,
  },
  actionText: {
    color: COLORS.lightGray,
    fontSize: 14,
    fontWeight: '500',
  },
});

export default CommunityScreen;
