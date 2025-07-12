// hooks/useProgress.js
import { useState, useEffect } from 'react';
import { useAuthStore } from '../services/Zuststand';
import apiService from '../services/apiService';

export const useProgress = () => {
  const { user, isAuthenticated } = useAuthStore();
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [xpData, setXpData] = useState({
    total_xp: 0,
    level: 1,
    level_progress: {
      progress_percentage: 0
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadProgressData = async () => {
    if (!isAuthenticated() || !user?.id) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Load profile completion
      const completionResponse = await apiService.getProfileCompletion();
      setProfileCompletion(completionResponse.completion_status || 0);

      // Load XP data
      const xpResponse = await apiService.getXP();
      setXpData({
        total_xp: xpResponse.total_xp || 0,
        level: xpResponse.level || 1,
        level_progress: xpResponse.level_progress || { progress_percentage: 0 }
      });

    } catch (err) {
      console.error('Error loading progress data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
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
    return xpData.level_progress.progress_percentage || 0;
  };

  // Get current level
  const getCurrentLevel = () => {
    return xpData.level || 1;
  };

  // Get total XP
  const getTotalXP = () => {
    return xpData.total_xp || 0;
  };

  useEffect(() => {
    loadProgressData();
  }, [user?.id]);

  return {
    // Data
    profileCompletion,
    xpData,
    loading,
    error,
    
    // Methods
    loadProgressData,
    getOnboardingProgress,
    getProfileCompletionPercentage,
    getXPProgressPercentage,
    getCurrentLevel,
    getTotalXP,
    
    // Computed values
    profileCompletionPercentage: getProfileCompletionPercentage(),
    xpProgressPercentage: getXPProgressPercentage(),
    currentLevel: getCurrentLevel(),
    totalXP: getTotalXP()
  };
}; 