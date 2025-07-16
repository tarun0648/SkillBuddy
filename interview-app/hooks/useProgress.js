// hooks/useProgress.js
import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../services/Zuststand';
import { useXPStore } from '../services/xpStore';
import apiService from '../services/apiService';
import ProgressRewardsService from '../services/progressRewards';

export const useProgress = () => {
  const { user, isAuthenticated } = useAuthStore();
  const { totalXP, level, currentLevelXP, xpToNextLevel, loadXPData } = useXPStore();
  
  const [profileCompletionPercentage, setProfileCompletionPercentage] = useState(0);
  const [socialLinksProgress, setSocialLinksProgress] = useState(0);
  const [resumeProgress, setResumeProgress] = useState(0);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [interviewProgress, setInterviewProgress] = useState(0);
  const [overallProgress, setOverallProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [recentRewards, setRecentRewards] = useState([]);

  // Calculate profile completion based on backend logic
  const calculateProfileCompletion = useCallback((profile) => {
    if (!profile) return 0;
    
    let completion = 0;
    
    // Name: 16.67%
    if (profile.name && profile.name.trim()) {
      completion += 16.67;
    }
    
    // Profession: 33.33%
    if (profile.profession && profile.profession.trim()) {
      completion += 16.67; // Additional 16.67% (total 33.33%)
    }
    
    // Career choices: 50%
    if (profile.career_choices && profile.career_choices.length > 0) {
      completion += 16.67; // Additional 16.67% (total 50%)
    }
    
    // College info: 66.67%
    if (profile.college_name && profile.college_name.trim()) {
      completion += 16.67; // Additional 16.67% (total 66.67%)
    }
    
    // College email: 100%
    if (profile.college_email && profile.college_email.trim()) {
      completion += 33.33; // Additional 33.33% (total 100%)
    }
    
    return Math.min(100, Math.round(completion));
  }, []);

  // Calculate social links progress
  const calculateSocialLinksProgress = useCallback((socialLinks) => {
    if (!socialLinks) return 0;
    
    const socialPlatforms = ['github', 'linkedin', 'instagram', 'dribbble', 'resume', 'community', 'website'];
    const filledPlatforms = socialPlatforms.filter(platform => 
      socialLinks[platform] && socialLinks[platform].trim()
    );
    
    return Math.round((filledPlatforms.length / socialPlatforms.length) * 100);
  }, []);

  // Calculate resume progress
  const calculateResumeProgress = useCallback((resumeStats) => {
    if (!resumeStats) return 0;
    
    const { total_resumes, completed } = resumeStats;
    
    if (total_resumes === 0) return 0;
    if (completed >= 1) return 100; // At least one resume uploaded
    if (total_resumes > 0) return 50; // Resume uploaded but processing
    
    return 0;
  }, []);

  // Calculate analysis progress
  const calculateAnalysisProgress = useCallback((analysisStats) => {
    if (!analysisStats) return 0;
    
    const { total_analyses, completed } = analysisStats;
    
    if (total_analyses === 0) return 0;
    if (completed >= 1) return 100; // At least one analysis completed
    if (total_analyses > 0) return 50; // Analysis in progress
    
    return 0;
  }, []);

  // Calculate interview progress
  const calculateInterviewProgress = useCallback((interviewStats) => {
    if (!interviewStats) return 0;
    
    const { total_interviews, completed_interviews } = interviewStats;
    
    if (total_interviews === 0) return 0;
    if (completed_interviews >= 1) return 100; // At least one interview completed
    if (total_interviews > 0) return 50; // Interview in progress
    
    return 0;
  }, []);

  // Calculate overall progress (weighted average)
  const calculateOverallProgress = useCallback((
    profileCompletion,
    socialLinksProgress,
    resumeProgress,
    analysisProgress,
    interviewProgress
  ) => {
    const weights = {
      profile: 0.35,      // 35% - Most important
      socialLinks: 0.20,  // 20% - Important for networking
      resume: 0.20,       // 20% - Important for job applications
      analysis: 0.15,     // 15% - Good for self-assessment
      interview: 0.10     // 10% - Practice component
    };
    
    const weightedSum = 
      (profileCompletion * weights.profile) +
      (socialLinksProgress * weights.socialLinks) +
      (resumeProgress * weights.resume) +
      (analysisProgress * weights.analysis) +
      (interviewProgress * weights.interview);
    
    return Math.round(weightedSum);
  }, []);

  // Load all progress data
  const loadProgressData = useCallback(async () => {
    if (!isAuthenticated() || !user?.id) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Load profile data
      const profileResponse = await apiService.getProfile();
      const profile = profileResponse.user?.profile || {};
      const profileCompletion = calculateProfileCompletion(profile);
      setProfileCompletionPercentage(profileCompletion);

      // Load social links
      try {
        const socialLinksResponse = await apiService.getSocialLinks();
        const socialLinks = socialLinksResponse.social_links || {};
        const socialLinksProgress = calculateSocialLinksProgress(socialLinks);
        setSocialLinksProgress(socialLinksProgress);
      } catch (error) {
        console.warn('Failed to load social links:', error);
        setSocialLinksProgress(0);
      }

      // Load resume statistics
      try {
        const resumeResponse = await apiService.getUserResumes();
        const resumeStats = resumeResponse.statistics || {};
        const resumeProgress = calculateResumeProgress(resumeStats);
        setResumeProgress(resumeProgress);
      } catch (error) {
        console.warn('Failed to load resume stats:', error);
        setResumeProgress(0);
      }

      // Load analysis statistics
      try {
        const analysisResponse = await apiService.getUserAnalyses();
        const analysisStats = analysisResponse.statistics || {};
        const analysisProgress = calculateAnalysisProgress(analysisStats);
        setAnalysisProgress(analysisProgress);
      } catch (error) {
        console.warn('Failed to load analysis stats:', error);
        setAnalysisProgress(0);
      }

      // Load interview statistics (placeholder - implement when available)
      const interviewProgress = 0; // TODO: Implement when interview stats endpoint is available
      setInterviewProgress(interviewProgress);

      // Calculate overall progress
      const overallProgress = calculateOverallProgress(
        profileCompletion,
        socialLinksProgress,
        resumeProgress,
        analysisProgress,
        interviewProgress
      );
      setOverallProgress(overallProgress);

    } catch (error) {
      console.error('Error loading progress data:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user?.id, calculateProfileCompletion, calculateSocialLinksProgress, calculateResumeProgress, calculateAnalysisProgress, calculateInterviewProgress, calculateOverallProgress]);

  // Load XP data
  const loadXPDataWithProgress = useCallback(async () => {
    try {
      await loadXPData();
    } catch (error) {
      console.warn('Failed to load XP data:', error);
    }
  }, [loadXPData]);

  // Check and award progress rewards
  const checkProgressRewards = useCallback(async (progressData) => {
    try {
      const rewards = await ProgressRewardsService.checkAllProgressRewards(progressData);
      
      // Track recent rewards
      if (rewards.total > 0) {
        const newReward = {
          id: Date.now(),
          amount: rewards.total,
          source: 'Progress Milestone',
          timestamp: new Date().toISOString(),
          breakdown: rewards
        };
        
        setRecentRewards(prev => [newReward, ...prev.slice(0, 4)]);
      }
      
      return rewards;
    } catch (error) {
      console.error('Error checking progress rewards:', error);
      return { total: 0 };
    }
  }, []);

  // Get progress breakdown for display
  const getProgressBreakdown = useCallback(() => {
    return {
      profile: {
        percentage: profileCompletionPercentage,
        label: 'Profile Completion',
        description: 'Basic profile information',
        icon: '👤'
      },
      socialLinks: {
        percentage: socialLinksProgress,
        label: 'Social Links',
        description: 'Professional networking profiles',
        icon: '🔗'
      },
      resume: {
        percentage: resumeProgress,
        label: 'Resume Upload',
        description: 'Resume and portfolio files',
        icon: '📄'
      },
      analysis: {
        percentage: analysisProgress,
        label: 'Profile Analysis',
        description: 'LinkedIn and GitHub analysis',
        icon: '📊'
      },
      interview: {
        percentage: interviewProgress,
        label: 'Interview Practice',
        description: 'Mock interview sessions',
        icon: '🎯'
      },
      overall: {
        percentage: overallProgress,
        label: 'Overall Progress',
        description: 'Complete profile readiness',
        icon: '⭐'
      }
    };
  }, [profileCompletionPercentage, socialLinksProgress, resumeProgress, analysisProgress, interviewProgress, overallProgress]);

  // Get XP progress information
  const getXPProgress = useCallback(() => {
    return {
      totalXP,
      level,
      currentLevelXP,
      xpToNextLevel,
      xpProgressPercentage: xpToNextLevel > 0 ? Math.round(((level * 100) - xpToNextLevel) / (level * 100) * 100) : 100
    };
  }, [totalXP, level, currentLevelXP, xpToNextLevel]);

  // Load data on mount and when user changes
  useEffect(() => {
    if (isAuthenticated() && user?.id) {
      loadProgressData();
      loadXPDataWithProgress();
    }
  }, [isAuthenticated, user?.id, loadProgressData, loadXPDataWithProgress]);

  // Check rewards when progress data changes
  useEffect(() => {
    if (isAuthenticated() && user?.id && overallProgress > 0) {
      const progressData = {
        profileCompletionPercentage,
        socialLinksProgress,
        resumeProgress,
        analysisProgress,
        interviewProgress
      };
      
      // Check rewards asynchronously
      checkProgressRewards(progressData);
    }
  }, [profileCompletionPercentage, socialLinksProgress, resumeProgress, analysisProgress, interviewProgress, checkProgressRewards]);

  return {
    // Progress percentages
    profileCompletionPercentage,
    socialLinksProgress,
    resumeProgress,
    analysisProgress,
    interviewProgress,
    overallProgress,
    
    // XP information
    ...getXPProgress(),
    
    // Loading and error states
    isLoading,
    error,
    
    // Functions
    loadProgressData,
    loadXPDataWithProgress,
    getProgressBreakdown,
    checkProgressRewards,
    
    // Progress breakdown
    progressBreakdown: getProgressBreakdown(),
    
    // Recent rewards
    recentRewards
  };
}; 