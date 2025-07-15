// hooks/useProgress.js
import { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '../services/Zuststand';
import { useXPStore } from '../services/xpStore';
import apiService from '../services/apiService';

export const useProgress = () => {
  const { user, isAuthenticated } = useAuthStore();
  const { 
    totalXP, 
    level, 
    currentLevelXP, 
    xpToNextLevel, 
    recentGains,
    loadXPData,
    getProgressPercentage,
    getCurrentBadge,
    isLoading: xpLoading,
    error: xpError
  } = useXPStore();
  
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadProgressData = async () => {
    console.log('useProgress: loadProgressData called');
    console.log('useProgress: isAuthenticated:', isAuthenticated());
    console.log('useProgress: user:', user);
    console.log('useProgress: user?.id:', user?.id);
    
    if (!isAuthenticated() || !user?.id) {
      console.log('useProgress: Not authenticated or no user ID, skipping data load');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('useProgress: Setting user ID for API service');
      apiService.setUserId(user.id);
      
      // Set user ID in XP store
      const { setUserId } = useXPStore.getState();
      setUserId(user.id);

      // Load profile completion
      console.log('useProgress: Loading profile completion...');
      const completionResponse = await apiService.getProfileCompletion();
      console.log('useProgress: Profile completion response:', completionResponse);
      const completionStatus = completionResponse.completion_status || 0;
      console.log('useProgress: Setting profile completion to:', completionStatus);
      setProfileCompletion(completionStatus);

      // Load XP data using the store
      console.log('useProgress: Loading XP data...');
      await loadXPData();

    } catch (err) {
      console.error('useProgress: Error loading progress data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Force reload method for use after onboarding/profile update
  const reloadProgressData = async () => {
    setProfileCompletion(0);
    await loadProgressData();
  };

  // Calculate onboarding progress based on current step
  const getOnboardingProgress = (currentStep) => {
    switch (currentStep) {
      case 1: return 25;
      case 2: return 50;
      case 3: return 75;
      case 4: return 100;
      default: return 0;
    }
  };

  // Get profile completion percentage
  const getProfileCompletionPercentage = () => {
    return Math.round(profileCompletion);
  };

  // Get XP level progress percentage
  const getXPProgressPercentage = () => {
    return getProgressPercentage();
  };

  // Get current level
  const getCurrentLevel = () => {
    return level;
  };

  // Get total XP
  const getTotalXP = () => {
    return totalXP;
  };

  // Get current badge
  const getCurrentBadgeFromHook = () => {
    return getCurrentBadge();
  };

  useEffect(() => {
    loadProgressData();
  }, [user?.id]);

  // Use useMemo to make computed values reactive
  const computedValues = useMemo(() => ({
    profileCompletionPercentage: getProfileCompletionPercentage(),
    xpProgressPercentage: getXPProgressPercentage(),
    currentLevel: getCurrentLevel(),
    totalXP: getTotalXP()
  }), [profileCompletion, totalXP, level, getProgressPercentage]);

  return {
    // Data
    profileCompletion,
    xpData: {
      total_xp: totalXP,
      level: level,
      level_progress: {
        progress_percentage: getProgressPercentage(),
        current_level_xp: currentLevelXP,
        xp_needed_for_next_level: xpToNextLevel
      },
      recent_gains: recentGains
    },
    loading: loading || xpLoading,
    error: error || xpError,
    
    // Methods
    loadProgressData,
    reloadProgressData, // <-- Exported for forced reload
    getOnboardingProgress,
    getProfileCompletionPercentage,
    getXPProgressPercentage,
    getCurrentLevel,
    getTotalXP,
    getCurrentBadge: getCurrentBadgeFromHook,
    
    // Computed values (now reactive)
    ...computedValues
  };
}; 