// screens/onboarding/Step1Name.js
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useOnboarding } from '../../context/OnboardingContext';
import { useAuthStore } from '../../services/Zuststand';
import AnimatedBackground from '../../components/AnimatedBackground';
import PageLayout from '../../components/layouts/PageLayout';
import ProgressBar from '../../components/atoms/ProgressBar';
import { useProgress } from '../../hooks/useProgress';

export default function Step1Name() {
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const { saveStep1Data, onboardingData, isLoading, error } = useOnboarding();
  const { getOnboardingProgress } = useProgress();
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    // Load existing name if available and user is authenticated
    if (onboardingData.name && user?.id) {
      setName(onboardingData.name);
    } else {
      // Clear name if no user or no onboarding data
      setName('');
    }
  }, [onboardingData, user?.id]);

  const validateName = (inputName) => {
    const trimmedName = inputName.trim();
    
    if (!trimmedName) {
      setNameError('Name is required');
      return false;
    }
    
    if (trimmedName.length < 2) {
      setNameError('Name must be at least 2 characters');
      return false;
    }
    
    if (trimmedName.length > 50) {
      setNameError('Name must be less than 50 characters');
      return false;
    }
    
    // Check for invalid characters (only letters, spaces, hyphens, and apostrophes)
    const nameRegex = /^[a-zA-Z\s\-']+$/;
    if (!nameRegex.test(trimmedName)) {
      setNameError('Name can only contain letters, spaces, hyphens, and apostrophes');
      return false;
    }
    
    setNameError('');
    return true;
  };

  const handleNext = async () => {
    if (!validateName(name)) {
      return;
    }

    try {
      await saveStep1Data(name);
      navigation.navigate('Step2');
    } catch (error) {
      console.error('Error saving name:', error);
      Alert.alert('Error', 'Failed to save your name. Please try again.');
    }
  };

  const handleSkip = () => {
    Alert.alert(
      'Skip Name',
      'Are you sure you want to skip adding your name? You can add it later in your profile.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Skip', 
          style: 'destructive',
          onPress: () => navigation.navigate('Step2')
        }
      ]
    );
  };

  const handleChangeText = (text) => {
    setName(text);
    if (nameError) {
      validateName(text);
    }
  };

  const handleKeyboardDismiss = () => Keyboard.dismiss();

  const isButtonEnabled = name.trim().length > 0 && !isLoading;

  return (
    <SafeAreaView style={styles.safeArea}>
      <AnimatedBackground intensity="medium">
        <PageLayout message={"What's your name?\nLet's get to know you!"}>
          <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
          >
            <TouchableWithoutFeedback onPress={handleKeyboardDismiss} accessible={false}>
              <View style={styles.flex}>
                <View style={styles.innerSafeContainer}>

                  {/* Progress Indicator */}
                  <View style={styles.progressContainer}>
                    <ProgressBar percent={getOnboardingProgress(1)} />
                  </View>

                  {/* Center Section with Input */}
                  <View style={styles.centerSection}>
                    <TextInput
                      ref={inputRef}
                      style={[
                        styles.input,
                        nameError ? styles.inputError : null
                      ]}
                      value={name}
                      onChangeText={handleChangeText}
                      placeholder="Enter your full name"
                      placeholderTextColor="#666"
                      autoCapitalize="words"
                      autoCorrect={false}
                      maxLength={50}
                      returnKeyType="done"
                      onSubmitEditing={handleNext}
                      editable={!isLoading}
                      accessible={true}
                      accessibilityLabel="Enter your name"
                      accessibilityRole="text"
                    />
                    {nameError ? (
                      <Text style={styles.errorText}>{nameError}</Text>
                    ) : null}
                  </View>

                  {/* Error Message */}
                  {error && (
                    <View style={styles.errorContainer}>
                      <Text style={styles.errorMessage}>{error}</Text>
                    </View>
                  )}
                </View>

                {/* Absolute Button Container */}
                <View style={styles.absoluteButtonContainer}>
                  <TouchableOpacity
                    style={[
                      styles.nextButton,
                      !isButtonEnabled && styles.nextButtonDisabled
                    ]}
                    onPress={handleNext}
                    disabled={!isButtonEnabled}
                    accessible={true}
                    accessibilityLabel="Proceed to next step"
                    accessibilityRole="button"
                  >
                    {isLoading ? (
                      <View style={styles.loadingContainer}>
                        <ActivityIndicator size="small" color="#000" />
                        <Text style={styles.nextButtonText}>Saving...</Text>
                      </View>
                    ) : (
                      <Text style={styles.nextButtonText}>Next</Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.skipButton}
                    onPress={handleSkip}
                    disabled={isLoading}
                  >
                    <Text style={styles.skipButtonText}>Skip for now</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </PageLayout>
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
  innerSafeContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingHorizontal: 20,
    paddingTop: 30,
  },

  progressContainer: {
    alignItems: 'center',
    marginTop: 0,
    marginBottom: 40,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    color: '#ccc',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  centerSection: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    width: '100%',
    paddingTop: 60,
  },
  input: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#00ff00',
    paddingHorizontal: 20,
    paddingVertical: 18,
    fontSize: 18,
    color: '#000',
    textAlign: 'center',
  },
  inputError: {
    borderColor: '#ff0000',
  },
  errorText: {
    color: '#ff0000',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
  },
  errorMessage: {
    color: '#ff0000',
    fontSize: 14,
    textAlign: 'center',
  },
  absoluteButtonContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 20 : 30,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  nextButton: {
    backgroundColor: '#00ff00',
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 15,
    width: '100%',
  },
  nextButtonDisabled: {
    backgroundColor: '#666',
  },
  nextButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  skipButton: {
    backgroundColor: 'transparent',
    paddingVertical: 12,
    alignItems: 'center',
  },
  skipButtonText: {
    color: '#999',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
});