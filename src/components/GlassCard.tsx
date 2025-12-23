/**
 * GlassCard Component
 * Provides a glass-morphism effect using expo-blur.
 * Used for overlays, cards, and floating UI elements.
 */
import React from 'react';
import { StyleSheet, ViewStyle, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { colors, radii, spacing } from '../utils/tokens';

interface GlassCardProps {
  /** Child components */
  children: React.ReactNode;
  /** Blur intensity (0-100, default: 50) */
  intensity?: number;
  /** Blur tint: 'light', 'dark', or 'default' */
  tint?: 'light' | 'dark' | 'default';
  /** Border radius (default: radii.lg) */
  borderRadius?: number;
  /** Padding inside the card (default: spacing.lg) */
  padding?: number;
  /** Additional style overrides */
  style?: ViewStyle;
  /** Optional testID for testing */
  testID?: string;
}

/**
 * GlassCard provides a frosted glass effect container.
 * Uses BlurView from expo-blur with customizable intensity and tint.
 * Falls back gracefully on devices that don't support blur.
 */
export default function GlassCard({
  children,
  intensity = 50,
  tint = 'light',
  borderRadius = radii.lg,
  padding = spacing.lg,
  style,
  testID,
}: GlassCardProps) {
  return (
    <View 
      testID={testID}
      style={[
        styles.container,
        { borderRadius },
        style,
      ]}
    >
      <BlurView
        intensity={intensity}
        tint={tint}
        style={[
          styles.blur,
          { borderRadius, padding },
        ]}
      >
        {children}
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: colors.glassBackground,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  blur: {
    flex: 1,
  },
});
