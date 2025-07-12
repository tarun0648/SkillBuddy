import React, { useEffect } from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useAuthStore } from '../services/Zuststand';

export default function AuthGuard({ children, navigation }) {
  const { isLoggedIn, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      navigation.navigate('Login');
    }
  }, [isLoggedIn, isLoading, navigation]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00ff00" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!isLoggedIn) {
    return null; // Will redirect to login
  }

  return children;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
  },
}); 