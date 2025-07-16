// screens/onboarding/Step1Name.js
import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
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
  BackHandler,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useOnboardingStore } from '../../services/onboardingStore';
import { useAuthStore } from '../../services/Zuststand';
import AnimatedBackground from '../../components/AnimatedBackground';
import PageLayout from '../../components/layouts/PageLayout';
import ProgressBar from '../../components/atoms/ProgressBar';
import { useProgress } from '../../hooks/useProgress';

const Step1Name = memo(() => {
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const { 
    saveStep1Data, 
    onboardingData, 
    isLoading, 
    error, 
    loadOnboardingData,
    setUserId,
    clearError 
  } = useOnboardingStore();
  const { getOnboardingProgress } = useProgress();
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    // Set user ID in onboarding store when user is available
    if (user?.id) {
      setUserId(user.id);
    }
    
    // Load existing onboarding data (but don't pre-fill)
    loadOnboardingData();
  }, [user?.id, setUserId, loadOnboardingData]);

  useEffect(() => {
    // Don't pre-fill name - start with empty field
    setName('');
  }, []);

  useEffect(() => {
    // Clear error when component mounts
    clearError();
  }, [clearError]);

  // Prevent hardware back button on Android
  useEffect(() => {
    const backAction = () => {
      // Prevent going back
      return true; // Return true to prevent default behavior
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => backHandler.remove();
  }, []);

  const validateName = useCallback((inputName) => {
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
  }, []);

  const handleNext = useCallback(async () => {
    if (!validateName(name)) {
      return;
    }

    try {
      await saveStep1Data(name.trim());
      navigation.navigate('Step2');
    } catch (error) {
      Alert.alert(
        'Error', 
        'Failed to save your name. Please check your connection and try again.',
        [{ text: 'OK' }]
      );
    }
  }, [name, validateName, saveStep1Data, navigation]);

  const handleSkip = useCallback(() => {
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
  }, [navigation]);

  const handleChangeText = useCallback((text) => {
    setName(text);
    if (nameError) {
      validateName(text);
    }
  }, [nameError, validateName]);

  const handleKeyboardDismiss = useCallback(() => Keyboard.dismiss(), []);

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
});

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
  inputError: {
    borderColor: '#ff4444',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 14,
    marginTop: 10,
    textAlign: 'center',
  },
  errorContainer: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  errorMessage: {
    color: '#ff4444',
    fontSize: 14,
    textAlign: 'center',
  },
  absoluteButtonContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 50 : 30,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButton: {
    backgroundColor: '#00ff00',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    marginBottom: 15,
    minWidth: 120,
    alignItems: 'center',
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
  },
  skipButton: {
    paddingVertical: 10,
  },
  skipButtonText: {
    color: '#999',
    fontSize: 16,
  },
});

export default Step1Name;