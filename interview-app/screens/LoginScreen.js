// screens/LoginScreen.js (No JWT Token Verification)
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../services/Zuststand';

export default function LoginScreen() {
  const navigation = useNavigation();
  const { login, isLoading } = useAuthStore();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = () => {
    let isValid = true;
    
    // Reset errors
    setEmailError('');
    setPasswordError('');

    // Validate email
    if (!email.trim()) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      isValid = false;
    }

    // Validate password
    if (!password.trim()) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      isValid = false;
    }

    return isValid;
  };

  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const result = await login(email.trim(), password);
      
      if (result.success) {
        // Navigate to home screen
        navigation.replace('Home');
      } else {
        Alert.alert('Login Failed', result.error || 'Please check your credentials and try again.');
      }
    } catch (error) {
      Alert.alert('Login Failed', 'An unexpected error occurred. Please try again.');
    }
  };

  const handleSignUp = () => {
    navigation.navigate('Signup');
  };

  const isButtonEnabled = email.trim() && password.trim() && !isLoading;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.container}>
            <View style={styles.centeredContent}>
              {/* Header */}
              <View style={styles.headerContainer}>
                <Text style={styles.headerText}>Welcome Back!</Text>
                <Text style={styles.subHeaderText}>Sign in to continue</Text>
              </View>

              {/* Email Input */}
              <View style={styles.inputContainer}>
                <TextInput
                  style={[
                    styles.input,
                    emailError ? styles.inputError : null
                  ]}
                  placeholder="Email"
                  placeholderTextColor="#666"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (emailError) setEmailError('');
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  accessible={true}
                  accessibilityLabel="Email input"
                />
                {emailError ? (
                  <Text style={styles.errorText}>{emailError}</Text>
                ) : null}
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[
                      styles.passwordInput,
                      passwordError ? styles.inputError : null
                    ]}
                    placeholder="Password"
                    placeholderTextColor="#666"
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      if (passwordError) setPasswordError('');
                    }}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    accessible={true}
                    accessibilityLabel="Password input"
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowPassword(!showPassword)}
                    accessible={true}
                    accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off' : 'eye'}
                      size={20}
                      color="#666"
                    />
                  </TouchableOpacity>
                </View>
                {passwordError ? (
                  <Text style={styles.errorText}>{passwordError}</Text>
                ) : null}
              </View>
            </View>

            {/* Login Button */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[
                  styles.loginButton,
                  !isButtonEnabled && styles.loginButtonOutline,
                ]}
                onPress={handleLogin}
                disabled={!isButtonEnabled}
                accessible={true}
                accessibilityLabel="Login to your account"
                accessibilityRole="button"
              >
                {isLoading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#000" />
                    <Text style={styles.loginButtonText}>Signing in...</Text>
                  </View>
                ) : (
                  <Text
                    style={[
                      styles.loginButtonText,
                      !isButtonEnabled && styles.loginButtonTextOutline,
                    ]}
                  >
                    Sign In
                  </Text>
                )}
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Google Logo */}
              <View style={styles.googleLogoContainer}>
                <Image
                  source={require('../assets/google.png')}
                  style={styles.googleLogo}
                  resizeMode="contain"
                />
              </View>

              {/* Sign Up Link */}
              <View style={styles.signUpContainer}>
                <Text style={styles.signUpPromptText}>Don't have an account? </Text>
                <TouchableOpacity
                  onPress={handleSignUp}
                  accessible={true}
                  accessibilityLabel="Sign up for new account"
                  accessibilityRole="button"
                >
                  <Text style={styles.signUpLinkText}>Sign Up</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    backgroundColor: '#000',
    justifyContent: 'flex-start',
  },
  centeredContent: {
    flex: 1,
    justifyContent: 'center',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  headerText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subHeaderText: {
    color: '#ccc',
    fontSize: 16,
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderColor: '#00ff00',
    borderWidth: 2,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#000',
    fontSize: 16,
  },
  inputError: {
    borderColor: '#ff0000',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    borderColor: '#00ff00',
    borderWidth: 2,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#000',
    fontSize: 16,
  },
  eyeButton: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  errorText: {
    color: '#ff0000',
    fontSize: 12,
    marginTop: 5,
    marginLeft: 5,
  },
  buttonContainer: {
    paddingBottom: 30,
    alignItems: 'center',
  },
  loginButton: {
    backgroundColor: '#00ff00',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    borderWidth: 0,
    borderColor: '#00ff00',
  },
  loginButtonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#00ff00',
  },
  loginButtonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 18,
  },
  loginButtonTextOutline: {
    color: '#00ff00',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    width: '100%',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#333',
  },
  dividerText: {
    color: '#666',
    fontSize: 14,
    marginHorizontal: 15,
  },
  googleLogoContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  googleLogo: {
    width: 40,
    height: 40,
  },
  signUpContainer: {
    flexDirection: 'row',
    marginTop: 20,
    alignItems: 'center',
  },
  signUpPromptText: {
    color: '#fff',
    fontSize: 14,
  },
  signUpLinkText: {
    color: '#00ff00',
    fontSize: 14,
    fontWeight: '600',
  },
});