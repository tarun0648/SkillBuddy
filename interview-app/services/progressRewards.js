// services/progressRewards.js
import apiService from './apiService';

class ProgressRewardsService {
  // XP rewards for different activities
  static XP_REWARDS = {
    // Profile completion milestones
    PROFILE_25_PERCENT: 10,
    PROFILE_50_PERCENT: 15,
    PROFILE_75_PERCENT: 20,
    PROFILE_100_PERCENT: 50,
    
    // Social links milestones
    SOCIAL_LINKS_25_PERCENT: 5,
    SOCIAL_LINKS_50_PERCENT: 10,
    SOCIAL_LINKS_75_PERCENT: 15,
    SOCIAL_LINKS_100_PERCENT: 25,
    
    // Resume upload milestones
    FIRST_RESUME_UPLOAD: 20,
    RESUME_ANALYSIS_COMPLETE: 15,
    
    // Profile analysis milestones
    FIRST_GITHUB_ANALYSIS: 25,
    FIRST_LINKEDIN_ANALYSIS: 25,
    ANALYSIS_COMPLETE: 15,
    
    // Interview milestones
    FIRST_INTERVIEW: 50,
    INTERVIEW_COMPLETE: 25,
    PERFECT_INTERVIEW: 50,
    
    // Daily activities
    DAILY_LOGIN: 5,
    WEEKLY_ACTIVITY: 25,
    
    // Streak bonuses
    STREAK_3_DAYS: 10,
    STREAK_7_DAYS: 25,
    STREAK_30_DAYS: 100,
  };

  // Check and award profile completion XP
  static async checkProfileCompletionRewards(profileCompletion) {
    try {
      const milestones = [25, 50, 75, 100];
      let totalReward = 0;
      
      for (const milestone of milestones) {
        if (profileCompletion >= milestone) {
          const rewardKey = `PROFILE_${milestone}_PERCENT`;
          if (this.XP_REWARDS[rewardKey]) {
            totalReward += this.XP_REWARDS[rewardKey];
          }
        }
      }
      
      if (totalReward > 0) {
        await this.awardXP(totalReward, 'Profile Completion Milestone');
        return totalReward;
      }
      
      return 0;
    } catch (error) {
      console.error('Error checking profile completion rewards:', error);
      return 0;
    }
  }

  // Check and award social links XP
  static async checkSocialLinksRewards(socialLinksProgress) {
    try {
      const milestones = [25, 50, 75, 100];
      let totalReward = 0;
      
      for (const milestone of milestones) {
        if (socialLinksProgress >= milestone) {
          const rewardKey = `SOCIAL_LINKS_${milestone}_PERCENT`;
          if (this.XP_REWARDS[rewardKey]) {
            totalReward += this.XP_REWARDS[rewardKey];
          }
        }
      }
      
      if (totalReward > 0) {
        await this.awardXP(totalReward, 'Social Links Milestone');
        return totalReward;
      }
      
      return 0;
    } catch (error) {
      console.error('Error checking social links rewards:', error);
      return 0;
    }
  }

  // Check and award resume upload XP
  static async checkResumeUploadRewards(resumeStats) {
    try {
      let totalReward = 0;
      
      // First resume upload
      if (resumeStats.total_resumes >= 1) {
        totalReward += this.XP_REWARDS.FIRST_RESUME_UPLOAD;
      }
      
      // Resume analysis complete
      if (resumeStats.completed >= 1) {
        totalReward += this.XP_REWARDS.RESUME_ANALYSIS_COMPLETE;
      }
      
      if (totalReward > 0) {
        await this.awardXP(totalReward, 'Resume Upload Milestone');
        return totalReward;
      }
      
      return 0;
    } catch (error) {
      console.error('Error checking resume upload rewards:', error);
      return 0;
    }
  }

  // Check and award profile analysis XP
  static async checkProfileAnalysisRewards(analysisStats) {
    try {
      let totalReward = 0;
      
      // First GitHub analysis
      if (analysisStats.github_analyses >= 1) {
        totalReward += this.XP_REWARDS.FIRST_GITHUB_ANALYSIS;
      }
      
      // First LinkedIn analysis
      if (analysisStats.linkedin_analyses >= 1) {
        totalReward += this.XP_REWARDS.FIRST_LINKEDIN_ANALYSIS;
      }
      
      // Analysis complete
      if (analysisStats.completed >= 1) {
        totalReward += this.XP_REWARDS.ANALYSIS_COMPLETE;
      }
      
      if (totalReward > 0) {
        await this.awardXP(totalReward, 'Profile Analysis Milestone');
        return totalReward;
      }
      
      return 0;
    } catch (error) {
      console.error('Error checking profile analysis rewards:', error);
      return 0;
    }
  }

