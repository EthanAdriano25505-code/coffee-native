// src/components/GlassView.tsx
import React from 'react';
import { View, StyleSheet, Platform, ViewStyle, StyleProp } from 'react-native';
import { BlurView, BlurTint } from 'expo-blur';
import { glass } from '../theme/designTokens';

type GlassViewProps = {
  children?: React.ReactNode;
  intensity?: number;
  tint?: BlurTint;
  style?: StyleProp<ViewStyle>;
};

/**
 * GlassView component that provides a glass morphism effect using BlurView
 * On Android, BlurView is supported in Expo, but may need fallback for older devices
 */
export default function GlassView({
  children,
  intensity = glass.defaultIntensity,
  tint = glass.tintDefault,
  style,
}: GlassViewProps) {
  // On Android, if blur isn't working well, we provide a semi-transparent fallback
  if (Platform.OS === 'android') {
    // Modern Android devices support BlurView in Expo
    return (
      <BlurView intensity={intensity} tint={tint} style={[styles.container, style]}>
        {children}
      </BlurView>
    );
  }

  // iOS has native blur support
  return (
    <BlurView intensity={intensity} tint={tint} style={[styles.container, style]}>
      {children}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  androidFallback: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
});
