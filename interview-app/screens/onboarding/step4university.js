import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  TouchableOpacity,
  Text,
  Alert,
  ActivityIndicator,
} from 'react-native';
import ProgressBar from '../../components/atoms/ProgressBar';
import GreenButton from '../../components/atoms/GreenButton';
import AnimatedBackground from '../../components/AnimatedBackground';
import RocketAnimation from '../../components/RocketAnimation';
import PageLayout from '../../components/layouts/PageLayout';
import { useOnboardingStore } from '../../services/onboardingStore';
import { useAuthStore } from '../../services/Zuststand';
import { useProgress } from '../../hooks/useProgress';

export default function CollegeInfoScreen({ navigation }) {
  const [collegeName, setCollegeName] = useState('');
  const [collegeEmail, setCollegeEmail] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);
  const inputRef = useRef(null);
  
  const { user } = useAuthStore();
  const { 
    onboardingData, 
    isLoading, 
    error, 
    saveStep4Data, 
    completeOnboarding,
    loadOnboardingData,
    setUserId,
    clearError 
  } = useOnboardingStore();
  
  const { getOnboardingProgress, loadProgressData, reloadProgressData } = useProgress();

  useEffect(() => {
    // Set user ID in onboarding store when user is available
    if (user?.id) {
      setUserId(user.id);
    }
    
    // Load saved onboarding data (but don't pre-fill)
    loadOnboardingData();
    
    // Don't pre-fill college info - start with empty fields
    setCollegeName('');
    setCollegeEmail('');
  }, [user?.id]);

  useEffect(() => {
    // Clear error when component mounts
    clearError();
  }, []);

  const isValidEmail = (email) => {
    // Stricter email regex: TLD must be 2-6 letters only
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    return emailRegex.test(email);
  };

  const handleNext = async () => {
    console.log('College:', collegeName, 'Email:', collegeEmail);

    if (collegeName.trim() === '') {
      Alert.alert('College Name Required', 'Please enter your college name.');
      return;
    }

    if (collegeEmail.trim() !== '' && !isValidEmail(collegeEmail)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    try {
      // Save step 4 data locally
      await saveStep4Data(collegeName.trim(), collegeEmail.trim());
      
      // Complete onboarding (data already sent during signup)
      await completeOnboarding();
      
      // Force reload progress data to update home screen
      await reloadProgressData();
      
      setShowConfetti(true);

      setTimeout(() => {
        navigation.replace('Signup');
      }, 3000);
    } catch (error) {
      console.error('Error completing onboarding:', error);
      Alert.alert(
        'Error', 
        'Failed to complete onboarding. Please check your connection and try again.',
        [{ text: 'OK' }]
      );
    }
  };

  if (showConfetti) {
    return (
      <RocketAnimation
        successText="Onboarding Complete!"
        subText="Welcome to Skill Buddy"
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <AnimatedBackground intensity="medium">
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <PageLayout message={"Please tell me your\neducation details."}>
              <View style={styles.innerContainer}>
                
                
                <View style={styles.progressContainer}>
                  <ProgressBar percent={getOnboardingProgress(4)} />
                </View>

                <View style={styles.centerSection}>
                  <TextInput
                    ref={inputRef}
                    style={styles.input}
                    value={collegeName}
                    placeholder="College Name"
                    placeholderTextColor="#999"
                    onChangeText={setCollegeName}
                    returnKeyType="next"
                    editable={!isLoading}
                  />
                  <TextInput
                    style={styles.input}
                    value={collegeEmail}
                    placeholder="College Email (optional)"
                    placeholderTextColor="#999"
                    onChangeText={setCollegeEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    returnKeyType="done"
                    editable={!isLoading}
                  />
                  
                  {error && (
                    <Text style={styles.errorText}>{error}</Text>
                  )}
                </View>
              </View>

              <View style={styles.absoluteButtonContainer}>
                <GreenButton
                  title={isLoading ? "Completing..." : "Complete"}
                  onPress={handleNext}
                  disabled={collegeName.trim() === '' || isLoading}
                />
                {isLoading && (
                  <ActivityIndicator 
                    size="small" 
                    color="#00ff00" 
                    style={styles.loadingIndicator}
                  />
                )}
              </View>
            </PageLayout>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </AnimatedBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000',
  },
  flex: {
    flex: 1,
  },
  innerContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingHorizontal: 20,
    paddingTop: 30, // ⬅️ to avoid overlap with mascot/chat
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },

  progressContainer: {
    alignItems: 'center',
    marginTop: 0,
    marginBottom: 10,
  },
  centerSection: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingTop: 120,
  },
  input: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 10,
    borderColor: '#00ff00',
    borderWidth: 2,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#000',
    fontSize: 16,
    marginBottom: 20,
  },
  absoluteButtonContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 50 : 30, // pushed higher to remain above keyboard
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 14,
    marginTop: 10,
    textAlign: 'center',
  },
  loadingIndicator: {
    marginTop: 10,
  },
});
