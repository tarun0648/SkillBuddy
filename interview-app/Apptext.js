// components/AppText.js
import React from 'react';
import { Text } from 'react-native';

export default function AppText({ children, style, ...props }) {
  return (
    <Text {...props} style={[{ fontFamily: 'PlayfairDisplay_400Regular' }, style]}>
      {children}
    </Text>
  );
}
