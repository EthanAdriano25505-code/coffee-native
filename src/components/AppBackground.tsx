/**
 * AppBackground Component
 * Provides a gradient background using expo-linear-gradient.
 * Preserves existing aesthetics while enabling consistent theming.
 */
import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../utils/tokens';

interface AppBackgroundProps {
  /** Child components to render over the background */
  children: React.ReactNode;
  /** Gradient colors (default: white to light gray) */
  gradientColors?: string[];
  /** Gradient start point (default: { x: 0, y: 0 }) */
  start?: { x: number; y: number };
  /** Gradient end point (default: { x: 0, y: 1 }) */
  end?: { x: number; y: number };
  /** Additional style overrides */
  style?: ViewStyle;
  /** Optional testID for testing */
  testID?: string;
}

/**
 * AppBackground wraps content with a gradient background.
 * Default gradient is a subtle white-to-light-gray vertical fade.
 */
export default function AppBackground({
  children,
  gradientColors = [colors.background, colors.surface],
  start = { x: 0, y: 0 },
  end = { x: 0, y: 1 },
  style,
  testID,
}: AppBackgroundProps) {
  return (
    <LinearGradient
      testID={testID}
      colors={gradientColors}
      start={start}
      end={end}
      style={[styles.container, style]}
    >
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
