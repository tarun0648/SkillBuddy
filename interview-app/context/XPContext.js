// context/XPContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';

const XPContext = createContext();

export const useXP = () => {
  const context = useContext(XPContext);
  if (!context) {
    throw new Error('useXP must be used within an XPProvider');
  }
  return context;
};

export const XPProvider = ({ children }) => {
  const [totalXP, setTotalXP] = useState(0);
  const [level, setLevel] = useState(1);
  const [xpToNextLevel, setXpToNextLevel] = useState(100);
  const [currentLevelXP, setCurrentLevelXP] = useState(0);
  const [recentXPGains, setRecentXPGains] = useState([]);

  // Calculate level based on total XP
  const calculateLevel = (xp) => {
    // Each level requires progressively more XP
    // Level 1: 0-99 XP, Level 2: 100-299 XP, Level 3: 300-599 XP, etc.
    let currentLevel = 1;
    let xpNeeded = 100;
    let totalXpForLevel = 0;

    while (xp >= totalXpForLevel + xpNeeded) {
      totalXpForLevel += xpNeeded;
      currentLevel++;
      xpNeeded = currentLevel * 100; // Each level needs level * 100 XP
    }

    const currentLevelProgress = xp - totalXpForLevel;
    const nextLevelRequirement = xpNeeded;

    return {
      level: currentLevel,
      currentLevelXP: currentLevelProgress,
      xpToNextLevel: nextLevelRequirement - currentLevelProgress,
      nextLevelRequirement
    };
  };

  useEffect(() => {
    const levelData = calculateLevel(totalXP);
    setLevel(levelData.level);
    setCurrentLevelXP(levelData.currentLevelXP);
    setXpToNextLevel(levelData.xpToNextLevel);
  }, [totalXP]);

  const addXP = (amount, source = 'Unknown') => {
    setTotalXP(prev => prev + amount);
    
    // Track recent XP gains for display
    const newGain = {
      id: Date.now(),
      amount,
      source,
      timestamp: new Date().toISOString()
    };
    
    setRecentXPGains(prev => [newGain, ...prev.slice(0, 4)]); // Keep last 5 gains
    
    return newGain;
  };

  const getXPRewards = () => {
    // Different XP rewards for different actions
    return {
      INTERVIEW_COMPLETE: Math.floor(Math.random() * 50) + 50, // 50-100 XP
      PERFECT_INTERVIEW: Math.floor(Math.random() * 100) + 100, // 100-200 XP
      FIRST_INTERVIEW: 150,
      STREAK_BONUS: Math.floor(Math.random() * 30) + 20, // 20-50 XP
      FEEDBACK_GIVEN: 25,
      DAILY_LOGIN: 10
    };
  };

  const getLevelBadge = (userLevel) => {
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
  };

  const value = {
    totalXP,
    level,
    currentLevelXP,
    xpToNextLevel,
    recentXPGains,
    addXP,
    getXPRewards,
    getLevelBadge,
    calculateLevel
  };

  return (
    <XPContext.Provider value={value}>
      {children}
    </XPContext.Provider>
  );
};