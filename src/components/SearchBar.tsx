import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  Dimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { spacing, radii, sizes, getColors } from '../theme/designTokens';

const { width } = Dimensions.get('window');
const isLargeScreen = width >= 768;

type Props = {
  onPress?: () => void;
  placeholder?: string;
};

export default function SearchBar({ onPress, placeholder = 'Search songs, artists...' }: Props) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = getColors(isDark);

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: isDark ? colors.surfaceAlt : '#F1F3F5',
          borderColor: isDark ? colors.border : 'transparent',
        },
      ]}
      onPress={onPress}
      accessibilityLabel="Search"
      accessibilityHint="Tap to search for songs and artists"
      accessibilityRole="button"
    >
      <Feather name="search" size={18} color={isDark ? colors.muted : '#666'} />
      <Text
        style={[
          styles.placeholder,
          { color: isDark ? colors.muted : '#666' },
        ]}
        numberOfLines={1}
      >
        {placeholder}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radii.round,
    borderWidth: 1,
    gap: spacing.sm,
    flex: 1,
    maxWidth: isLargeScreen ? 400 : undefined,
    minHeight: sizes.touchTarget,
  },
  placeholder: {
    fontSize: 14,
    flex: 1,
  },
});
