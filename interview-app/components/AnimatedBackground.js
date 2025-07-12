import React, { useRef, useEffect } from 'react';
import { View, Animated, Dimensions, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const AnimatedBackground = ({ intensity = 'medium', children }) => {
  const waveAnim = useRef(new Animated.Value(0)).current;
  const meshAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Single wave animation
    Animated.loop(
      Animated.timing(waveAnim, {
        toValue: 1,
        duration: 15000,
        useNativeDriver: true,
      })
    ).start();

    // Mesh pulse animation
    Animated.loop(
      Animated.timing(meshAnim, {
        toValue: 1,
        duration: 20000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const getIntensityOpacity = () => {
    switch (intensity) {
      case 'subtle': return 0.03;
      case 'medium': return 0.06;
      case 'strong': return 0.1;
      default: return 0.06;
    }
  };

  const baseOpacity = getIntensityOpacity();

  const generateMeshDots = () => {
    const dots = [];
    const spacing = 60;
    const rows = Math.ceil(height / spacing);
    const cols = Math.ceil(width / spacing);

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = col * spacing;
        const y = row * spacing;

        dots.push(
          <Animated.View
            key={`dot-${row}-${col}`}
            style={[
              styles.meshDot,
              {
                left: x,
                top: y,
                opacity: meshAnim.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [baseOpacity * 0.3, baseOpacity, baseOpacity * 0.3],
                }),
                transform: [
                  {
                    scale: meshAnim.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [1, 1.3, 1],
                    }),
                  },
                ],
              },
            ]}
          />
        );
      }
    }
    return dots;
  };

  return (
    <View style={styles.container}>
      {/* Base background */}
      <LinearGradient
        colors={['#000000', '#0a0a0a', '#000000']}
        style={styles.baseGradient}
      />

      {/* Wave Layer */}
      <Animated.View
        style={[
          styles.wave,
          {
            opacity: baseOpacity * 1.2,
            transform: [
              {
                translateX: waveAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-width * 0.5, width * 0.5],
                }),
              },
              {
                translateY: waveAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-height * 0.2, height * 0.2],
                }),
              },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={['#1DB954', '#27AE60']}
          style={styles.waveGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      {/* Mesh dots */}
      <View style={styles.meshContainer}>
        {generateMeshDots()}
      </View>

      {/* Overlay for readability */}
      <LinearGradient
        colors={['rgba(0,0,0,0.1)', 'transparent', 'rgba(0,0,0,0.1)']}
        style={styles.overlay}
      />

      {/* Children */}
      <View style={styles.contentWrapper}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  baseGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  wave: {
    position: 'absolute',
    width: width * 1.5,
    height: width * 1.5,
    top: height * 0.1,
    left: -width * 0.25,
    borderRadius: 1000,
    overflow: 'hidden',
  },
  waveGradient: {
    flex: 1,
    borderRadius: 1000,
  },
  meshContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  meshDot: {
    position: 'absolute',
    width: 2,
    height: 2,
    backgroundColor: '#1DB954',
    borderRadius: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  contentWrapper: {
    flex: 1,
    zIndex: 1,
  },
});

export default AnimatedBackground;
