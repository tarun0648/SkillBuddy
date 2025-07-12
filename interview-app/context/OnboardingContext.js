// context/OnboardingContext.js (No API calls during onboarding)
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../services/Zuststand';

const OnboardingContext = createContext();

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};

export const OnboardingProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [onboardingData, setOnboardingData] = useState({
    name: '',
    profession: '',
    career_choices: [],
    college_name: '',
    college_email: '',
  });

  // Get storage key based on current user
  const getStorageKey = () => {
    return user?.id ? `onboardingData_${user.id}` : 'onboardingData';
  };

  useEffect(() => {
    loadOnboardingData();
  }, [user?.id]); // Reload when user ID changes

  const loadOnboardingData = async () => {
    try {
      const storageKey = getStorageKey();
      const storedData = await AsyncStorage.getItem(storageKey);
      
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        setOnboardingData(parsedData);
        
        // Determine current step based on completed data
        if (parsedData.college_name && parsedData.college_email) {
          setCurrentStep(5);
        } else if (parsedData.career_choices && parsedData.career_choices.length > 0) {
          setCurrentStep(4);
        } else if (parsedData.profession) {
          setCurrentStep(3);
        } else if (parsedData.name) {
          setCurrentStep(2);
        } else {
          setCurrentStep(1);
        }
      } else {
        // No stored data for this user, reset to initial state
        setOnboardingData({
          name: '',
          profession: '',
          career_choices: [],
          college_name: '',
          college_email: '',
        });
        setCurrentStep(1);
      }
    } catch (error) {
      console.error('Error loading onboarding data:', error);
      // Reset to initial state on error
      setOnboardingData({
        name: '',
        profession: '',
        career_choices: [],
        college_name: '',
        college_email: '',
      });
      setCurrentStep(1);
    }
  };

  const saveOnboardingData = async (data) => {
    try {
      const updatedData = { ...onboardingData, ...data };
      setOnboardingData(updatedData);
      const storageKey = getStorageKey();
      await AsyncStorage.setItem(storageKey, JSON.stringify(updatedData));
    } catch (error) {
      console.error('Error saving onboarding data:', error);
    }
  };

  const saveStep1Data = async (name) => {
    try {
      if (!name || !name.trim()) {
        throw new Error('Name is required');
      }

      await saveOnboardingData({ name: name.trim() });
      setCurrentStep(2);
    } catch (error) {
      console.error('Error saving step 1 data:', error);
      setError(error.message);
      throw error;
    }
  };

  const saveStep2Data = async (profession) => {
    try {
      if (!profession) {
        throw new Error('Profession is required');
      }

      const validProfessions = ['Student', 'Graduate', 'Post Graduate', 'Professional', 'Switch Career'];
      if (!validProfessions.includes(profession)) {
        throw new Error('Invalid profession selected');
      }

      await saveOnboardingData({ profession });
      setCurrentStep(3);
    } catch (error) {
      console.error('Error saving step 2 data:', error);
      setError(error.message);
      throw error;
    }
  };

  const saveStep3Data = async (career_choices) => {
    try {
      if (!career_choices || !Array.isArray(career_choices) || career_choices.length === 0) {
        throw new Error('Please select at least one career choice');
      }

      if (career_choices.length > 3) {
        throw new Error('You can select up to 3 career choices');
      }

      await saveOnboardingData({ career_choices });
      setCurrentStep(4);
    } catch (error) {
      console.error('Error saving step 3 data:', error);
      setError(error.message);
      throw error;
    }
  };

  const saveStep4Data = async (college_name, college_email) => {
    try {
      // Validate inputs
      if (!college_name || !college_name.trim()) {
        throw new Error('College name is required');
      }

      if (!college_email || !college_email.trim()) {
        throw new Error('College email is required');
      }

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(college_email.trim())) {
        throw new Error('Please enter a valid email address');
      }

      const profileData = {
        college_name: college_name.trim(),
        college_email: college_email.trim()
      };

      await saveOnboardingData(profileData);
      setCurrentStep(5);
    } catch (error) {
      console.error('Error saving step 4 data:', error);
      setError(error.message);
      throw error;
    }
  };

  const completeOnboarding = async () => {
    try {
      setIsLoading(true);
      
      // Mark onboarding as complete for this user
      const completionKey = user?.id ? `onboardingComplete_${user.id}` : 'onboardingComplete';
      await AsyncStorage.setItem(completionKey, 'true');
      
      // Clear onboarding data from storage for this user
      const storageKey = getStorageKey();
      await AsyncStorage.removeItem(storageKey);
      
      // Reset state
      setOnboardingData({
        name: '',
        profession: '',
        career_choices: [],
        college_name: '',
        college_email: '',
      });
      setCurrentStep(1);
      setError(null);
      setIsLoading(false);
      
      console.log('Onboarding completed successfully');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      setError(error.message);
      setIsLoading(false);
      throw error;
    }
  };

  const resetOnboarding = async () => {
    try {
      const storageKey = getStorageKey();
      const completionKey = user?.id ? `onboardingComplete_${user.id}` : 'onboardingComplete';
      
      await AsyncStorage.removeItem(storageKey);
      await AsyncStorage.removeItem(completionKey);
      
      setOnboardingData({
        name: '',
        profession: '',
        career_choices: [],
        college_name: '',
        college_email: '',
      });
      setCurrentStep(1);
      setError(null);
      setIsLoading(false);
    } catch (error) {
      console.error('Error resetting onboarding:', error);
    }
  };

  const skipToStep = (step) => {
    if (step >= 1 && step <= 5) {
      setCurrentStep(step);
    }
  };

  const isStepComplete = (step) => {
    switch (step) {
      case 1:
        return !!onboardingData.name;
      case 2:
        return !!onboardingData.profession;
      case 3:
        return onboardingData.career_choices && onboardingData.career_choices.length > 0;
      case 4:
        return !!onboardingData.college_name && !!onboardingData.college_email;
      default:
        return false;
    }
  };

  const getCompletionPercentage = () => {
    let completedSteps = 0;
    for (let i = 1; i <= 4; i++) {
      if (isStepComplete(i)) {
        completedSteps++;
      }
    }
    return (completedSteps / 4) * 100;
  };

  const canSyncToBackend = () => {
    return isAuthenticated() && onboardingData && Object.values(onboardingData).some(value => 
      value && (Array.isArray(value) ? value.length > 0 : true)
    );
  };

  const isOnboardingComplete = async () => {
    try {
      const completionKey = user?.id ? `onboardingComplete_${user.id}` : 'onboardingComplete';
      const isComplete = await AsyncStorage.getItem(completionKey);
      return isComplete === 'true';
    } catch (error) {
      console.error('Error checking onboarding completion:', error);
      return false;
    }
  };

  return (
    <OnboardingContext.Provider
      value={{
        currentStep,
        onboardingData,
        isLoading,
        error,
        saveStep1Data,
        saveStep2Data,
        saveStep3Data,
        saveStep4Data,
        completeOnboarding,
        resetOnboarding,
        skipToStep,
        isStepComplete,
        getCompletionPercentage,
        canSyncToBackend,
        isOnboardingComplete,
        setError,
        clearError: () => setError(null),
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
};