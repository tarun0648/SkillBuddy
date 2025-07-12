// components/atoms/GreenButton.js
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

export default function GreenButton({ title, onPress }) {
  return (
    <TouchableOpacity style={styles.btn} onPress={onPress}>
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    backgroundColor: '#00ff00',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
    marginTop: 30,
  },
  text: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
