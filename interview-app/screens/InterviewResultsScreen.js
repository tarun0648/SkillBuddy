// screens/InterviewResultsScreen.js
import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView,
  Alert,
  TextInput,
  ActivityIndicator,
  Animated,
  Dimensions,
  SafeAreaView
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useXP } from '../context/XPContext';
import ConfettiAnimation from '../components/ConfettiAnimation';
import AnimatedBackground from '../components/AnimatedBackground';
// Use expo-av only if available, otherwise gracefully degrade
let Audio;
try {
  Audio = require('expo-av').Audio;
} catch (e) {
  Audio = null;
}

const { width } = Dimensions.get('window');

export default function InterviewResultsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { careerPath, responses = [], questions = [] } = route.params || {};
  const { addXP, getXPRewards } = useXP();
  
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState(0);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [showRoulette, setShowRoulette] = useState(false);
  const [rouletteSpinning, setRouletteSpinning] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [showXPAnimation, setShowXPAnimation] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiType, setConfettiType] = useState('roulette'); // 'roulette' or 'feedback'

  const rouletteRotation = useRef(new Animated.Value(0)).current;
  const xpAnimation = useRef(new Animated.Value(0)).current;

  // Sound refs
  const spinSoundRef = useRef(null);
  const tickSoundRef = useRef(null);
  const winSoundRef = useRef(null);

  // European roulette wheel layout (authentic casino order)
  const rouletteSegments = [
    { number: '0', value: 300, color: '#228B22', textColor: '#FFFFFF' },
    { number: '32', value: 50, color: '#DC143C', textColor: '#FFFFFF' },
    { number: '15', value: 75, color: '#000000', textColor: '#FFFFFF' },
    { number: '19', value: 100, color: '#DC143C', textColor: '#FFFFFF' },
    { number: '4', value: 50, color: '#000000', textColor: '#FFFFFF' },
    { number: '21', value: 125, color: '#DC143C', textColor: '#FFFFFF' },
    { number: '2', value: 75, color: '#000000', textColor: '#FFFFFF' },
    { number: '25', value: 100, color: '#DC143C', textColor: '#FFFFFF' },
    { number: '17', value: 50, color: '#000000', textColor: '#FFFFFF' },
    { number: '34', value: 150, color: '#DC143C', textColor: '#FFFFFF' },
    { number: '6', value: 75, color: '#000000', textColor: '#FFFFFF' },
    { number: '27', value: 100, color: '#DC143C', textColor: '#FFFFFF' },
    { number: '13', value: 50, color: '#000000', textColor: '#FFFFFF' },
    { number: '36', value: 125, color: '#DC143C', textColor: '#FFFFFF' },
    { number: '11', value: 75, color: '#000000', textColor: '#FFFFFF' },
    { number: '30', value: 100, color: '#DC143C', textColor: '#FFFFFF' },
    { number: '8', value: 50, color: '#000000', textColor: '#FFFFFF' },
    { number: '23', value: 125, color: '#DC143C', textColor: '#FFFFFF' },
    { number: '10', value: 75, color: '#000000', textColor: '#FFFFFF' },
    { number: '5', value: 100, color: '#DC143C', textColor: '#FFFFFF' },
    { number: '24', value: 50, color: '#000000', textColor: '#FFFFFF' },
    { number: '16', value: 125, color: '#DC143C', textColor: '#FFFFFF' },
    { number: '33', value: 75, color: '#000000', textColor: '#FFFFFF' },
    { number: '1', value: 100, color: '#DC143C', textColor: '#FFFFFF' },
    { number: '20', value: 50, color: '#000000', textColor: '#FFFFFF' },
    { number: '14', value: 125, color: '#DC143C', textColor: '#FFFFFF' },
    { number: '31', value: 75, color: '#000000', textColor: '#FFFFFF' },
    { number: '9', value: 100, color: '#DC143C', textColor: '#FFFFFF' },
    { number: '22', value: 50, color: '#000000', textColor: '#FFFFFF' },
    { number: '18', value: 125, color: '#DC143C', textColor: '#FFFFFF' },
    { number: '29', value: 75, color: '#000000', textColor: '#FFFFFF' },
    { number: '7', value: 100, color: '#DC143C', textColor: '#FFFFFF' },
    { number: '28', value: 50, color: '#000000', textColor: '#FFFFFF' },
    { number: '12', value: 125, color: '#DC143C', textColor: '#FFFFFF' },
    { number: '35', value: 75, color: '#000000', textColor: '#FFFFFF' },
    { number: '3', value: 100, color: '#DC143C', textColor: '#FFFFFF' },
    { number: '26', value: 50, color: '#000000', textColor: '#FFFFFF' }
  ];

  // Preload sounds if expo-av is available
  useEffect(() => {
    let isMounted = true;
    if (!Audio) return;
    async function loadSounds() {
      try {
        // You must provide these files in your assets/sounds folder
        const [spin, tick, win] = await Promise.all([
          Audio.Sound.createAsync(require('../assets/sounds/roulette_spin.mp3')),
          Audio.Sound.createAsync(require('../assets/sounds/roulette_tick.mp3')),
          Audio.Sound.createAsync(require('../assets/sounds/roulette_win.mp3')),
        ]);
        if (isMounted) {
          spinSoundRef.current = spin.sound;
          tickSoundRef.current = tick.sound;
          winSoundRef.current = win.sound;
        }
      } catch (e) {
        // If sound fails to load, just ignore
      }
    }
    loadSounds();
    return () => {
      isMounted = false;
      if (spinSoundRef.current) spinSoundRef.current.unloadAsync();
      if (tickSoundRef.current) tickSoundRef.current.unloadAsync();
      if (winSoundRef.current) winSoundRef.current.unloadAsync();
    };
  }, []);

  useEffect(() => {
    // Show roulette after a short delay
    setTimeout(() => {
      setShowRoulette(true);
    }, 1000);
  }, []);

  // Helper for ticking sound during spin
  const playTickingDuringSpin = (duration, totalSegments, spins, onDone) => {
    if (!tickSoundRef.current) return null;
    let ticks = Math.floor(spins * totalSegments + totalSegments); // total ticks
    let tickCount = 0;
    let tickTimeout = null;
    let baseInterval = duration / ticks;

    function getInterval(tickNum) {
      // Ease out: slow down at the end
      const t = tickNum / ticks;
      // Use a cubic ease-out
      return baseInterval * (0.5 + 1.5 * t * t * t);
    }

    function tick() {
      if (tickSoundRef.current) {
        tickSoundRef.current.replayAsync();
      }
      tickCount++;
      if (tickCount >= ticks) {
        if (onDone) onDone();
        return;
      }
      // Schedule next tick
      const nextInterval = getInterval(tickCount);
      tickTimeout = setTimeout(tick, nextInterval);
    }
    tick();
    return () => tickTimeout && clearTimeout(tickTimeout);
  };

  const spinRoulette = () => {
    setRouletteSpinning(true);

    // Random number of rotations (8-15 full rotations plus random position)
    const spins = Math.floor(Math.random() * 7) + 8;
    const randomSegment = Math.floor(Math.random() * rouletteSegments.length);
    const segmentAngle = 360 / rouletteSegments.length;
    const finalAngle = spins * 360 + (randomSegment * segmentAngle);

    // Reset rotation for smoothness
    rouletteRotation.setValue(0);

    // Play spin sound
    if (spinSoundRef.current) {
      spinSoundRef.current.setPositionAsync(0);
      spinSoundRef.current.playAsync();
    }

    // Play ticking sound during spin
    const spinDuration = 5000; // ms, slightly longer for smoothness
    let stopTicking = playTickingDuringSpin(
      spinDuration,
      rouletteSegments.length,
      spins,
      () => {}
    );

    // Use Animated.timing with a custom easing for smoothness
    Animated.timing(rouletteRotation, {
      toValue: finalAngle,
      duration: spinDuration,
      useNativeDriver: true,
      easing: (t) => {
        // Ease out cubic for smooth deceleration
        return 1 - Math.pow(1 - t, 3);
      }
    }).start(() => {
      if (stopTicking) stopTicking();
      if (spinSoundRef.current) {
        spinSoundRef.current.stopAsync();
      }
      if (winSoundRef.current) {
        winSoundRef.current.setPositionAsync(0);
        winSoundRef.current.playAsync();
      }
      const wonSegment = rouletteSegments[randomSegment];
      const earnedXP = wonSegment.value;
      
      setXpEarned(earnedXP);
      addXP(earnedXP, 'Interview Completion Bonus');
      setRouletteSpinning(false);
      setShowXPAnimation(true);
      setConfettiType('roulette');
      setShowConfetti(true);
      
      // Hide confetti after 3 seconds
      setTimeout(() => {
        setShowConfetti(false);
      }, 3000);
      
      // Animate XP counter
      Animated.sequence([
        Animated.timing(xpAnimation, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.delay(2500),
        Animated.timing(xpAnimation, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        })
      ]).start(() => {
        setShowXPAnimation(false);
      });
    });
  };

  const renderRoulette = () => {
    if (!showRoulette) return null;

    const wheelSize = Math.min(width * 0.8, 300);
    const segmentAngle = 360 / rouletteSegments.length;
    const segmentRadius = (wheelSize - 30) / 2;

    return (
      <View style={styles.rouletteContainer}>
        <Text style={styles.rouletteTitle}>🎰 Vegas Bonus Wheel! 🎰</Text>
        <Text style={styles.rouletteSubtitle}>Spin to win bonus XP!</Text>
        
        <View style={[styles.rouletteWheel, { width: wheelSize, height: wheelSize }]}>
          {/* Outer decorative rim */}
          <View style={[styles.wheelOuterRim, { width: wheelSize + 20, height: wheelSize + 20 }]} />
          
          {/* Main rim */}
          <View style={[styles.wheelRim, { width: wheelSize, height: wheelSize }]} />
          
          {/* Inner wheel with segments */}
          <Animated.View
            style={[
              styles.wheel,
              {
                width: wheelSize - 30,
                height: wheelSize - 30,
                borderRadius: (wheelSize - 30) / 2,
                transform: [{
                  rotate: rouletteRotation.interpolate({
                    inputRange: [0, 360],
                    outputRange: ['0deg', '360deg']
                  })
                }]
              }
            ]}
          >
            {/* Background circle */}
            <View style={[styles.wheelBackground, {
              width: wheelSize - 30,
              height: wheelSize - 30,
              borderRadius: (wheelSize - 30) / 2,
            }]} />
            
            {/* Segments */}
            {rouletteSegments.map((segment, index) => {
              const rotation = segmentAngle * index;
              
              return (
                <View
                  key={index}
                  style={[
                    styles.segment,
                    {
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      width: segmentRadius,
                      height: 2,
                      backgroundColor: segment.color,
                      transformOrigin: '0px 0px',
                      transform: [
                        { translateX: -1 },
                        { translateY: -1 },
                        { rotate: `${rotation}deg` }
                      ],
                    }
                  ]}
                >
                  {/* Number label positioned at the edge */}
                  <View style={[styles.numberContainer, {
                    position: 'absolute',
                    right: -12,
                    top: -8,
                    width: 24,
                    height: 16,
                    backgroundColor: segment.color,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: '#FFD700',
                  }]}>
                    <Text style={[styles.segmentNumber, { 
                      color: segment.textColor,
                      fontSize: 8,
                      fontWeight: '700'
                    }]}>
                      {segment.number}
                    </Text>
                  </View>
                </View>
              );
            })}
            
            {/* Radial dividers */}
            {rouletteSegments.map((_, index) => (
              <View
                key={`divider-${index}`}
                style={[
                  styles.segmentDivider,
                  {
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    width: segmentRadius,
                    height: 1,
                    backgroundColor: '#FFD700',
                    transformOrigin: '0px 0px',
                    transform: [
                      { translateY: -0.5 },
                      { rotate: `${segmentAngle * index}deg` }
                    ],
                  }
                ]}
              />
            ))}
          </Animated.View>
          
          {/* Center hub with spokes */}
          <View style={[styles.centerHub, { 
            width: wheelSize * 0.12, 
            height: wheelSize * 0.12,
            borderRadius: (wheelSize * 0.12) / 2 
          }]}>
            {/* Decorative spokes */}
            {[0, 45, 90, 135].map((angle, index) => (
              <View
                key={index}
                style={[
                  styles.spoke,
                  {
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    width: wheelSize * 0.08,
                    height: 2,
                    backgroundColor: '#8B4513',
                    transformOrigin: '0px 0px',
                    transform: [
                      { translateX: -wheelSize * 0.04 },
                      { translateY: -1 },
                      { rotate: `${angle}deg` }
                    ],
                  }
                ]}
              />
            ))}
          </View>
          
          {/* Pointer/Ball */}
          <View style={[styles.pointer, { top: -18 }]} />
        </View>
        
        <TouchableOpacity
          style={[styles.spinButton, { opacity: rouletteSpinning ? 0.5 : 1 }]}
          onPress={spinRoulette}
          disabled={rouletteSpinning}
        >
          <LinearGradient
            colors={rouletteSpinning ? ['#666666', '#444444'] : ['#FFD700', '#FFA500']}
            style={styles.spinButtonGradient}
          >
            <Text style={styles.spinButtonText}>
              {rouletteSpinning ? 'SPINNING...' : 'SPIN TO WIN!'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  };

  const renderXPAnimation = () => {
    if (!showXPAnimation) return null;

    return (
      <Animated.View
        style={[
          styles.xpAnimationContainer,
          {
            opacity: xpAnimation,
            transform: [{
              scale: xpAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [0.5, 1]
              })
            }]
          }
        ]}
      >
        <Text style={styles.xpAnimationIcon}>🎉</Text>
        <Text style={styles.xpAnimationText}>+{xpEarned} XP</Text>
        <Text style={styles.xpAnimationSubtext}>Bonus Experience!</Text>
      </Animated.View>
    );
  };

  const handleSubmitFeedback = async () => {
    if (rating === 0) {
      Alert.alert('Error', 'Please provide a rating before submitting.');
      return;
    }

    setIsSubmittingFeedback(true);
    
    // Add bonus XP for providing feedback
    const feedbackXP = 25;
    addXP(feedbackXP, 'Feedback Provided');
    
    // Show confetti for feedback bonus
    setConfettiType('feedback');
    setShowConfetti(true);
    setTimeout(() => {
      setShowConfetti(false);
    }, 3000);
    
    // Simulate submitting feedback
    setTimeout(() => {
      Alert.alert(
        'Thank You!',
        `Your feedback has been recorded. You earned ${feedbackXP} bonus XP for providing feedback!`,
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Home'),
          },
        ]
      );
      setIsSubmittingFeedback(false);
    }, 1000);
  };

  const renderStarRating = () => {
    return (
      <View style={styles.starContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => setRating(star)}
            style={styles.star}
          >
            <Text style={[
              styles.starText,
              { color: star <= rating ? '#FF8C42' : '#888888' }
            ]}>
              ★
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {showConfetti && (
        <AnimatedBackground intensity="medium">
          <ConfettiAnimation 
            successText={
              confettiType === 'roulette' 
                ? (xpEarned > 0 ? `+${xpEarned} XP Earned!` : "Bonus XP!")
                : "+25 XP for Feedback!"
            }
            subText={
              confettiType === 'roulette'
                ? "Great job completing the interview!"
                : "Thank you for your feedback!"
            }
          />
        </AnimatedBackground>
      )}
      <AnimatedBackground intensity="medium" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Interview Complete!</Text>
          <Text style={styles.subtitle}>
            Great job completing the {careerPath} interview
          </Text>
        </View>

        {/* Interview Summary */}
        <View style={styles.summaryContainer}>
          <Text style={styles.sectionTitle}>Interview Summary</Text>
          
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Questions Answered:</Text>
            <Text style={styles.statValue}>{responses.length}</Text>
          </View>
          
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Total Questions:</Text>
            <Text style={styles.statValue}>{questions.length}</Text>
          </View>
          
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Completion Rate:</Text>
            <Text style={styles.statValue}>
              {Math.round((responses.length / questions.length) * 100)}%
            </Text>
          </View>
        </View>

        {/* Vegas Roulette Wheel */}
        {renderRoulette()}

        {/* XP Animation */}
        {renderXPAnimation()}

        {/* Feedback Section */}
        <View style={styles.feedbackContainer}>
          <Text style={styles.sectionTitle}>Rate Your Experience</Text>
          
          <Text style={styles.ratingLabel}>How would you rate this interview?</Text>
          {renderStarRating()}
          
          <Text style={styles.feedbackLabel}>Additional Comments (Optional):</Text>
          <TextInput
            style={styles.feedbackInput}
            value={feedback}
            onChangeText={setFeedback}
            multiline
            numberOfLines={4}
            placeholder="Share your thoughts about the interview experience..."
            placeholderTextColor="#888888"
            textAlignVertical="top"
          />
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleSubmitFeedback}
            disabled={isSubmittingFeedback}
          >
            {isSubmittingFeedback ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <Text style={styles.buttonText}>Submit Feedback (+25 XP)</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.outlineButton}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.outlineButtonText}>Back to Home</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.outlineButton}
            onPress={() => navigation.navigate('Questions')}
          >
            <Text style={styles.outlineButtonText}>Take Another Interview</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollContent: {
    padding: 20,
    paddingTop: 30,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Helvetica',
    color: '#00ff00',
    textAlign: 'center',
    marginBottom: 10,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Helvetica',
    color: '#fff',
    textAlign: 'center',
    opacity: 0.9,
  },
  summaryContainer: {
    backgroundColor: '#1a1a1a',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#00ff00',
  },
  rouletteContainer: {
    backgroundColor: '#0F1419',
    padding: 25,
    borderRadius: 20,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 15,
  },
  rouletteTitle: {
    fontSize: 22,
    fontFamily: 'Helvetica',
    color: '#FFD700',
    fontWeight: '700',
    marginBottom: 5,
    textAlign: 'center',
    textShadowColor: '#000000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  rouletteSubtitle: {
    fontSize: 14,
    fontFamily: 'Helvetica',
    color: '#fff',
    marginBottom: 25,
    textAlign: 'center',
  },
  rouletteWheel: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 25,
  },
  wheelOuterRim: {
    position: 'absolute',
    borderRadius: 1000,
    borderWidth: 8,
    borderColor: '#B8860B',
    backgroundColor: 'transparent',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 15,
  },
  wheelRim: {
    position: 'absolute',
    borderRadius: 1000,
    borderWidth: 6,
    borderColor: '#8B4513',
    backgroundColor: '#654321',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  wheel: {
    position: 'relative',
    backgroundColor: '#1a1a1a',
    borderWidth: 3,
    borderColor: '#FFD700',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  wheelBackground: {
    position: 'absolute',
    backgroundColor: '#1a1a1a',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  segment: {
    borderTopWidth: 0.5,
    borderTopColor: '#FFD700',
  },
  numberContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  segmentDivider: {
    opacity: 0.8,
  },
  segmentNumber: {
    fontFamily: 'Helvetica',
    textAlign: 'center',
    textShadowColor: '#000000',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 1,
  },
  centerHub: {
    position: 'absolute',
    backgroundColor: '#FFD700',
    borderWidth: 4,
    borderColor: '#B8860B',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spoke: {
    borderRadius: 1,
  },
  pointer: {
    position: 'absolute',
    width: 0,
    height: 0,
    borderLeftWidth: 15,
    borderRightWidth: 15,
    borderBottomWidth: 30,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#FF0000',
    zIndex: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
    elevation: 8,
  },
  spinButton: {
    borderRadius: 30,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  spinButtonGradient: {
    paddingHorizontal: 35,
    paddingVertical: 15,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  spinButtonText: {
    fontSize: 18,
    fontFamily: 'Helvetica',
    color: '#000000',
    fontWeight: '700',
    textShadowColor: '#FFFFFF',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 1,
  },
  xpAnimationContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -100 }, { translateY: -75 }],
    backgroundColor: 'rgba(255, 215, 0, 0.95)',
    padding: 25,
    borderRadius: 20,
    alignItems: 'center',
    zIndex: 1000,
    width: 200,
    borderWidth: 3,
    borderColor: '#FFA500',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 20,
  },
  xpAnimationIcon: {
    fontSize: 30,
    marginBottom: 10,
  },
  xpAnimationText: {
    fontSize: 28,
    fontFamily: 'Helvetica',
    color: '#000000',
    fontWeight: '700',
    textShadowColor: '#FFFFFF',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  xpAnimationSubtext: {
    fontSize: 16,
    fontFamily: 'Helvetica',
    color: '#000000',
    marginTop: 5,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Helvetica',
    color: '#00ff00',
    marginBottom: 15,
    textAlign: 'center',
    fontWeight: '600',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  statLabel: {
    fontSize: 16,
    fontFamily: 'Helvetica',
    color: '#fff',
  },
  statValue: {
    fontSize: 16,
    fontFamily: 'Helvetica',
    color: '#00ff00',
    fontWeight: 'bold',
  },
  feedbackContainer: {
    backgroundColor: '#1a1a1a',
    padding: 20,
    borderRadius: 15,
    marginBottom: 30,
    borderLeftWidth: 4,
    borderLeftColor: '#00ff00',
  },
  ratingLabel: {
    fontSize: 16,
    fontFamily: 'Helvetica',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 15,
  },
  starContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  star: {
    marginHorizontal: 5,
  },
  starText: {
    fontSize: 30,
    fontFamily: 'Helvetica',
  },
  feedbackLabel: {
    fontSize: 16,
    fontFamily: 'Helvetica',
    color: '#fff',
    marginBottom: 10,
  },
  feedbackInput: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    fontFamily: 'Helvetica',
    color: '#000',
    minHeight: 100,
    borderWidth: 2,
    borderColor: '#00ff00',
  },
  buttonContainer: {
    gap: 15,
  },
  primaryButton: {
    backgroundColor: '#00ff00',
    borderRadius: 10,
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