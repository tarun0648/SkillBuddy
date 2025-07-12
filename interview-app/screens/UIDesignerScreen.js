import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AnimatedBackground from '../components/AnimatedBackground';

export default function UIDesignerScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container}>
      <AnimatedBackground intensity="medium" />
      <View style={styles.content}>
        <Text style={styles.title}>Mock Interview: UI/UX Designer</Text>
        <Text style={styles.question}>How do you approach user research for a new design project?</Text>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.buttonText}>Skip</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.outlineButton}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.outlineButtonText}>End</Text>
        </TouchableOpacity>
      </View>
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
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Helvetica',
    color: '#00ff00',
    textAlign: 'center',
    marginBottom: 30,
    fontWeight: '600',
  },
  question: {
    fontSize: 18,
    fontFamily: 'Helvetica',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 40,
  },
  primaryButton: {
    backgroundColor: '#00ff00',
    borderRadius: 10,
    marginVertical: 10,
    padding: 15,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#00ff00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    fontFamily: 'Helvetica',
    fontWeight: '600',
  },
  outlineButton: {
    borderWidth: 2,
    borderColor: '#00ff00',
    borderRadius: 10,
    marginVertical: 10,
    padding: 15,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  outlineButtonText: {
    color: '#00ff00',
    fontSize: 16,
    fontFamily: 'Helvetica',
    fontWeight: '600',
  },
});