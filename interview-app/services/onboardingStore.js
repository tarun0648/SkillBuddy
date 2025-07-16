// services/onboardingStore.js
import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import apiService from './apiService';

export const useOnboardingStore = create((set, get) => ({
  // State
  onboardingData: {
    name: '',
    profession: '',
    career_choices: [],
    college_name: '',
    college_email: '',
  },
  currentStep: 1,
  isLoading: false,
  error: null,
  isOnboardingComplete: false,
  userId: null,
  onboardingSentDuringSignup: false, // Track if onboarding was sent during signup

  // Actions
  setUserId: (userId) => {
    set({ userId });
  },

  // Mark that onboarding data was sent during signup
  markOnboardingSentDuringSignup: () => {
    set({ onboardingSentDuringSignup: true });
  },

  // Get storage key based on current user
  getStorageKey: () => {
    const { userId } = get();
    return userId ? `onboardingData_${userId}` : 'onboardingData';
  },

  // Get completion key based on current user
  getCompletionKey: () => {
    const { userId } = get();
    return userId ? `onboardingComplete_${userId}` : 'onboardingComplete';
  },

  loadOnboardingData: async () => {
    try {
      const storageKey = get().getStorageKey();
      const savedData = await SecureStore.getItemAsync(storageKey);
      if (savedData) {
        set({ onboardingData: JSON.parse(savedData) });
      }
      
      const completionKey = get().getCompletionKey();
      const isComplete = await SecureStore.getItemAsync(completionKey);
      if (isComplete === 'true') {
        set({ isOnboardingComplete: true });
      }
    } catch (error) {
      console.error('Error loading onboarding data:', error);
    }
  },

  saveOnboardingData: async (data) => {
    try {
      const newData = { ...get().onboardingData, ...data };
      set({ onboardingData: newData });
      const storageKey = get().getStorageKey();
      await SecureStore.setItemAsync(storageKey, JSON.stringify(newData));
    } catch (error) {
      console.error('Error saving onboarding data:', error);
    }
  },

  // Send all onboarding data to backend
  sendOnboardingDataToBackend: async () => {
    set({ isLoading: true, error: null });

    try {
      const { onboardingData, userId } = get();
      
      // Try to get user ID from onboarding store first, then from auth store
      let currentUserId = userId;
      if (!currentUserId) {
        const { useAuthStore } = require('./Zuststand');
        const authStore = useAuthStore.getState();
        currentUserId = authStore.user?.id;
      }
      
      // Ensure we have a user ID for the API call
      if (!currentUserId) {
        throw new Error('User ID is required to save onboarding data');
      }

      console.log('Sending onboarding data to backend:', onboardingData);
      
      // Set user ID for API service
      apiService.setUserId(currentUserId);
      
      const response = await apiService.updateProfile(onboardingData);
      console.log('Onboarding data sent successfully:', response);
      return response;
    } catch (error) {
      console.error('Error sending onboarding data:', error);
      set({ error: error.message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  saveStep1Data: async (name) => {
    try {
      await get().saveOnboardingData({ name });
      set({ currentStep: 2 });
    } catch (error) {
      console.error('Error saving step 1 data:', error);
      throw error;
    }
  },

  saveStep2Data: async (profession) => {
    try {
      await get().saveOnboardingData({ profession });
      set({ currentStep: 3 });
    } catch (error) {
      console.error('Error saving step 2 data:', error);
      throw error;
    }
  },

  saveStep3Data: async (career_choices) => {
    try {
      await get().saveOnboardingData({ career_choices });
      set({ currentStep: 4 });
    } catch (error) {
      console.error('Error saving step 3 data:', error);
      throw error;
    }
  },

  saveStep4Data: async (college_name, college_email) => {
    try {
      await get().saveOnboardingData({ college_name, college_email });
      set({ currentStep: 5 });
    } catch (error) {
      console.error('Error saving step 4 data:', error);
      throw error;
    }
  },

  completeOnboarding: async () => {
    try {
      set({ isLoading: true, error: null });
      
      // Ensure we have the user ID set in onboarding store
      let { onboardingSentDuringSignup, userId } = get();
      if (!userId) {
        const { useAuthStore } = require('./Zuststand');
        const authStore = useAuthStore.getState();
        userId = authStore.user?.id;
        if (userId) {
          set({ userId });
        }
      }
      
      // If onboarding was already sent during signup, just mark as complete
      if (onboardingSentDuringSignup) {
        console.log('Onboarding data already sent during signup, marking as complete');
      } else {
        // Send all onboarding data to backend only if not sent during signup
        await get().sendOnboardingDataToBackend();
      }
      
      // Mark onboarding as complete
      const completionKey = get().getCompletionKey();
      await SecureStore.setItemAsync(completionKey, 'true');
      
      // Clear onboarding data from storage
      const storageKey = get().getStorageKey();
      await SecureStore.deleteItemAsync(storageKey);
      
      set({ 
        isOnboardingComplete: true,
        onboardingData: {
          name: '',
          profession: '',
          career_choices: [],
          college_name: '',
          college_email: '',
        },
        currentStep: 1,
        error: null,
        onboardingSentDuringSignup: false // Reset flag
      });
      
      // Refresh user data to update progress and XP
      const { useAuthStore } = require('./Zuststand');
      const authStore = useAuthStore.getState();
      await authStore.refreshUserData();
      
      console.log('Onboarding completed successfully');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      set({ error: error.message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  resetOnboarding: async () => {
    try {
      const storageKey = get().getStorageKey();
      const completionKey = get().getCompletionKey();
      
      await SecureStore.deleteItemAsync(storageKey);
      await SecureStore.deleteItemAsync(completionKey);
      
      set({ 
        onboardingData: {
          name: '',
          profession: '',
          career_choices: [],
          college_name: '',
          college_email: '',
        },
        currentStep: 1,
        error: null,
        isOnboardingComplete: false,
        onboardingSentDuringSignup: false
      });
    } catch (error) {
      console.error('Error resetting onboarding:', error);
    }
  },

  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
  setCurrentStep: (step) => set({ currentStep: step }),

  // Initialize onboarding store with user ID from auth store
  initializeOnboardingStore: async () => {
    try {
      const { useAuthStore } = require('./Zuststand');
      const authStore = useAuthStore.getState();
      const userId = authStore.user?.id;
      
      if (userId) {
        set({ userId });
        await get().loadOnboardingData();
      }
    } catch (error) {
      console.error('Error initializing onboarding store:', error);
    }
  },
})); 