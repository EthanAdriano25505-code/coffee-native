import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  Dimensions,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
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
      onPress={onPress}
      accessibilityLabel="Search"
      accessibilityHint="Tap to search for songs and artists"
      accessibilityRole="button"
      activeOpacity={0.8}
      style={{
        flex: 1,
        maxWidth: isLargeScreen ? 400 : undefined,
        borderRadius: radii.round,
        // Shadow for the "lifted" glass look
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: isDark ? 0.4 : 0.1,
        shadowRadius: 8,
        elevation: 4,
        backgroundColor: 'transparent',
      }}
    >
      <BlurView
        intensity={Platform.OS === 'ios' ? 80 : 40}
        tint={isDark ? 'dark' : 'default'}
        style={{
          borderRadius: radii.round,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.6)',
          backgroundColor: 'transparent',
        }}
      >
        <LinearGradient
          colors={
            isDark
              ? ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']
              : ['rgba(255,255,255,0.4)', 'rgba(255,255,255,0.1)']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm + 2,
            minHeight: sizes.touchTarget,
          }}
        >
          <Feather name="search" size={18} color={isDark ? colors.muted : '#666'} />
          <Text
            style={[
              styles.placeholder,
              { color: isDark ? colors.muted : '#666', marginLeft: spacing.sm },
            ]}
            numberOfLines={1}
          >
            {placeholder}
          </Text>
        </LinearGradient>
      </BlurView>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    fontSize: 14,
    flex: 1,
  },
});