  // Check and award interview XP
  static async checkInterviewRewards(interviewStats) {
    try {
      let totalReward = 0;
      
      // First interview
      if (interviewStats.total_interviews >= 1) {
        totalReward += this.XP_REWARDS.FIRST_INTERVIEW;
      }
      
      // Interview complete
      if (interviewStats.completed_interviews >= 1) {
        totalReward += this.XP_REWARDS.INTERVIEW_COMPLETE;
      }
      
      if (totalReward > 0) {
        await this.awardXP(totalReward, 'Interview Milestone');
        return totalReward;
      }
      
      return 0;
    } catch (error) {
      console.error('Error checking interview rewards:', error);
      return 0;
    }
  }

  // Award XP for daily login
  static async awardDailyLoginXP() {
    try {
      const reward = this.XP_REWARDS.DAILY_LOGIN;
      await this.awardXP(reward, 'Daily Login');
      return reward;
    } catch (error) {
      console.error('Error awarding daily login XP:', error);
      return 0;
    }
  }

  // Award XP for weekly activity
  static async awardWeeklyActivityXP() {
    try {
      const reward = this.XP_REWARDS.WEEKLY_ACTIVITY;
      await this.awardXP(reward, 'Weekly Activity');
      return reward;
    } catch (error) {
      console.error('Error awarding weekly activity XP:', error);
      return 0;
    }
  }

  // Award XP for streak bonuses
  static async awardStreakBonusXP(streakDays) {
    try {
      let reward = 0;
      
      if (streakDays >= 30) {
        reward = this.XP_REWARDS.STREAK_30_DAYS;
      } else if (streakDays >= 7) {
        reward = this.XP_REWARDS.STREAK_7_DAYS;
      } else if (streakDays >= 3) {
        reward = this.XP_REWARDS.STREAK_3_DAYS;
      }
      
      if (reward > 0) {
        await this.awardXP(reward, `${streakDays}-Day Streak Bonus`);
        return reward;
      }
      
      return 0;
    } catch (error) {
      console.error('Error awarding streak bonus XP:', error);
      return 0;
    }
  }

  // Generic XP award method
  static async awardXP(amount, source) {
    try {
      const response = await apiService.updateXP(amount, source);
      console.log(`Awarded ${amount} XP for: ${source}`);
      return response;
    } catch (error) {
      console.error('Error awarding XP:', error);
      throw error;
    }
  }

  // Check all progress rewards at once
  static async checkAllProgressRewards(progressData) {
    try {
      const rewards = {
        profile: 0,
        socialLinks: 0,
        resume: 0,
        analysis: 0,
        interview: 0,
        total: 0
      };

      // Check each type of progress
      rewards.profile = await this.checkProfileCompletionRewards(progressData.profileCompletionPercentage);
      rewards.socialLinks = await this.checkSocialLinksRewards(progressData.socialLinksProgress);
      rewards.resume = await this.checkResumeUploadRewards(progressData.resumeStats);
      rewards.analysis = await this.checkProfileAnalysisRewards(progressData.analysisStats);
      rewards.interview = await this.checkInterviewRewards(progressData.interviewStats);

      // Calculate total
      rewards.total = Object.values(rewards).reduce((sum, value) => sum + value, 0);

      return rewards;
    } catch (error) {
      console.error('Error checking all progress rewards:', error);
      return {
        profile: 0,
        socialLinks: 0,
        resume: 0,
        analysis: 0,
        interview: 0,
        total: 0
      };
    }
  }

  // Get available rewards for display
  static getAvailableRewards() {
    return this.XP_REWARDS;
  }

  // Get next milestone for a given progress
  static getNextMilestone(currentProgress, milestoneType = 'profile') {
    const milestones = [25, 50, 75, 100];
    
    for (const milestone of milestones) {
      if (currentProgress < milestone) {
        return {
          milestone,
          progressNeeded: milestone - currentProgress,
          reward: this.XP_REWARDS[`${milestoneType.toUpperCase()}_${milestone}_PERCENT`] || 0
        };
      }
    }
    
    return null; // All milestones completed
  }
}

export default ProgressRewardsService; 