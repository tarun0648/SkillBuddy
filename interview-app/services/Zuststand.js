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
      
      // Get complete user profile including social links
      try {
        const profileResponse = await apiService.getProfile();
        const socialLinksResponse = await apiService.getSocialLinks();
        
        const completeUserData = {
          ...response.user,
          profile: {
            ...response.user.profile,
            social_links: socialLinksResponse.social_links || {}
          }
        };
        
        // Store complete user data
        await AsyncStorage.setItem('user_data', JSON.stringify(completeUserData));
        
        set({ 
          user: { 
            id: response.user_id,
            email: response.user.email, 
            name: completeUserData.profile?.name || response.user.email.split('@')[0],
            profile: completeUserData.profile || {}
          },
          isLoggedIn: true,
          isLoading: false,
          showConfetti: true
        });
        
        // Ensure all user data is loaded
        setTimeout(async () => {
          try {
            await apiService.ensureUserDataLoaded();
            
            // Refresh other stores
            const { useXPStore } = require('./xpStore');
            const { useOnboardingStore } = require('./onboardingStore');
            
            const xpStore = useXPStore.getState();
            const onboardingStore = useOnboardingStore.getState();
            
            if (xpStore.loadXPData) {
              xpStore.loadXPData();
            }
            
            if (onboardingStore.loadOnboardingData) {
              onboardingStore.loadOnboardingData();
            }
          } catch (error) {
            console.error('Error loading additional user data:', error);
          }
        }, 100);
        
      } catch (profileError) {
        console.error('Failed to load complete profile, using basic data:', profileError);
        
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
      }
      
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
      // Get onboarding data from Zustand store
      const { useOnboardingStore } = require('./onboardingStore');
      const onboardingStore = useOnboardingStore.getState();
      const onboardingData = onboardingStore.onboardingData;
      
      console.log('Onboarding data to include in signup:', onboardingData);
      
      // Prepare registration data with onboarding information
      const registrationData = {
        email,
        password,
        name: onboardingData.name || '',
        profession: onboardingData.profession || '',
        career_choices: onboardingData.career_choices || [],
        college_name: onboardingData.college_name || '',
        college_email: onboardingData.college_email || ''
      };
      
      console.log('Attempting signup with complete data:', { email, hasOnboardingData: !!onboardingData.name });
      const response = await apiService.registerWithOnboarding(registrationData);
      console.log('Signup response:', response);
      
      // Store user data locally
      await AsyncStorage.setItem('user_id', response.user_id);
      await AsyncStorage.setItem('user_email', response.user.email);
      await AsyncStorage.setItem('user_data', JSON.stringify(response.user));
      
      // Set user ID for future API calls
      apiService.setUserId(response.user_id);
      
      // Set user ID in onboarding store for future use
      onboardingStore.setUserId(response.user_id);
      
      // Mark that onboarding data was sent during signup
      onboardingStore.markOnboardingSentDuringSignup();
      
      // Clear onboarding data from local storage since it's now in backend
      await onboardingStore.resetOnboarding();
      
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
        needsOnboarding: false // Set to false since onboarding data is included
      });
      
      console.log('Zustand signup completed successfully with onboarding data');
      return { success: true };
    } catch (error) {
      console.error('Zustand signup error:', error);
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
      // Clear authentication data but preserve some user context
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
          // Try to get updated profile and social links from backend
          const profileResponse = await apiService.getProfile();
          const socialLinksResponse = await apiService.getSocialLinks();
          
          const completeUserData = {
            ...profileResponse.user,
            profile: {
              ...profileResponse.user.profile,
              social_links: socialLinksResponse.social_links || {}
            }
          };
          
          // Update stored user data with fresh data
          await AsyncStorage.setItem('user_data', JSON.stringify(completeUserData));
          
          set({ 
            user: { 
              id: userId,
              email: userEmail,
              name: completeUserData.profile?.name || userEmail.split('@')[0],
              profile: completeUserData.profile || {}
            },
            isLoggedIn: true,
            isLoading: false
          });
          
          // Trigger data refresh for other stores
          setTimeout(() => {
            // Refresh XP data
            const { useXPStore } = require('./xpStore');
            const xpStore = useXPStore.getState();
            if (xpStore.loadXPData) {
              xpStore.loadXPData();
            }
            
            // Refresh onboarding data
            const { useOnboardingStore } = require('./onboardingStore');
            const onboardingStore = useOnboardingStore.getState();
            if (onboardingStore.loadOnboardingData) {
              onboardingStore.loadOnboardingData();
            }
          }, 100);
          
        } catch (error) {
          console.error('Failed to fetch profile, using cached data:', error);
          
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
      
      // Get fresh user data including social links
      try {
        const profileResponse = await apiService.getProfile();
        const socialLinksResponse = await apiService.getSocialLinks();
        
        const completeUserData = {
          ...profileResponse.user,
          profile: {
            ...profileResponse.user.profile,
            social_links: socialLinksResponse.social_links || {}
          }
        };
        
        // Update local storage with fresh data
        await AsyncStorage.setItem('user_data', JSON.stringify(completeUserData));
        
        // Update local user state
        const currentUser = get().user;
        set({ 
          user: { 
            ...currentUser,
            name: completeUserData.profile?.name || currentUser.email.split('@')[0],
            profile: completeUserData.profile || {}
          }
        });
      } catch (refreshError) {
        console.error('Failed to refresh user data after update:', refreshError);
        
        // Fallback to basic update
        const currentUser = get().user;
        set({ 
          user: { 
            ...currentUser,
            name: profileData.name || currentUser.email.split('@')[0],
            profile: {
              ...currentUser.profile,
              ...profileData
            }
          }
        });
      }
      
      return { success: true };
    } catch (error) {
      console.error('Profile update error:', error);
      return { success: false, error: error.message || 'Profile update failed!' };
    }
  },
  
  isAuthenticated: () => {
    return get().isLoggedIn && get().user !== null;
  },
  
  refreshUserData: async () => {
    const { user } = get();
    if (!user?.id) return;
    
    try {
      const profileResponse = await apiService.getProfile();
      const socialLinksResponse = await apiService.getSocialLinks();
      
      const completeUserData = {
        ...profileResponse.user,
        profile: {
          ...profileResponse.user.profile,
          social_links: socialLinksResponse.social_links || {}
        }
      };
      
      // Update local storage
      await AsyncStorage.setItem('user_data', JSON.stringify(completeUserData));
      
      // Update state
      set({ 
        user: { 
          ...user,
          name: completeUserData.profile?.name || user.email.split('@')[0],
          profile: completeUserData.profile || {}
        }
      });
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    }
  }
}));