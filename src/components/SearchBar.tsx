import React from 'react';
import { View, TextInput, StyleSheet, useColorScheme } from 'react-native';
import GlassView from './GlassView';
import { spacing, radii, getColors } from '../theme/designTokens';

type Props = {
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
};

export default function SearchBar({ placeholder = 'Search...', value, onChangeText }: Props) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = getColors(isDark);

  return (
    <GlassView intensity={isDark ? 50 : 80} tint={isDark ? 'dark' : 'light'} style={styles.container}>
      <View style={styles.inner}>
        <TextInput
          style={[styles.input, { color: colors.text }]}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          value={value}
          onChangeText={onChangeText}
        />
      </View>
    </GlassView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: 44,
    borderRadius: radii.normal,
    overflow: 'hidden',
  },
  inner: {
    flex: 1,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
  },
  input: {
    fontSize: 15,
    fontWeight: '500',
  },
});
