import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

const AVATAR_SIZE = 69;

const peppyImageStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 70,        // Moved up by 30% more (from 100 to 70)
    left: 20,
    zIndex: 100,   // Ensure it's above other elements
  },
  image: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    overflow: 'hidden',
  },
});

export default function PeppyImage({ higher = false }) {
  return (
    <View style={[peppyImageStyles.container, higher && { top: 40 }] }>
      <Image
        source={require('../../assets/peppy.jpeg')}
        style={peppyImageStyles.image}
        resizeMode="cover"
      />
    </View>
  );
}
