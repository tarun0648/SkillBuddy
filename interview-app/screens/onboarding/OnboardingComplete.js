import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ConfettiAnimation from '../../components/ConfettiAnimation';
import AnimatedBackground from '../../components/AnimatedBackground';
import { useAuthStore } from '../../services/Zuststand';
import { useOnboardingStore } from '../../services/onboardingStore';

export default function OnboardingComplete() {
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const { initializeOnboardingStore, completeOnboarding } = useOnboardingStore();
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    const handleOnboardingComplete = async () => {
      try {
        // Initialize onboarding store with user ID
        await initializeOnboardingStore();
        
        // Complete onboarding
        await completeOnboarding();
        
        // Show confetti for 3 seconds, then navigate to home
        const timer = setTimeout(() => {
          setShowConfetti(false);
          // Navigate to Home screen and replace the entire stack
          // This prevents users from going back to onboarding
          navigation.reset({
            index: 0,
            routes: [{ name: 'Home' }],
          });
        }, 3000);

        return () => clearTimeout(timer);
      } catch (error) {
        console.error('Error completing onboarding:', error);
        // Still navigate to home even if there's an error
        setTimeout(() => {
          setShowConfetti(false);
          navigation.reset({
            index: 0,
            routes: [{ name: 'Home' }],
          });
        }, 3000);
      }
    };

    handleOnboardingComplete();
  }, [navigation, initializeOnboardingStore, completeOnboarding]);

  return (
    <SafeAreaView style={styles.container}>
      <AnimatedBackground intensity="medium">
        {showConfetti ? (
          <ConfettiAnimation 
            successText="Setup Complete!"
            subText={`Welcome to Skill Buddy, ${user?.name || 'User'}!`}
          />
        ) : (
          <View style={styles.content}>
            <Text style={styles.title}>Welcome to Skill Buddy!</Text>
            <Text style={styles.subtitle}>Your journey begins now...</Text>
          </View>
        )}
      </AnimatedBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    color: '#00ff00',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
  },
}); 