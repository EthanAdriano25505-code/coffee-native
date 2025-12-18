// src/components/SongCard.tsx
// Visual-only: Modern song card with rounded thumbnail and trailing action icon
import React from 'react';
import { Animated, Pressable, Text, View, Image, StyleSheet, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getColors, radii, spacing, elevation } from '../theme/designTokens';

type Song = { id: string | number; title: string; artist?: string | null; cover_url?: string | null };

type Props = { song: Song; onPress: () => void; onMorePress?: () => void };

export default function SongCard({ song, onPress }: Props) {
  const scale = React.useRef(new Animated.Value(1)).current;
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = getColors(isDark);

  const onPressIn = () => Animated.spring(scale, { toValue: 0.98, useNativeDriver: true }).start();
  const onPressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();

  return (
    <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut} style={{ marginBottom: spacing.md }}>
      <Animated.View 
        style={[
          styles.container, 
          { 
            backgroundColor: isDark ? colors.surfaceAlt : '#FFFFFF',
            borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
            transform: [{ scale }],
          }
        ]}
      >
        {/* Left: Album Art */}
        <Image 
          source={{ uri: song.cover_url || 'https://via.placeholder.com/150' }} 
          style={styles.art} 
        />

        {/* Center: Title + Artist */}
        <View style={styles.meta}>
          <Text numberOfLines={1} style={[styles.title, { color: colors.text }]}>
            {song.title}
          </Text>
          <Text numberOfLines={1} style={[styles.artist, { color: colors.textSecondary }]}>
            {song.artist || 'Unknown Artist'}
          </Text>
        </View>

        {/* Right: Play Button */}
        <View style={[styles.playButton, { backgroundColor: colors.primary }]}>
            <Ionicons name="play" size={20} color="#FFFFFF" style={{ marginLeft: 2 }} />
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: radii.normal,
    borderWidth: 1,
    ...elevation.low,
  },
  art: {
    width: 56,
    height: 56,
    borderRadius: radii.small,
    backgroundColor: '#222',
  },
  meta: {
    flex: 1,
    marginLeft: spacing.md,
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  artist: {
    fontSize: 14,
    fontWeight: '500',
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: radii.round,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.xs,
  },
});