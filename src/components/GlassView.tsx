import React from 'react';
import { View, StyleSheet, Platform, ViewProps } from 'react-native';
import { BlurView } from 'expo-blur';

interface GlassViewProps extends ViewProps {
  intensity?: number;
  tint?: 'light' | 'dark' | 'default';
}

export default function GlassView({ intensity = 50, tint = 'default', style, children, ...props }: GlassViewProps) {
  if (Platform.OS === 'android') {
    return (
      <View style={[styles.androidGlass, style]} {...props}>
        {children}
      </View>
    );
  }
  return (
    <BlurView intensity={intensity} tint={tint} style={style} {...props}>
      {children}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  androidGlass: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
  },
});
