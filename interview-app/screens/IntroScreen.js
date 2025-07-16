import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  PanResponder,
  Animated,
  Easing,
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import AnimatedBackground from '../components/AnimatedBackground';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  "Hello, Welcome to Skillbuddy",
  "I am your Hiring agent",
  "I have trained 6000+ members",
  "I bark when you progress"
];

// Typewriter effect component
function TypewriterText({ text, onDone, style }) {
  const [displayed, setDisplayed] = useState('');
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setDisplayed('');
    setIndex(0);
  }, [text]);

  useEffect(() => {
    if (index < text.length) {
      const timeout = setTimeout(() => {
        setDisplayed((prev) => prev + text[index]);
        setIndex((prev) => prev + 1);
      }, 28);
      return () => clearTimeout(timeout);
    } else if (onDone) {
      onDone();
    }
  }, [index, text, onDone]);

  return (
    <Text style={style}>{displayed}</Text>
  );
}

export default function PeppyIntroScreen({ navigation }) {
  const imageAnimRef = useRef(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const slideCount = SLIDES.length;

  // For glow/impact animation on the image
  const glowAnim = useRef(new Animated.Value(0)).current;

  // For flip animation
  const flipAnim = useRef(new Animated.Value(0)).current;
  const prevSlide = useRef(currentSlide);

  // Animate image when loaded
  const handleImageLoad = () => {
    if (imageAnimRef.current) {
      imageAnimRef.current.fadeInDown(800);
    }
  };

  // Animate glow/impact when slide changes
  useEffect(() => {
    glowAnim.setValue(0);
    Animated.sequence([
      Animated.timing(glowAnim, {
        toValue: 1,
        duration: 220,
        useNativeDriver: false,
      }),
      Animated.timing(glowAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: false,
      }),
    ]).start();
  }, [currentSlide]);

  // Animate flip when slide changes
  useEffect(() => {
    if (prevSlide.current !== currentSlide) {
      flipAnim.setValue(0);
      Animated.timing(flipAnim, {
        toValue: 1,
        duration: 420,
        useNativeDriver: false, // useNativeDriver: false to avoid error
        easing: Easing.inOut(Easing.ease),
      }).start(() => {
        flipAnim.setValue(0); // Reset for next flip
      });
      prevSlide.current = currentSlide;
    }
  }, [currentSlide, flipAnim]);

  const handleCreateAccount = () => {
    console.log('Get Started button clicked');
    console.log('Navigation object:', navigation);
    console.log('Navigation.navigate function:', navigation?.navigate);
    
    if (navigation && typeof navigation.navigate === 'function') {
      console.log('Attempting to navigate to Step1');
      navigation.navigate('Step1');
    } else {
      console.log('Navigation not available or navigate function missing');
    }
  };

  const handleLogin = () => {
    if (navigation && typeof navigation.navigate === 'function') {
      navigation.navigate('Login');
    } else {
      console.log('Login clicked');
    }
  };

  // PanResponder for swipe gestures (full screen)
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond to horizontal swipes with enough movement
        return Math.abs(gestureState.dx) > 20 && Math.abs(gestureState.dy) < 40;
      },
      onPanResponderRelease: (_, gestureState) => {
        // Only allow swiping forward, not back
        if (gestureState.dx < -40 && currentSlide < slideCount - 1) {
          setCurrentSlide(prev => Math.min(prev + 1, slideCount - 1));
        }
      },
    })
  ).current;

  // Interpolate for glow effect
  const glowShadow = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 24],
  });
  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.2, 0.8],
  });

  // Interpolate for flip effect
  const flip = flipAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['0deg', '18deg', '0deg'], // subtle but noticeable flip
  });

  return (
    <View style={styles.container}>
      <AnimatedBackground intensity="subtle" />
      {/* Make the swipe area cover the full screen except the bottom buttons */}
      <View style={styles.swipeArea} {...panResponder.panHandlers}>
        <View style={styles.centerContainer}>
          {/* Dialog box with pointer */}
          <View style={styles.dialogContainer}>
            <View style={styles.speechBubble}>
              <TypewriterText
                key={currentSlide}
                text={SLIDES[currentSlide]}
                style={styles.speechText}
              />
            </View>
            <View style={styles.trianglePointer} />
          </View>

          {/* Peppy image with animated glow/impact and flip */}
          <Animated.View
            style={[
              styles.glowWrapper,
              {
                shadowColor: '#00ff00',
                shadowOpacity: glowOpacity,
                shadowRadius: glowShadow,
                shadowOffset: { width: 0, height: 0 },
                // Android shadow workaround
                elevation: glowShadow,
                transform: [
                  { perspective: 800 },
                  { rotateY: flip },
                ],
              },
            ]}
          >
            <Animatable.Image
              ref={imageAnimRef}
              source={require('../assets/peppy.jpeg')}
              style={styles.peppyImage}
              resizeMode="cover"
              onLoad={handleImageLoad}
              useNativeDriver
            />
          </Animated.View>
        </View>
        {/* Dots below image, spaced further down */}
        <View style={styles.dotsContainer}>
          <View style={styles.dots}>
            {SLIDES.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  i === currentSlide && styles.activeDot
                ]}
              />
            ))}
          </View>
        </View>
      </View>

      {/* Buttons at the bottom */}
      <View style={styles.bottomButtons}>
        <Animatable.View animation="pulse" iterationCount="infinite" delay={1000}>
          <TouchableOpacity style={styles.button} onPress={handleCreateAccount}>
            <Text style={styles.buttonText}>Get Started</Text>
          </TouchableOpacity>
        </Animatable.View>
        <TouchableOpacity onPress={handleLogin}>
          <Text style={styles.loginText}>I already have an account</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const DOT_SIZE = 12;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  swipeArea: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-start',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialogContainer: {
    alignItems: 'center',
    marginBottom: 16,
    width: width,
  },
  speechBubble: {
    backgroundColor: '#000',
    borderColor: '#ff7f00',
    borderWidth: 2,
    padding: 14,
    borderRadius: 14,
    maxWidth: width * 0.8,
    alignSelf: 'center',
    marginBottom: -2,
    zIndex: 2,
    minHeight: 60,
    justifyContent: 'center',
  },
  speechText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    fontFamily: 'System',
    letterSpacing: 0.2,
  },
  trianglePointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 16,
    borderRightWidth: 16,
    borderTopWidth: 18,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#ff7f00',
    marginTop: -2,
    zIndex: 1,
  },
  glowWrapper: {
    // This wrapper is for the animated glow effect
    borderRadius: 210,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 20,
    transform: [{ translateY: -50 }], // Move image up by 25% (50px)
    overflow: 'hidden',
  },
  peppyImage: {
    width: 210,
    height: 210,
    marginBottom: 300,
    // borderRadius: 100,
    alignSelf: 'center',
    borderRadius: 100,
  },
  dotsContainer: {
    alignItems: 'center',
    marginTop: 32, // Move dots further down
    marginBottom: 8,
    width: '100%',
  },
  dots: {
    flexDirection: 'row',
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    width: DOT_SIZE * 4 + 24 * 3, // 4 dots + 3 gaps
    height: DOT_SIZE + 4,
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    backgroundColor: '#222',
    marginHorizontal: 12,
    borderWidth: 1,
    borderColor: '#00ff00',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeDot: {
    backgroundColor: '#00ff00',
    borderColor: '#00ff00',
  },
  bottomButtons: {
    width: '100%',
    alignItems: 'center',
    paddingBottom: 50,
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  button: {
    backgroundColor: '#00ff00',
    paddingVertical: 16,
    paddingHorizontal: width * 0.25,
    borderRadius: 30,
    marginTop: 10,
    marginBottom: 10,
  },
  buttonText: {
    fontWeight: 'bold',
    color: '#000',
    fontSize: 16,
  },
  loginText: {
    color: '#fff',
    marginTop: 16,
    fontSize: 14,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
});