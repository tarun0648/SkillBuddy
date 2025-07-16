import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const progressBarStyles = StyleSheet.create({
  container: { 
    width: '100%', 
    marginBottom: 20 
  },
  label: { 
    color: '#fff', 
    marginLeft: 4, 
    marginBottom: 4 
  },
  barBackground: {
    height: 10,
    backgroundColor: '#222',
    borderRadius: 10,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#00ff00',
    borderRadius: 10,
  },
});

const ProgressBar = ({ percent = 0 }) => {
  return (
    <View style={progressBarStyles.container}>
      <Text style={progressBarStyles.label}>{percent}%</Text>
      <View style={progressBarStyles.barBackground}>
        <View style={[progressBarStyles.barFill, { width: `${percent}%` }]} />
      </View>
    </View>
  );
};

export default ProgressBar;