// App.js
import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { InterviewProvider } from './context/InterviewContext';
import { XPProvider } from './context/XPContext';
import { OnboardingProvider } from './context/OnboardingContext';
import StackNavigation from './navigation/StackNavigator';
import { useAuthStore } from './services/Zuststand';

export default function App() {
  const { checkLogin } = useAuthStore();

  useEffect(() => {
    // Check for existing login when app starts
    checkLogin();
  }, []);

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
