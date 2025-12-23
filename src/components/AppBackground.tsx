import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { gradients } from '../utils/tokens';

interface AppBackgroundProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

/**
 * AppBackground - Provides the white→blue vertical gradient background
 * for the player screens.
 */
export default function AppBackground({ children, style }: AppBackgroundProps) {
  return (
    <LinearGradient
      colors={gradients.background}
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
