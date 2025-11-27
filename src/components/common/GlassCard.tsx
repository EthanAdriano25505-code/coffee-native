import React from 'react';
import { Platform, StyleSheet, View, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { colors, radii, shadows, spacing } from '../../design/tokens';

interface GlassCardProps {
  children?: React.ReactNode;
  radius?: number;
  intensity?: number; // Blur intensity
  style?: ViewStyle;
  variant?: 'light' | 'dark';
  borderOpacity?: number;
}

const GlassCard: React.FC<GlassCardProps> = ({
  children,
  radius = radii.card24,
  intensity = 24,
  style,
  variant = 'light',
  borderOpacity = 0.25,
}) => {
  const bg = variant === 'light' ? 'rgba(255,255,255,0.5)' : 'rgba(17,24,39,0.6)';

  return (
    <View style={[styles.wrapper, { borderRadius: radius }, style]}>
      <BlurView intensity={intensity} tint={variant === 'light' ? 'light' : 'dark'} style={[styles.blur, { borderRadius: radius }]}/>
      <View style={[styles.background, { borderRadius: radius, backgroundColor: bg }]} />
      {/* Border */}
      <View style={[styles.border, { borderRadius: radius, borderColor: colors.glassBorder.replace('0.12', String(borderOpacity)) }]} />
      {/* Top highlight */}
      <View style={[styles.highlight, { borderTopLeftRadius: radius, borderTopRightRadius: radius }]} />
      <View style={[styles.content, Platform.OS === 'ios' ? styles.iosShadow : styles.androidShadow]}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    overflow: 'hidden',
  },
  blur: {
    ...StyleSheet.absoluteFillObject,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  border: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
  },
  highlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 8,
    backgroundColor: colors.glassHighlight,
  },
  content: {
    padding: spacing.x16,
  },
  iosShadow: {
    shadowColor: shadows.card.shadowColor,
    shadowOpacity: shadows.card.shadowOpacity,
    shadowRadius: shadows.card.shadowRadius,
    shadowOffset: shadows.card.shadowOffset,
  },
  androidShadow: {
    elevation: shadows.card.elevation,
  },
});

export default GlassCard;
