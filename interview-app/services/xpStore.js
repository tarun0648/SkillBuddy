// services/xpStore.js
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from './apiService';

export const useXPStore = create((set, get) => ({
  // State
  totalXP: 0,
  level: 1,
  currentLevelXP: 0,
  xpToNextLevel: 100,
  recentGains: [],
  isLoading: false,
  error: null,
  userId: null,

  // Actions
  setUserId: (userId) => {
    set({ userId });
  },

  // Get storage key based on current user
  getStorageKey: () => {
    const { userId } = get();
    return userId ? `xpData_${userId}` : 'xpData';
  },

  // Load XP data from backend and cache
  loadXPData: async () => {
    const { userId } = get();
    
    // If no userId in store, try to get it from auth store
    if (!userId) {
      try {
        const { useAuthStore } = require('./Zuststand');
        const authStore = useAuthStore.getState();
        const authUserId = authStore.user?.id;
        if (authUserId) {
          set({ userId: authUserId });
          apiService.setUserId(authUserId);
        } else {
          console.log('XP Store: No user ID available, skipping XP load');
          return;
        }
      } catch (error) {
        console.error('XP Store: Error getting user ID from auth store:', error);
        return;
      }
    }

    set({ isLoading: true, error: null });

    try {
      console.log('XP Store: Loading XP data for user:', userId || get().userId);
      
      // Get XP data from backend
      const response = await apiService.getXP();
      console.log('XP Store: Backend response:', response);
      
      const xpData = {
        totalXP: response.total_xp || 0,
        level: response.level || 1,
        currentLevelXP: response.level_progress?.current_level_xp || 0,
        xpToNextLevel: response.level_progress?.xp_needed_for_next_level || 100,
        recentGains: response.recent_gains || []
      };

      console.log('XP Store: Processed XP data:', xpData);

      // Update state
      set(xpData);

      // Cache data locally
      const storageKey = get().getStorageKey();
      await AsyncStorage.setItem(storageKey, JSON.stringify(xpData));

    } catch (error) {
      console.error('Error loading XP data:', error);
      
      // Handle rate limit errors specifically
      if (error.message && error.message.includes('Rate limit exceeded')) {
        console.log('XP Store: Rate limit hit, using cached data');
        set({ error: 'Rate limit exceeded. Using cached data.' });
      } else {
        set({ error: error.message });
      }
      
      // Try to load from cache if backend fails
      try {
        const storageKey = get().getStorageKey();
        const cachedData = await AsyncStorage.getItem(storageKey);
        if (cachedData) {
          const parsedData = JSON.parse(cachedData);
          console.log('XP Store: Loading from cache:', parsedData);
          set(parsedData);
        }
      } catch (cacheError) {
        console.error('Error loading cached XP data:', cacheError);
      }
    } finally {
      set({ isLoading: false });
    }
  },

  // Add XP and sync with backend
  addXP: async (amount, source = 'Unknown') => {
    const { userId } = get();
    if (!userId || amount <= 0) return;

    set({ isLoading: true, error: null });

    try {
      // Update backend first
      const response = await apiService.updateXP(amount, source);
      
      // Update local state with backend response
      const newState = {
        totalXP: response.total_xp,
        level: response.level,
        currentLevelXP: response.level_progress?.current_level_xp || 0,
        xpToNextLevel: response.level_progress?.xp_needed_for_next_level || 100,
        recentGains: response.recent_gains || []
      };

      set(newState);

      // Cache updated data
      const storageKey = get().getStorageKey();
      await AsyncStorage.setItem(storageKey, JSON.stringify(newState));

      return response.gain;

    } catch (error) {
      console.error('Error adding XP:', error);
      set({ error: error.message });
      
      // Fallback: update local state only
      const currentState = get();
      const newTotalXP = currentState.totalXP + amount;
      const newLevel = Math.floor(newTotalXP / 100) + 1;
      const xpForCurrentLevel = (newLevel - 1) * 100;
      const xpInCurrentLevel = newTotalXP - xpForCurrentLevel;
      const xpNeededForNextLevel = 100 - xpInCurrentLevel;

      const newGain = {
        id: Date.now(),
        amount,
        source,
        timestamp: new Date().toISOString()
      };

      const newRecentGains = [newGain, ...currentState.recentGains.slice(0, 9)];

      const fallbackState = {
        totalXP: newTotalXP,
        level: newLevel,
        currentLevelXP: xpInCurrentLevel,
        xpToNextLevel: xpNeededForNextLevel,
        recentGains: newRecentGains
      };

      set(fallbackState);

      // Cache fallback data
      const storageKey = get().getStorageKey();
      await AsyncStorage.setItem(storageKey, JSON.stringify(fallbackState));

      return newGain;
    } finally {
      set({ isLoading: false });
    }
  },

  // Calculate level based on total XP
  calculateLevel: (xp) => {
    const level = Math.floor(xp / 100) + 1;
    const xpForCurrentLevel = (level - 1) * 100;
    const xpInCurrentLevel = xp - xpForCurrentLevel;
    const xpNeededForNextLevel = 100 - xpInCurrentLevel;

    return {
      level,
      currentLevelXP: xpInCurrentLevel,
      xpToNextLevel: xpNeededForNextLevel,
      progressPercentage: Math.round((xpInCurrentLevel / 100) * 100)
    };
  },

  // Get XP rewards for different actions
  getXPRewards: () => {
    return {
      INTERVIEW_COMPLETE: Math.floor(Math.random() * 50) + 50, // 50-100 XP
      PERFECT_INTERVIEW: Math.floor(Math.random() * 100) + 100, // 100-200 XP
      FIRST_INTERVIEW: 150,
      STREAK_BONUS: Math.floor(Math.random() * 30) + 20, // 20-50 XP
      FEEDBACK_GIVEN: 25,
      DAILY_LOGIN: 10,
      PROFILE_COMPLETE: 50,
      SOCIAL_LINKS_COMPLETE: 30
    };
  },

  // Get level badge information
  getLevelBadge: (userLevel) => {
    const badges = {
      1: { name: 'Rookie', icon: '🥉', color: '#CD7F32' },
      2: { name: 'Learner', icon: '📚', color: '#4A90E2' },
      3: { name: 'Practitioner', icon: '💪', color: '#7ED321' },
      4: { name: 'Professional', icon: '🎯', color: '#F5A623' },
      5: { name: 'Expert', icon: '⭐', color: '#BD10E0' },
      6: { name: 'Master', icon: '🏆', color: '#FFD700' },
      7: { name: 'Champion', icon: '👑', color: '#FF6B6B' },
      8: { name: 'Legend', icon: '🔥', color: '#FF4757' },
      9: { name: 'Mythic', icon: '💎', color: '#3742FA' },
      10: { name: 'Godlike', icon: '🌟', color: '#2F3542' }
    };
    
    if (userLevel >= 10) return badges[10];
    return badges[userLevel] || badges[1];
  },

  // Clear XP data (for logout)
  clearXPData: async () => {
    set({
      totalXP: 0,
      level: 1,
      currentLevelXP: 0,
      xpToNextLevel: 100,
      recentGains: [],
      isLoading: false,
      error: null,
      userId: null
    });
  },

  // Get computed values
  getProgressPercentage: () => {
    const { currentLevelXP } = get();
    return Math.round((currentLevelXP / 100) * 100);
  },

  getCurrentBadge: () => {
    const { level } = get();
    return get().getLevelBadge(level);
  }
})); 