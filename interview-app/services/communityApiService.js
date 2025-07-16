// Community API Service for Skill Buddy Backend
// This service connects to the main skill-buddy-backend community endpoints
import AsyncStorage from '@react-native-async-storage/async-storage';

// Get the correct base URL based on environment (same as main API service)
const getApiBaseUrl = () => {
  // Development URLs - use your computer's IP address
  const COMPUTER_IP = '192.168.1.10';
  const LOCAL_URL = `http://${COMPUTER_IP}:5000`;
  
  // Production URL (when you deploy)
  const PRODUCTION_URL = 'https://your-backend-domain.com';
  
  // Use production URL if in production, otherwise use local
  if (__DEV__) {
    return LOCAL_URL;
  } else {
    return PRODUCTION_URL;
  }
};

const BASE_URL = getApiBaseUrl();

// Get user ID from AsyncStorage
const getUserId = async () => {
  try {
    console.log('🔍 Attempting to get user ID from AsyncStorage...');
    const user = await AsyncStorage.getItem('user');
    console.log('📦 Raw user data from AsyncStorage:', user);
    
    if (user) {
      const userData = JSON.parse(user);
      console.log('🔑 Parsed user data:', userData);
      const userId = userData.uid || userData.user_id;
      console.log('🆔 Extracted user ID:', userId);
      return userId;
    } else {
      console.log('❌ No user data found in AsyncStorage');
    }
    return null;
  } catch (error) {
    console.error('❌ Error getting user ID:', error);
    return null;
  }
};

// Helper function to handle API responses
const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};

// Helper function to make API requests
const makeRequest = async (url, options = {}) => {
  try {
    console.log('🌐 Making API request to:', url);
    const userId = await getUserId();
    console.log('👤 User ID for request:', userId);
    
    const headers = {
      'Content-Type': 'application/json',
      ...(userId && { 'X-User-ID': userId }),
      ...options.headers,
    };
    
    console.log('📋 Request headers:', headers);

    const response = await fetch(url, {
      headers,
      ...options,
    });
    
    console.log('📡 Response status:', response.status);
    return await handleResponse(response);
  } catch (error) {
    console.error('❌ API request failed:', error);
    
    // Provide more specific error messages
    if (error.message === 'Network request failed') {
      throw new Error(`Cannot connect to server. Make sure backend is running on ${BASE_URL}`);
    }
    
    throw error;
  }
};

export const communityApiService = {
  // Get all posts
  getPosts: async () => {
    try {
      const data = await makeRequest(`${BASE_URL}/api/community/posts`);
      if (data.success && data.data && data.data.posts) {
        return data.data.posts;
      }
      return [];
    } catch (error) {
      console.error('Error fetching posts:', error);
      throw new Error('Failed to fetch posts. Please check your connection.');
    }
  },

  // Create a new post
  createPost: async (content) => {
    if (!content || !content.trim()) {
      throw new Error('Post content cannot be empty');
    }

    try {
      const data = await makeRequest(`${BASE_URL}/api/community/posts`, {
        method: 'POST',
        body: JSON.stringify({ content: content.trim() }),
      });
      return data;
    } catch (error) {
      console.error('Error creating post:', error);
      throw new Error('Failed to create post. Please try again.');
    }
  },

  // Like a post
  likePost: async (postId) => {
    if (!postId) {
      throw new Error('Post ID is required');
    }

    try {
      const data = await makeRequest(`${BASE_URL}/api/community/posts/${postId}/like`, {
        method: 'POST',
      });
      return data;
    } catch (error) {
      console.error('Error liking post:', error);
      throw new Error('Failed to like post. Please try again.');
    }
  },

  // Reply to a post
  replyToPost: async (postId, text) => {
    if (!postId) {
      throw new Error('Post ID is required');
    }
    if (!text || !text.trim()) {
      throw new Error('Reply text cannot be empty');
    }

    try {
      const data = await makeRequest(`${BASE_URL}/api/community/posts/${postId}/replies`, {
        method: 'POST',
        body: JSON.stringify({ text: text.trim() }),
      });
      return data;
    } catch (error) {
      console.error('Error replying to post:', error);
      throw new Error('Failed to add reply. Please try again.');
    }
  },

  // Get a specific post with details
  getPost: async (postId) => {
    if (!postId) {
      throw new Error('Post ID is required');
    }

    try {
      const data = await makeRequest(`${BASE_URL}/api/community/posts/${postId}`);
      return data;
    } catch (error) {
      console.error('Error fetching post:', error);
      throw new Error('Failed to fetch post details.');
    }
  },

  // Get user's posts
  getMyPosts: async () => {
    try {
      const data = await makeRequest(`${BASE_URL}/api/community/my-posts`);
      if (data.success && data.data && data.data.posts) {
        return data.data.posts;
      }
      return [];
    } catch (error) {
      console.error('Error fetching my posts:', error);
      throw new Error('Failed to fetch your posts.');
    }
  },

  // Delete a post
  deletePost: async (postId) => {
    if (!postId) {
      throw new Error('Post ID is required');
    }

    try {
      const data = await makeRequest(`${BASE_URL}/api/community/posts/${postId}`, {
        method: 'DELETE',
      });
      return data;
    } catch (error) {
      console.error('Error deleting post:', error);
      throw new Error('Failed to delete post.');
    }
  },

  // Delete a reply
  deleteReply: async (postId, replyId) => {
    if (!postId || !replyId) {
      throw new Error('Post ID and Reply ID are required');
    }

    try {
      const data = await makeRequest(`${BASE_URL}/api/community/posts/${postId}/replies/${replyId}`, {
        method: 'DELETE',
      });
      return data;
    } catch (error) {
      console.error('Error deleting reply:', error);
      throw new Error('Failed to delete reply.');
    }
  },

  // Search posts
  searchPosts: async (query) => {
    if (!query || !query.trim()) {
      throw new Error('Search query is required');
    }

    try {
      const data = await makeRequest(`${BASE_URL}/api/community/search?q=${encodeURIComponent(query.trim())}`);
      if (data.success && data.data && data.data.posts) {
        return data.data.posts;
      }
      return [];
    } catch (error) {
      console.error('Error searching posts:', error);
      throw new Error('Failed to search posts.');
    }
  },

  // Get trending posts
  getTrendingPosts: async () => {
    try {
      const data = await makeRequest(`${BASE_URL}/api/community/trending`);
      if (data.success && data.data && data.data.posts) {
        return data.data.posts;
      }
      return [];
    } catch (error) {
      console.error('Error fetching trending posts:', error);
      throw new Error('Failed to fetch trending posts.');
    }
  },

  // Health check for the backend
  checkHealth: async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/community/health`);
      return response.ok;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  },

  // Get posts by a specific user
  getUserPosts: async (userId) => {
    if (!userId) {
      throw new Error('User ID is required');
    }

    try {
      const data = await makeRequest(`${BASE_URL}/api/community/users/${userId}/posts`);
      if (data.success && data.data && data.data.posts) {
        return data.data.posts;
      }
      return [];
    } catch (error) {
      console.error('Error fetching user posts:', error);
      throw new Error('Failed to fetch user posts.');
    }
  },

  // Test connection method
  testConnection: async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/community/health`);
      const data = await response.json();
      console.log('Community backend connection test successful:', data);
      return true;
    } catch (error) {
      console.error('Community backend connection test failed:', error);
      return false;
    }
  },
}; 