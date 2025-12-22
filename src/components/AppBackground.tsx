import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';

interface AppBackgroundProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

/**
 * AppBackground - Provides the background gradient.
 * Light: White -> Blue-ish
 * Dark: Deep Black Gradient
 */
export default function AppBackground({ children, style }: AppBackgroundProps) {
  const { gradients } = useTheme();
  const currentGradient = gradients.appBackground;

  return (
    <LinearGradient
      colors={currentGradient}
      locations={[0, 0.5, 1]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
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
