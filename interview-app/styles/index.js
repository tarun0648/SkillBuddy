// styles.js
import { StyleSheet, Platform } from 'react-native';

export const COLORS = {
  primary: '#00ff00',        // Green (main brand color)
  secondary: '#00cc00',      // Darker Green
  accent: '#33ff33',         // Light Green
  background: '#000000',     // Black (main background)
  surface: '#1a1a1a',        // Dark Grey (card backgrounds)
  light: '#FFFFFF',          // Pure White
  white: '#FFFFFF',          // Pure White
  offWhite: '#F5F5F5',       // Off White
  cream: '#F8F8F8',          // Cream White
  dark: '#000000',           // Black
  gray: '#888888',           // Medium Gray (text secondary)
  lightGray: '#CCCCCC',      // Light Gray
  darkGray: '#2a2a2a',       // Dark Gray for borders/dividers
  primaryDark: '#009900',    // Darker primary for gradients
  primaryLight: '#66ff66',   // Lighter primary for gradients
  warning: '#ffcc00',        // Warning color
};

// Platform-specific sans serif fonts that are built-in
const FONT_FAMILY = Platform.select({
  ios: 'Helvetica',            // Clean sans serif on iOS
  android: 'sans-serif',       // Built-in sans serif on Android
  default: 'sans-serif'        // Fallback sans serif
});

// Shadow definitions
export const SHADOWS = {
  green: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  dark: {
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  light: {
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
};

// Gradient button styles
export const gradientButtonStyle = {
  padding: 15,
  borderRadius: 10,
  marginVertical: 10,
  alignItems: 'center',
  overflow: 'hidden',
  ...SHADOWS.green,
};

export const gradientButtonInner = {
  padding: 15,
  borderRadius: 10,
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%',
};

export const buttonStyle = {
  backgroundColor: COLORS.primary,
  padding: 15,
  borderRadius: 10,
  marginVertical: 10,
  alignItems: 'center',
  shadowColor: COLORS.primary,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.3,
  shadowRadius: 8,
  elevation: 5,
};

export const buttonTextStyle = {
  color: COLORS.white,
  fontSize: 16,
  fontFamily: FONT_FAMILY,
  fontWeight: '600',
};

export const gradientStyle = {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: COLORS.background,
};

export const titleStyle = {
  fontSize: 28,
  color: COLORS.white,
  fontFamily: FONT_FAMILY,
  textAlign: 'center',
  marginBottom: 20,
  fontWeight: '700',
};

export const containerStyle = {
  backgroundColor: COLORS.background,
  flex: 1,
  padding: 20,
};

export const cardStyle = {
  backgroundColor: COLORS.surface,
  borderRadius: 12,
  padding: 20,
  marginVertical: 10,
  borderLeftWidth: 4,
  borderLeftColor: COLORS.primary,
  shadowColor: COLORS.dark,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.3,
  shadowRadius: 6,
  elevation: 4,
};

export const textStyle = {
  color: COLORS.lightGray,
  fontSize: 16,
  fontFamily: FONT_FAMILY,
  lineHeight: 24,
};

export const alternateButtonStyle = {
  backgroundColor: COLORS.surface,
  borderWidth: 2,
  borderColor: COLORS.primary,
  padding: 15,
  borderRadius: 10,
  marginVertical: 10,
  alignItems: 'center',
  shadowColor: COLORS.dark,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.2,
  shadowRadius: 4,
  elevation: 3,
};

export const alternateButtonTextStyle = {
  color: COLORS.primary,
  fontSize: 16,
  fontFamily: FONT_FAMILY,
  fontWeight: '600',
};

export const lightContainerStyle = {
  backgroundColor: COLORS.surface,
  flex: 1,
  padding: 20,
};

export const lightCardStyle = {
  backgroundColor: COLORS.darkGray,
  borderRadius: 12,
  padding: 20,
  marginVertical: 10,
  borderLeftWidth: 4,
  borderLeftColor: COLORS.primary,
  shadowColor: COLORS.dark,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.2,
  shadowRadius: 8,
  elevation: 3,
};

export const subtitleStyle = {
  fontSize: 18,
  color: COLORS.accent,
  fontFamily: FONT_FAMILY,
  textAlign: 'center',
  marginBottom: 15,
  fontWeight: '500',
};

export const lightTitleStyle = {
  fontSize: 28,
  color: COLORS.white,
  fontFamily: FONT_FAMILY,
  textAlign: 'center',
  marginBottom: 20,
  fontWeight: '700',
};