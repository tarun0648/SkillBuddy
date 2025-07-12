// services/Zuststand.js (Fixed for Backend Integration)
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from './apiService';

export const useAuthStore = create((set, get) => ({
  // State
  user: null,
  isLoggedIn: false,
  isLoading: false,
  showConfetti: false,
  needsOnboarding: false,
  
  // Actions
  login: async (email, password) => {
    set({ isLoading: true });
    
    try {
      console.log('Attempting login with:', email);
      const response = await apiService.login(email, password);
      console.log('Login response:', response);
      
      // Store user data locally
      await AsyncStorage.setItem('user_id', response.user_id);
      await AsyncStorage.setItem('user_email', response.user.email);
      await AsyncStorage.setItem('user_data', JSON.stringify(response.user));
      
      // Set user ID for future API calls
      apiService.setUserId(response.user_id);
      
      set({ 
        user: { 
          id: response.user_id,
          email: response.user.email, 
          name: response.user.profile?.name || response.user.email.split('@')[0],
          profile: response.user.profile || {}
        },
        isLoggedIn: true,
        isLoading: false,
        showConfetti: true
      });
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      set({ isLoading: false });
      return { success: false, error: error.message || 'Login failed!' };
    }
  },
  
  signup: async (email, password) => {
    console.log('Zustand signup called with email:', email);
    set({ isLoading: true });
    
    try {
      console.log('Attempting signup with:', email);
      const response = await apiService.register(email, password);
      console.log('Signup response:', response);
      
      // Store user data locally
      await AsyncStorage.setItem('user_id', response.user_id);
      await AsyncStorage.setItem('user_email', response.user.email);
      await AsyncStorage.setItem('user_data', JSON.stringify(response.user));
      
      // Set user ID for future API calls
      apiService.setUserId(response.user_id);
      
      set({ 
        user: { 
          id: response.user_id,
          email: response.user.email, 
          name: response.user.profile?.name || response.user.email.split('@')[0],
          profile: response.user.profile || {}
        },
        isLoggedIn: true,
        isLoading: false,
        showConfetti: true,
        needsOnboarding: true
      });
      
      console.log('Zustand signup completed successfully');
      return { success: true };
    } catch (error) {
      // console.error('Zustand signup error:', error);
      set({ isLoading: false });
      return { success: false, error: error.message || 'Could not create account!' };
    }
  },
  
  logout: async () => {
    try {
      // Call backend logout endpoint (optional)
      await apiService.logout();
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      // Clear stored data regardless of API call success
      await AsyncStorage.removeItem('user_id');
      await AsyncStorage.removeItem('user_email');
      await AsyncStorage.removeItem('user_data');
      
      // Clear API service user ID
      apiService.setUserId(null);
      
      set({ 
        user: null, 
        isLoggedIn: false,
        showConfetti: false
      });
    }
  },
  
  checkLogin: async () => {
    set({ isLoading: true });
    
    try {
      const userId = await AsyncStorage.getItem('user_id');
      const userEmail = await AsyncStorage.getItem('user_email');
      const userData = await AsyncStorage.getItem('user_data');
      
      if (userId && userEmail) {
        // Set user ID for API calls
        apiService.setUserId(userId);
        
        try {
          // Try to get updated profile from backend
          const profileResponse = await apiService.getProfile();
          
          set({ 
            user: { 
              id: userId,
              email: userEmail,
              name: profileResponse.user.profile?.name || userEmail.split('@')[0],
              profile: profileResponse.user.profile || {}
            },
            isLoggedIn: true,
            isLoading: false
          });
        } catch (error) {
          console.error('Failed to fetch profile, using cached data:', error);
          
          // Fallback to cached user data
          const cachedUser = userData ? JSON.parse(userData) : null;
          if (cachedUser) {
            set({ 
              user: { 
                id: userId,
                email: userEmail,
                name: cachedUser.profile?.name || userEmail.split('@')[0],
                profile: cachedUser.profile || {}
              },
              isLoggedIn: true,
              isLoading: false
            });
          } else {
            // No cached data, clear everything
            await get().logout();
          }
        }
      } else {
        set({ 
          user: null, 
          isLoggedIn: false,
          isLoading: false
        });
      }
    } catch (error) {
      console.error('Check login error:', error);
      set({ 
        user: null, 
        isLoggedIn: false,
        isLoading: false
      });
    }
  },
  
  updateUserProfile: async (profileData) => {
    try {
      console.log('Updating profile with:', profileData);
      const response = await apiService.updateProfile(profileData);
      console.log('Profile update response:', response);
      
      // Update local user state
      const currentUser = get().user;
      if (currentUser) {
        const updatedUser = {
          ...currentUser,
          profile: { ...currentUser.profile, ...profileData }
        };
        
        set({ user: updatedUser });
        
        // Update cached user data
        await AsyncStorage.setItem('user_data', JSON.stringify({ profile: updatedUser.profile }));
      }
      
      return { success: true, data: response };
    } catch (error) {
      console.error('Profile update error:', error);
      return { success: false, error: error.message || 'Profile update failed!' };
    }
  },
  
  hideConfetti: () => {
    set({ showConfetti: false });
  },
  
  // Helper method to get current user ID
  getCurrentUserId: () => {
    const { user } = get();
    return user?.id || null;
  },
  
  // Helper method to check if user is authenticated
  isAuthenticated: () => {
    const { isLoggedIn, user } = get();
    return isLoggedIn && user !== null;
  },
  
  // Refresh user data from backend
  refreshUserData: async () => {
    const { user } = get();
    if (!user) return;
    
    try {
      const profileResponse = await apiService.getProfile();
      
      set({ 
        user: { 
          ...user,
          profile: profileResponse.user.profile || {}
        }
      });
      
      // Update cached data
      await AsyncStorage.setItem('user_data', JSON.stringify(profileResponse.user));
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    }
  }
}));