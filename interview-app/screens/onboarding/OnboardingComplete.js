import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ConfettiAnimation from '../../components/ConfettiAnimation';
import AnimatedBackground from '../../components/AnimatedBackground';

export default function OnboardingComplete() {
  const navigation = useNavigation();
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    // Show confetti for 3 seconds, then navigate to home
    const timer = setTimeout(() => {
      setShowConfetti(false);
      navigation.replace('Home'); // Use replace to prevent going back to onboarding
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <AnimatedBackground intensity="medium">
        {showConfetti ? (
          <ConfettiAnimation 
            successText="Setup Complete!"
            subText="You're all set to start your journey"
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