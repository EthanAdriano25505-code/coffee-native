import React from 'react';
import { View, StyleSheet, Platform, ViewStyle, StyleProp } from 'react-native';
import { BlurView } from 'expo-blur';
import Constants from 'expo-constants';

type GlassViewProps = {
  children?: React.ReactNode;
  intensity?: number;
  tint?: 'light' | 'dark' | 'default';
  style?: StyleProp<ViewStyle>;
  fallbackColor?: string;
};

/**
 * GlassView: A wrapper component for glass/blur effects
 * 
 * Uses expo-blur's BlurView when native blur is available (dev build or iOS),
 * otherwise falls back to a semi-transparent background.
 * 
 * Native blur is available when:
 * - Platform is iOS or Android (not web)
 * - App is running in a development build (not Expo Go on Android)
 * - Not running headless
 */
const GlassView = React.memo<GlassViewProps>(({
  children,
  intensity = 50,
  tint = 'default',
  style,
  fallbackColor,
}) => {
  // Detect if native blur is available
  const isExpoGo = Constants.appOwnership === 'expo';
  const isWeb = Platform.OS === 'web';
  const isHeadless = Constants.isHeadless;
  
  // Native blur available: not Expo Go, not web, not headless
  const canUseNativeBlur = !isExpoGo && !isWeb && !isHeadless;

  if (canUseNativeBlur) {
    return (
      <BlurView
        intensity={intensity}
        tint={tint}
        style={[styles.container, style]}
      >
        {children}
      </BlurView>
    );
  }

  // Fallback: semi-transparent background with subtle styling
  const defaultFallback = tint === 'light' 
    ? 'rgba(255, 255, 255, 0.75)' 
    : 'rgba(25, 25, 25, 0.75)';
  
  return (
    <View
      style={[
        styles.container,
        styles.fallback,
        { backgroundColor: fallbackColor || defaultFallback },
        style,
      ]}
    >
      {children}
    </View>
  );
});

GlassView.displayName = 'GlassView';

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  fallback: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    // Subtle backdrop-filter simulation
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
});

export default GlassView;
