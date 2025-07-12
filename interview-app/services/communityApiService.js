const BASE_URL = 'http://192.168.1.4:5001';

export const communityApiService = {
  // Get all posts
  getPosts: async () => {
    try {
      const response = await fetch(`${BASE_URL}/posts`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching posts:', error);
      throw error;
    }
  },

  // Create a new post
  createPost: async (content) => {
    try {
      const response = await fetch(`${BASE_URL}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  },

  // Like a post
  likePost: async (postId) => {
    try {
      const response = await fetch(`http://192.168.1.4:5002/like/${postId}`, {
        method: 'POST',
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error liking post:', error);
      throw error;
    }
  },

  // Reply to a post
  replyToPost: async (postId, text) => {
    try {
      const response = await fetch(`http://192.168.1.4:5003/reply/${postId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error replying to post:', error);
      throw error;
    }
  },
}; 