// navigation/StackNavigator.js (Fixed for Backend Integration)
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuthStore } from '../services/Zuststand';
import AuthGuard from '../components/AuthGuard';

// Import your screens
import IntroScreen from '../screens/IntroScreen';
import AboutScreen from '../screens/AboutScreen';
import IntroQuestionScreen from '../screens/IntroQuestionScreen';
import HomeScreen from '../screens/HomeScreen';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SocialLinksScreen from '../screens/SocialLinksScreen';
import ResumeUploadScreen from '../screens/ResumeUploadScreen';
import AnalysisScreen from '../screens/AnalysisScreen';
import InterviewScreen from '../screens/InterviewScreen';
import InterviewResultsScreen from '../screens/InterviewResultsScreen';
import DataAnalystScreen from '../screens/DataAnalystScreen';
import DigitalMarketerScreen from '../screens/DigitalMarketerScreen';
import SoftwareDevScreen from '../screens/SoftwareDevScreen';
import UIDesignerScreen from '../screens/UIDesignerScreen';
import CommunityScreen from '../screens/CommunityScreen';

// Onboarding screens
import Step1Name from '../screens/onboarding/Step1Name';
import Step2Profession from '../screens/onboarding/Step2Profession';
import CareerChoicesScreen from '../screens/onboarding/step3careerchoices';
import Step4University from '../screens/onboarding/step4university';
import OnboardingComplete from '../screens/onboarding/OnboardingComplete';

const Stack = createStackNavigator();

// Create separate components to avoid inline function warning
const HomeScreenWithAuth = (props) => (
  <AuthGuard navigation={props.navigation}>
    <HomeScreen {...props} />
  </AuthGuard>
);

const ProfileScreenWithAuth = (props) => (
  <AuthGuard navigation={props.navigation}>
    <ProfileScreen {...props} />
  </AuthGuard>
);

const SocialLinksScreenWithAuth = (props) => (
  <AuthGuard navigation={props.navigation}>
    <SocialLinksScreen {...props} />
  </AuthGuard>
);

export default function StackNavigation() {
  const { isLoggedIn, isLoading, checkLogin, needsOnboarding } = useAuthStore();

  useEffect(() => {
    checkLogin();
  }, []);

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <NavigationContainer>
        <Stack.Navigator 
          initialRouteName="Intro"
          screenOptions={{
            headerShown: false,
            cardStyle: { backgroundColor: '#1A1A1A' },
            gestureEnabled: true,
            gestureDirection: 'horizontal',
          }}
        >
          <Stack.Screen name="Intro" component={IntroScreen} />
          <Stack.Screen name="About" component={AboutScreen} />
          <Stack.Screen name="Questions" component={IntroQuestionScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName={needsOnboarding ? "Step1" : (isLoggedIn ? "Home" : "Intro")}
        screenOptions={{
          headerShown: false, // Hide default headers for custom design
          cardStyle: { backgroundColor: '#1A1A1A' }, // Dark background
          gestureEnabled: true,
          gestureDirection: 'horizontal',
        }}
      >
        {/* Main Flow */}
        <Stack.Screen 
          name="Intro" 
          component={IntroScreen}
          options={{
            animationTypeForReplace: 'push',
          }}
        />
        
        <Stack.Screen 
          name="About" 
          component={AboutScreen}
          options={{
            gestureDirection: 'horizontal',
          }}
        />
        
        <Stack.Screen 
          name="Questions" 
          component={IntroQuestionScreen}
          options={{
            gestureDirection: 'horizontal',
          }}
        />
        
        <Stack.Screen 
          name="Home" 
          component={HomeScreenWithAuth}
          options={{
            gestureDirection: 'horizontal',
            gestureEnabled: false, // Disable swipe back gesture
            headerLeft: null, // Remove back button
            headerBackVisible: false, // Hide back button
          }}
        />

        {/* Authentication Screens */}
        <Stack.Screen 
          name="Login" 
          component={LoginScreen}
          options={{
            gestureDirection: 'horizontal',
          }}
        />
        <Stack.Screen 
          name="Signup" 
          component={SignupScreen}
          options={{
            gestureDirection: 'horizontal',
          }}
        />
        
        {/* Profile and Settings */}
        <Stack.Screen 
          name="Profile" 
          component={ProfileScreenWithAuth}
          options={{
            gestureDirection: 'horizontal',
          }}
        />
        
        <Stack.Screen 
          name="SocialLinks" 
          component={SocialLinksScreenWithAuth}
          options={{
            gestureDirection: 'horizontal',
          }}
        />
        
        <Stack.Screen 
          name="ResumeUpload" 
          component={ResumeUploadScreen}
          options={{
            gestureDirection: 'horizontal',
          }}
        />
        
        <Stack.Screen 
          name="AnalysisScreen" 
          component={AnalysisScreen}
          options={{
            gestureDirection: 'horizontal',
          }}
        />
        
        {/* Onboarding Flow */}
        <Stack.Screen 
          name="Step1" 
          component={Step1Name}
          options={{
            gestureDirection: 'horizontal',
          }}
        />
        
        <Stack.Screen 
          name="Step2" 
          component={Step2Profession}
          options={{
            gestureDirection: 'horizontal',
          }}
        />
        
        <Stack.Screen 
          name="Step3" 
          component={CareerChoicesScreen}
          options={{
            gestureDirection: 'horizontal',
          }}
        />
        
        <Stack.Screen 
          name="Step4" 
          component={Step4University}
          options={{
            gestureDirection: 'horizontal',
          }}
        />
        
        <Stack.Screen 
          name="OnboardingComplete" 
          component={OnboardingComplete}
          options={{
            gestureDirection: 'horizontal',
          }}
        />

        {/* Interview Flow */}
        <Stack.Screen 
          name="Interview" 
          component={InterviewScreen}
          options={{
            gestureDirection: 'horizontal',
          }}
        />
        
        <Stack.Screen 
          name="InterviewResults" 
          component={InterviewResultsScreen}
          options={{
            gestureDirection: 'horizontal',
          }}
        />

        {/* Career Path Screens */}
        <Stack.Screen 
          name="DataAnalyst" 
          component={DataAnalystScreen}
          options={{
            gestureDirection: 'horizontal',
          }}
        />
        
        <Stack.Screen 
          name="DigitalMarketer" 
          component={DigitalMarketerScreen}
          options={{
            gestureDirection: 'horizontal',
          }}
        />
        
        <Stack.Screen 
          name="SoftwareDev" 
          component={SoftwareDevScreen}
          options={{
            gestureDirection: 'horizontal',
          }}
        />
        
        <Stack.Screen 
          name="UIDesigner" 
          component={UIDesignerScreen}
          options={{
            gestureDirection: 'horizontal',
          }}
        />

        {/* Community Screen */}
        <Stack.Screen 
          name="Community" 
          component={CommunityScreen}
          options={{
            gestureDirection: 'horizontal',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}