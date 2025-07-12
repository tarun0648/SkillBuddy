// services/apiService.js (Fixed for Backend Integration)

// Get the correct base URL based on environment
const getApiBaseUrl = () => {
  // Replace with your actual computer IP address
  const COMPUTER_IP = '192.168.1.4'; // Updated IP address
  
  // Development URLs
  const LOCAL_URL = `http://${COMPUTER_IP}:5000/api`;
  
  // Production URL (when you deploy)
  const PRODUCTION_URL = 'https://your-backend-domain.com/api';
  
  // Use production URL if in production, otherwise use local
  if (__DEV__) {
    return LOCAL_URL;
  } else {
    return PRODUCTION_URL;
  }
};

const API_BASE_URL = getApiBaseUrl();

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.userId = null;
    
    // Log the API URL for debugging
    console.log('API Base URL:', this.baseURL);
  }

  setUserId(userId) {
    this.userId = userId;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add X-User-ID header if userId is available (for authenticated routes)
    if (this.userId) {
      config.headers['X-User-ID'] = this.userId;
    }

    try {
      console.log('Making API request to:', url);
      console.log('Request config:', config);
      
      const response = await fetch(url, config);
      
      // Handle non-JSON responses
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        data = { error: 'Invalid response format' };
      }

      if (!response.ok) {
        throw new Error(data.error || data.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      console.log('API response received:', data);
      return data;
    } catch (error) {
      // console.error('API Request failed:', error);
      
      // Provide more specific error messages
      if (error.message === 'Network request failed') {
        throw new Error(`Cannot connect to server. Make sure backend is running on ${this.baseURL}`);
      }
      
      throw error;
    }
  }

  // Test connection method
  async testConnection() {
    try {
      const response = await fetch(`${this.baseURL.replace('/api', '')}/`);
      const data = await response.json();
      console.log('Backend connection test successful:', data);
      return true;
    } catch (error) {
      console.error('Backend connection test failed:', error);
      return false;
    }
  }

  // Auth methods (no X-User-ID needed for these)
  async register(email, password) {
    console.log('API Service: Registering user with email:', email);
    console.log('API Service: Making request to:', `${this.baseURL}/auth/register`);
    
    try {
      const result = await this.request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      console.log('API Service: Register successful:', result);
      return result;
    } catch (error) {
      // console.error('API Service: Register failed:', error);
      throw error;
    }
  }

  async login(email, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async logout() {
    return this.request('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  // Profile methods (requires X-User-ID header)
  async updateProfile(profileData) {
    return this.request('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  async getProfile() {
    return this.request('/user/profile', {
      method: 'GET',
    });
  }

  async updateSocialLinks(socialLinks) {
    return this.request('/user/social-links', {
      method: 'PUT',
      body: JSON.stringify(socialLinks),
    });
  }

  async getSocialLinks() {
    return this.request('/user/social-links', {
      method: 'GET',
    });
  }

  async getXP() {
    return this.request('/user/xp', {
      method: 'GET',
    });
  }

  async getProfileCompletion() {
    return this.request('/user/profile/completion', {
      method: 'GET',
    });
  }

  async getXP() {
    return this.request('/user/xp', {
      method: 'GET',
    });
  }

  // Resume methods (requires X-User-ID header)
  async uploadResume(formData) {
    const url = `${this.baseURL}/resume/upload`;
    const config = {
      method: 'POST',
      headers: {
        // Don't set Content-Type for FormData, let browser set it
        ...(this.userId && { 'X-User-ID': this.userId }),
      },
      body: formData,
    };

    try {
      console.log('Making resume upload request to:', url);
      
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      console.log('Resume upload response received:', data);
      return data;
    } catch (error) {
      console.error('Resume upload failed:', error);
      throw error;
    }
  }

  async getResumeStatus(resumeId) {
    return this.request(`/resume/status/${resumeId}`, {
      method: 'GET',
    });
  }

  async getResumeResults(resumeId) {
    return this.request(`/resume/results/${resumeId}`, {
      method: 'GET',
    });
  }

  async getResumeQuestions(resumeId) {
    return this.request(`/resume/questions/${resumeId}`, {
      method: 'GET',
    });
  }

  async getResumeAnalysis(resumeId) {
    return this.request(`/resume/analysis/${resumeId}`, {
      method: 'GET',
    });
  }

  async getResumeSummary(resumeId) {
    return this.request(`/resume/summary/${resumeId}`, {
      method: 'GET',
    });
  }

  async getResumeQuality(resumeId) {
    return this.request(`/resume/quality/${resumeId}`, {
      method: 'GET',
    });
  }

  async getResumeImprovements(resumeId) {
    return this.request(`/resume/suggestions/${resumeId}`, {
      method: 'GET',
    });
  }

  async getUserResumes() {
    return this.request('/user/resumes', {
      method: 'GET',
    });
  }

  // Portfolio Analysis methods (requires X-User-ID header)
  async analyzePortfolio(portfolioUrl) {
    return this.request('/portfolio-analysis/analyze', {
      method: 'POST',
      body: JSON.stringify({ portfolio_url: portfolioUrl }),
    });
  }

  async getPortfolioAnalysisStatus(analysisId) {
    return this.request(`/portfolio-analysis/status/${analysisId}`, {
      method: 'GET',
    });
  }

  async getPortfolioAnalysisResults(analysisId) {
    return this.request(`/portfolio-analysis/results/${analysisId}`, {
      method: 'GET',
    });
  }

  // Interview methods (requires X-User-ID header)
  async getQuestions(careerPath, count = null) {
    const params = count ? `?count=${count}` : '';
    return this.request(`/interview/questions/${careerPath}${params}`, {
      method: 'GET',
    });
  }

  async submitInterview(interviewData) {
    return this.request('/interview/submit', {
      method: 'POST',
      body: JSON.stringify(interviewData),
    });
  }

  async getInterviewHistory() {
    return this.request('/interview/history', {
      method: 'GET',
    });
  }

  async getInterviewResults(interviewId) {
    return this.request(`/interview/results/${interviewId}`, {
      method: 'GET',
    });
  }

  // Generic file upload method
  async uploadFile(endpoint, formData) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      method: 'POST',
      headers: {
        // Don't set Content-Type for FormData
        ...(this.userId && { 'X-User-ID': this.userId }),
      },
      body: formData,
    };

    try {
      console.log('Making file upload request to:', url);
      
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      console.log('File upload response received:', data);
      return data;
    } catch (error) {
      console.error('File upload failed:', error);
      throw error;
    }
  }

  // Community methods
  async getCommunityPosts() {
    const COMMUNITY_BASE_URL = 'http://192.168.1.4:5001'; // Post service
    try {
      const response = await fetch(`${COMMUNITY_BASE_URL}/posts`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to fetch community posts:', error);
      throw error;
    }
  }

  async createCommunityPost(content) {
    const COMMUNITY_BASE_URL = 'http://192.168.1.4:5001'; // Post service
    try {
      const response = await fetch(`${COMMUNITY_BASE_URL}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to create community post:', error);
      throw error;
    }
  }

  async likeCommunityPost(postId) {
    const COMMUNITY_BASE_URL = 'http://192.168.1.4:5002'; // Like service
    try {
      const response = await fetch(`${COMMUNITY_BASE_URL}/like/${postId}`, {
        method: 'POST',
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to like community post:', error);
      throw error;
    }
  }

  async replyToCommunityPost(postId, text) {
    const COMMUNITY_BASE_URL = 'http://192.168.1.4:5003'; // Reply service
    try {
      const response = await fetch(`${COMMUNITY_BASE_URL}/reply/${postId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to reply to community post:', error);
      throw error;
    }
  }

  async getCommunityHealth() {
    const COMMUNITY_BASE_URL = 'http://192.168.1.4:5001'; // Post service
    try {
      const response = await fetch(`${COMMUNITY_BASE_URL}/health`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to check community health:', error);
      throw error;
    }
  }
}

export default new ApiService();