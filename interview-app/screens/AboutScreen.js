import React from 'react';
import { TouchableOpacity, Text, Image, View, StyleSheet, SafeAreaView } from 'react-native';
import AnimatedBackground from '../components/AnimatedBackground';

export default function AboutScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <AnimatedBackground intensity="medium" />
      <View style={styles.content}>
        <Image 
          source={require('../assets/Golden-Dog.png')} 
          style={styles.image}
        />
        <Text style={styles.title}>Meet Buddy, your career coach 🐶</Text>
        
        <TouchableOpacity 
          style={styles.button}
          onPress={() => navigation.navigate('Questions')}
        >
          <Text style={styles.buttonText}>Let's Go!</Text>
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
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  image: {
    width: 120, 
    height: 120, 
    borderRadius: 60, 
    marginBottom: 20,
    borderWidth: 3,
    borderColor: '#00ff00'
  },
  title: {
    fontSize: 28,
    color: '#00ff00',
    fontFamily: 'Helvetica',
    textAlign: 'center',
    marginBottom: 40,
    fontWeight: '700',
  },
  button: {
    backgroundColor: '#00ff00',
    padding: 15,
    borderRadius: 10,
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
});