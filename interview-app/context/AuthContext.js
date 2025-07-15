// context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from '../services/apiService';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState(null);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('authToken');
      const storedUser = await AsyncStorage.getItem('user');
      
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        apiService.setAuthToken(storedToken);
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      // Step 1: First, try to register/create user in backend to get user_id
      // This is a workaround since we don't have Firebase Auth in frontend
      let userResponse;
      
      try {
        // Try to register first (this will fail if user exists, which is fine)
        userResponse = await apiService.register(email, password);
      } catch (registerError) {
        // If registration fails (user exists), that's expected for existing users
        console.log('User might already exist, proceeding with login...');
      }

      // Step 2: Create a simple token for this session
      // In a real app, this would come from Firebase Auth
      const sessionToken = `session_${email}_${Date.now()}`;
      
      // Step 3: Try to authenticate with backend using a mock approach
      // Since your backend expects an ID token, we'll simulate the login process
      
      // For now, we'll create a user object manually
      // In a real app, you'd get this from Firebase Auth
      const mockUser = {
        user_id: userResponse?.user_id || `user_${email.replace('@', '_').replace('.', '_')}`,
        email: email,
        uid: userResponse?.user_id || `user_${email.replace('@', '_').replace('.', '_')}`,
      };

      // Store the session
      await AsyncStorage.setItem('authToken', sessionToken);
      await AsyncStorage.setItem('user', JSON.stringify(mockUser));
      
      setToken(sessionToken);
      setUser(mockUser);
      apiService.setAuthToken(sessionToken);
      
      return mockUser;
      
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (email, password) => {
    try {
      const response = await apiService.register(email, password);
      return response;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Clear local storage
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('user');
      
      setToken(null);
      setUser(null);
      apiService.setAuthToken(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const value = {
    user,
    token,
    isLoading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};