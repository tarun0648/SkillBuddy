import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ChatBubble({ message = "Hi there!" }) {
  return (
    <View style={styles.bubble}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderColor: '#00ff00',
    borderWidth: 2,
  },
  text: {
    color: '#000',
    fontSize: 16,
  },
});
