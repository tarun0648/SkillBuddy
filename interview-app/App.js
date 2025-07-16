// App.js
import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { InterviewProvider } from './context/InterviewContext';
import { XPProvider } from './context/XPContext';
import { OnboardingProvider } from './context/OnboardingContext';
import StackNavigation from './navigation/StackNavigator';
import { useAuthStore } from './services/Zuststand';
import { useXPStore } from './services/xpStore';
import { useOnboardingStore } from './services/onboardingStore';

export default function App() {
  const { checkLogin, user } = useAuthStore();
  const { setUserId, loadXPData } = useXPStore();
  const { initializeOnboardingStore } = useOnboardingStore();

  useEffect(() => {
    // Check for existing login when app starts
    checkLogin();
  }, []);

  useEffect(() => {
    // Initialize stores when user changes
    if (user?.id) {
      setUserId(user.id);
      loadXPData();
      initializeOnboardingStore();
    }
  }, [user?.id]);

  return (
    <OnboardingProvider>
      <XPProvider>
        <InterviewProvider>
          <StackNavigation />
        </InterviewProvider>
      </XPProvider>
    </OnboardingProvider>
  );
}
