import React, { useRef, useEffect, useMemo } from 'react';
import { View, Animated, Dimensions, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const AnimatedBackground = ({ intensity = 'medium', children }) => {
  const waveAnim = useRef(new Animated.Value(0)).current;
  const meshAnim = useRef(new Animated.Value(0)).current;

  // Memoize intensity opacity to prevent recalculation
  const baseOpacity = useMemo(() => {
    switch (intensity) {
      case 'subtle': return 0.03;
      case 'medium': return 0.06;
      case 'strong': return 0.1;
      default: return 0.06;
    }
  }, [intensity]);

  useEffect(() => {
    // Use requestAnimationFrame for smoother animations
    const startAnimations = () => {
      // Single wave animation with better performance
      Animated.loop(
        Animated.timing(waveAnim, {
          toValue: 1,
          duration: 20000, // Slightly slower for smoother motion
          useNativeDriver: true,
        })
      ).start();

      // Mesh pulse animation with optimized timing
      Animated.loop(
        Animated.timing(meshAnim, {
          toValue: 1,
          duration: 25000, // Slower for less flickering
          useNativeDriver: true,
        })
      ).start();
    };

    // Small delay to ensure smooth start
    const timer = setTimeout(startAnimations, 100);
    return () => {
      clearTimeout(timer);
      waveAnim.stopAnimation();
      meshAnim.stopAnimation();
    };
  }, [waveAnim, meshAnim]);

  // Memoize mesh dots to prevent recreation on every render
  const meshDots = useMemo(() => {
    const dots = [];
    const spacing = 80; // Increased spacing for better performance
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
                  outputRange: [baseOpacity * 0.2, baseOpacity * 0.8, baseOpacity * 0.2],
                }),
                transform: [
                  {
                    scale: meshAnim.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [0.8, 1.2, 0.8],
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
  }, [meshAnim, baseOpacity]);

  return (
    <View style={styles.container}>
      {/* Base background */}
      <LinearGradient
        colors={['#000000', '#0a0a0a', '#000000']}
        style={styles.baseGradient}
      />

      {/* Wave Layer with optimized animation */}
      <Animated.View
        style={[
          styles.wave,
          {
            opacity: baseOpacity * 1.5,
            transform: [
              {
                translateX: waveAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-width * 0.3, width * 0.3], // Reduced movement range
                }),
              },
              {
                translateY: waveAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-height * 0.1, height * 0.1], // Reduced movement range
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

      {/* Mesh dots with memoization */}
      <View style={styles.meshContainer}>
        {meshDots}
      </View>

      {/* Overlay for readability */}
      <LinearGradient
        colors={['rgba(0,0,0,0.05)', 'transparent', 'rgba(0,0,0,0.05)']}
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
    width: width * 1.2, // Reduced size for better performance
    height: width * 1.2,
    top: height * 0.15,
    left: -width * 0.1,
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
    width: 1.5, // Slightly smaller dots
    height: 1.5,
    backgroundColor: '#1DB954',
    borderRadius: 0.75,
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
