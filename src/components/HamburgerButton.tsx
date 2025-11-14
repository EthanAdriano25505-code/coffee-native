import React from 'react';
import { TouchableOpacity, View, StyleSheet, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { spacing } from '../theme/designTokens';

type Props = {
  onPress: () => void;
  color?: string;
  accessibilityLabel?: string;
  size?: number;
};

const HamburgerButton: React.FC<Props> = ({ onPress, color = '#111', accessibilityLabel = 'Open menu', size = 22 }) => {
  return (
    <TouchableOpacity onPress={onPress} accessibilityLabel={accessibilityLabel} accessibilityRole="button" style={styles.btn}>
      <Feather name="menu" size={size} color={color} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  btn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: Platform.OS === 'android' ? spacing.xs : spacing.sm,
  },
});

export default HamburgerButton;