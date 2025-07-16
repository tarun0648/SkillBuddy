// utils/navigationUtils.js
import { Easing } from 'react-native';

// Smooth transition configurations for different screen types
export const transitionConfigs = {
  // Standard smooth transition
  smooth: {
    animation: 'slide_from_right',
    gestureDirection: 'horizontal',
    gestureEnabled: true,
    cardStyleInterpolator: ({ current, layouts }) => {
      return {
        cardStyle: {
          transform: [
            {
              translateX: current.progress.interpolate({
                inputRange: [0, 1],
                outputRange: [layouts.screen.width, 0],
              }),
            },
          ],
          opacity: current.progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0.3, 1],
          }),
        },
        overlayStyle: {
          opacity: current.progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 0.5],
          }),
        },
      };
    },
  },

  // Onboarding-specific transition (faster, smoother)
  onboarding: {
    animation: 'slide_from_right',
    gestureDirection: 'horizontal',
    gestureEnabled: false, // Disable gestures for onboarding
    cardStyleInterpolator: ({ current, layouts }) => {
      return {
        cardStyle: {
          transform: [
            {
              translateX: current.progress.interpolate({
                inputRange: [0, 1],
                outputRange: [layouts.screen.width * 0.3, 0],
              }),
            },
          ],
          opacity: current.progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0.8, 1],
          }),
        },
        overlayStyle: {
          opacity: current.progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 0.3],
          }),
        },
      };
    },
    transitionSpec: {
      open: {
        animation: 'timing',
        config: {
          duration: 300,
          easing: Easing.out(Easing.cubic),
        },
      },
      close: {
        animation: 'timing',
        config: {
          duration: 300,
          easing: Easing.in(Easing.cubic),
        },
      },
    },
  },

  // Modal transition
  modal: {
    animation: 'slide_from_bottom',
    gestureDirection: 'vertical',
    gestureEnabled: true,
    cardStyleInterpolator: ({ current, layouts }) => {
      return {
        cardStyle: {
          transform: [
            {
              translateY: current.progress.interpolate({
                inputRange: [0, 1],
                outputRange: [layouts.screen.height, 0],
              }),
            },
          ],
          opacity: current.progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0.5, 1],
          }),
        },
        overlayStyle: {
          opacity: current.progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 0.5],
          }),
        },
      };
    },
  },

  // Fade transition
  fade: {
    animation: 'fade',
    gestureDirection: 'horizontal',
    gestureEnabled: false,
    cardStyleInterpolator: ({ current }) => {
      return {
        cardStyle: {
          opacity: current.progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 1],
          }),
        },
        overlayStyle: {
          opacity: current.progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 0.5],
          }),
        },
      };
    },
  },
};

// Navigation helper functions
export const navigationHelpers = {
  // Navigate with smooth transition
  navigateSmooth: (navigation, routeName, params = {}) => {
    navigation.navigate(routeName, params);
  },

  // Navigate with replace (no back button)
  navigateReplace: (navigation, routeName, params = {}) => {
    navigation.replace(routeName, params);
  },

  // Navigate with reset (clear stack)
  navigateReset: (navigation, routeName, params = {}) => {
    navigation.reset({
      index: 0,
      routes: [{ name: routeName, params }],
    });
  },

  // Go back with smooth transition
  goBackSmooth: (navigation) => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  },
};

// Screen options helper
export const getScreenOptions = (type = 'smooth', additionalOptions = {}) => {
  const baseOptions = {
    headerShown: false,
    cardStyle: { backgroundColor: '#000' },
    ...transitionConfigs[type],
    ...additionalOptions,
  };

  return baseOptions;
};

// Onboarding screen options
export const getOnboardingScreenOptions = (additionalOptions = {}) => {
  return getScreenOptions('onboarding', {
    headerLeft: null,
    headerBackVisible: false,
    ...additionalOptions,
  });
};

// Standard screen options
export const getStandardScreenOptions = (additionalOptions = {}) => {
  return getScreenOptions('smooth', additionalOptions);
};

// Modal screen options
export const getModalScreenOptions = (additionalOptions = {}) => {
  return getScreenOptions('modal', additionalOptions);
};

// Fade screen options
export const getFadeScreenOptions = (additionalOptions = {}) => {
  return getScreenOptions('fade', additionalOptions);
}; 