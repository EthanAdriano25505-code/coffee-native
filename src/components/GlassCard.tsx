import React from 'react';
import { StyleSheet, View, ViewStyle, StyleProp, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { colors, radii, blur, spacing } from '../utils/tokens';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
  variant?: 'light' | 'dark';
}

/**
 * GlassCard - A frosted glass effect card with blur background,
 * semi-transparent border, and inner highlight strip.
 */
export default function GlassCard({
  children,
  style,
  intensity = blur.glass,
  variant = 'light',
}: GlassCardProps) {
  const isLight = variant === 'light';
  const containerStyle = [
    styles.container,
    isLight ? styles.lightContainer : styles.darkContainer,
    style,
  ];

  // On Android, BlurView may not render well in all cases,
  // so we provide a fallback solid background
  const fallbackBackground = isLight
    ? 'rgba(255, 255, 255, 0.85)'
    : 'rgba(17, 17, 17, 0.90)';

  if (Platform.OS === 'android') {
    // Android fallback: use semi-transparent background without blur
    return (
      <View style={[containerStyle, { backgroundColor: fallbackBackground }]}>
        <View style={[styles.highlight, isLight ? styles.lightHighlight : styles.darkHighlight]} />
        <View style={styles.content}>{children}</View>
      </View>
    );
  }

  return (
    <View style={containerStyle}>
      <BlurView
        intensity={intensity}
        tint={isLight ? 'light' : 'dark'}
        style={StyleSheet.absoluteFillObject}
      />
      {/* Inner highlight strip at top */}
      <View style={[styles.highlight, isLight ? styles.lightHighlight : styles.darkHighlight]} />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radii.xl,
    overflow: 'hidden',
    position: 'relative',
  },
  lightContainer: {
    backgroundColor: colors.glassBackground,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  darkContainer: {
    backgroundColor: colors.darkGlassBackground,
    borderWidth: 1,
    borderColor: colors.darkGlassBorder,
  },
  highlight: {
    position: 'absolute',
    top: 0,
    left: spacing.lg,
    right: spacing.lg,
    height: 1,
  },
  lightHighlight: {
    backgroundColor: colors.glassHighlight,
  },
  darkHighlight: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  content: {
    position: 'relative',
    zIndex: 1,
  },
});
