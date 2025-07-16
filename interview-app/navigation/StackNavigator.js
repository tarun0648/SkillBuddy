// navigation/StackNavigator.js (Fixed for Backend Integration)
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuthStore } from '../services/Zuststand';
import AuthGuard from '../components/AuthGuard';
import { 
  getOnboardingScreenOptions, 
  getStandardScreenOptions,
  getModalScreenOptions 
} from '../utils/navigationUtils';

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
import GitHubUploadScreen from '../screens/GitHubUploadScreen';
import GitHubAnalysisResultsScreen from '../screens/GitHubAnalysisResultsScreen';
import GitHubHistoryScreen from '../screens/GitHubHistoryScreen';
import LinkedInAnalysisScreen from '../screens/LinkedInAnalysisScreen';
import LinkedInUploadScreen from '../screens/LinkedInUploadScreen';
import LinkedInAnalysisResultsScreen from '../screens/LinkedInAnalysisResultsScreen';
import LinkedInHistoryScreen from '../screens/LinkedInHistoryScreen';
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
                  screenOptions={getStandardScreenOptions()}
        >
          <Stack.Screen name="Intro" component={IntroScreen} />
          <Stack.Screen name="About" component={AboutScreen} />
          <Stack.Screen name="Questions" component={IntroQuestionScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
          
          {/* Include onboarding screens in loading stack - No Back Navigation */}
          <Stack.Screen 
            name="Step1" 
            component={Step1Name}
            options={getOnboardingScreenOptions()}
          />
          
          <Stack.Screen 
            name="Step2" 
            component={Step2Profession}
            options={getOnboardingScreenOptions()}
          />
          
          <Stack.Screen 
            name="Step3" 
            component={CareerChoicesScreen}
            options={getOnboardingScreenOptions()}
          />
          
          <Stack.Screen 
            name="Step4" 
            component={Step4University}
            options={getOnboardingScreenOptions()}
          />
          
          <Stack.Screen 
            name="OnboardingComplete" 
            component={OnboardingComplete}
            options={getOnboardingScreenOptions()}
          />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName={needsOnboarding ? "Step1" : (isLoggedIn ? "Home" : "Intro")}
        screenOptions={getStandardScreenOptions()}
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
          options={getStandardScreenOptions()}
        />
        
        <Stack.Screen 
          name="Questions" 
          component={IntroQuestionScreen}
          options={getStandardScreenOptions()}
        />
        
        <Stack.Screen 
          name="Home" 
          component={HomeScreenWithAuth}
          options={getStandardScreenOptions({
            gestureEnabled: false,
            headerLeft: null,
            headerBackVisible: false,
          })}
        />

        {/* Authentication Screens */}
        <Stack.Screen 
          name="Login" 
          component={LoginScreen}
          options={getStandardScreenOptions()}
        />
        <Stack.Screen 
          name="Signup" 
          component={SignupScreen}
          options={getStandardScreenOptions()}
        />
        
        {/* Profile and Settings */}
        <Stack.Screen 
          name="Profile" 
          component={ProfileScreenWithAuth}
          options={getStandardScreenOptions()}
        />
        
        <Stack.Screen 
          name="SocialLinks" 
          component={SocialLinksScreenWithAuth}
          options={getStandardScreenOptions()}
        />
        
        <Stack.Screen 
          name="ResumeUpload" 
          component={ResumeUploadScreen}
          options={getStandardScreenOptions()}
        />
        
        <Stack.Screen 
          name="GitHubUpload" 
          component={GitHubUploadScreen}
          options={getStandardScreenOptions()}
        />
        <Stack.Screen 
          name="GitHubAnalysisResults" 
          component={GitHubAnalysisResultsScreen}
          options={getStandardScreenOptions()}
        />
        
        <Stack.Screen 
          name="LinkedInAnalysis" 
          component={LinkedInAnalysisScreen}
          options={getStandardScreenOptions()}
        />
        
        <Stack.Screen 
          name="LinkedInUpload" 
          component={LinkedInUploadScreen}
          options={getStandardScreenOptions()}
        />
        
        <Stack.Screen 
          name="LinkedInAnalysisResults" 
          component={LinkedInAnalysisResultsScreen}
          options={getStandardScreenOptions()}
        />
        
        <Stack.Screen 
          name="GitHubHistory" 
          component={GitHubHistoryScreen}
          options={getStandardScreenOptions()}
        />
        
        <Stack.Screen 
          name="LinkedInHistory" 
          component={LinkedInHistoryScreen}
          options={getStandardScreenOptions()}
        />
        
        <Stack.Screen 
          name="AnalysisScreen" 
          component={AnalysisScreen}
          options={getStandardScreenOptions()}
        />
        
        {/* Onboarding Flow - Optimized Transitions */}
        <Stack.Screen 
          name="Step1" 
          component={Step1Name}
          options={getOnboardingScreenOptions()}
        />
        
        <Stack.Screen 
          name="Step2" 
          component={Step2Profession}
          options={getOnboardingScreenOptions()}
        />
        
        <Stack.Screen 
          name="Step3" 
          component={CareerChoicesScreen}
          options={getOnboardingScreenOptions()}
        />
        
        <Stack.Screen 
          name="Step4" 
          component={Step4University}
          options={getOnboardingScreenOptions()}
        />
        
        <Stack.Screen 
          name="OnboardingComplete" 
          component={OnboardingComplete}
          options={getOnboardingScreenOptions()}
        />

        {/* Interview Flow */}
        <Stack.Screen 
          name="Interview" 
          component={InterviewScreen}
          options={getStandardScreenOptions()}
        />
        
        <Stack.Screen 
          name="InterviewResults" 
          component={InterviewResultsScreen}
          options={getStandardScreenOptions()}
        />

        {/* Career Path Screens */}
        <Stack.Screen 
          name="DataAnalyst" 
          component={DataAnalystScreen}
          options={getStandardScreenOptions()}
        />
        
        <Stack.Screen 
          name="DigitalMarketer" 
          component={DigitalMarketerScreen}
          options={getStandardScreenOptions()}
        />
        
        <Stack.Screen 
          name="SoftwareDev" 
          component={SoftwareDevScreen}
          options={getStandardScreenOptions()}
        />
        
        <Stack.Screen 
          name="UIDesigner" 
          component={UIDesignerScreen}
          options={getStandardScreenOptions()}
        />

        {/* Community Screen */}
        <Stack.Screen 
          name="Community" 
          component={CommunityScreen}
          options={getStandardScreenOptions()}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}