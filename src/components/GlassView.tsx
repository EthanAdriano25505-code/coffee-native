// src/components/GlassView.tsx
import React from 'react';
import { StyleSheet, ViewStyle, StyleProp } from 'react-native';
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
 * Works on both iOS and Android with native blur support
 */
export default function GlassView({
  children,
  intensity = glass.defaultIntensity,
  tint = glass.tintDefault,
  style,
}: GlassViewProps) {
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
});
