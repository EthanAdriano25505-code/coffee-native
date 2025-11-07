// src/components/SongCard.tsx
// Visual-only: Modern song card with rounded thumbnail and trailing action icon
import React from 'react';
import { Animated, Pressable, Text, View, Image, StyleSheet, useColorScheme, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';

type Song = { id: string | number; title: string; artist?: string | null; cover_url?: string | null };

type Props = { song: Song; onPress: () => void; onMorePress?: () => void };

export default function SongCard({ song, onPress, onMorePress }: Props) {
  const scale = React.useRef(new Animated.Value(1)).current;
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const onPressIn = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start();
  const onPressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();

  return (
    <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut} android_ripple={{ color: 'rgba(0,0,0,0.05)' }}>
      <Animated.View style={[styles.card, isDark && styles.cardDark, { transform: [{ scale }] }]}>
        {/* Visual-only: Rounded thumbnail image with consistent styling */}
        {song.cover_url ? (
          <Image source={{ uri: String(song.cover_url) }} style={styles.thumb} />
        ) : (
          <View style={[styles.thumb, styles.thumbPlaceholder]} />
        )}
        <View style={styles.meta}>
          <Text numberOfLines={1} style={[styles.title, isDark && styles.titleDark]}>{song.title}</Text>
          <Text numberOfLines={1} style={[styles.artist, isDark && styles.artistDark]}>{song.artist}</Text>
        </View>
        {/* Trailing action icon for more options. Wrapped in a touchable so it can be interactive. */}
        <TouchableOpacity
          onPress={onMorePress}
          accessibilityRole="button"
          accessibilityLabel="More options"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.actionIcon}
        >
          <Feather name="more-vertical" size={20} color={isDark ? '#aaa' : '#666'} />
        </TouchableOpacity>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 12, 
    paddingHorizontal: 16, 
    backgroundColor: '#fff',
    minHeight: 72, // Visual-only: Ensure minimum touch target size
  },
  cardDark: { backgroundColor: '#121212' },
  thumb: { 
    width: 48, 
    height: 48, 
    borderRadius: 12, // Visual-only: Consistent rounded corners
    backgroundColor: '#eee', 
    marginRight: 12,
  },
  thumbPlaceholder: { backgroundColor: '#f3e6ff' },
  meta: { flex: 1 },
  title: { fontSize: 16, fontWeight: '700', color: '#111' },
  titleDark: { color: '#fff' },
  artist: { fontSize: 13, color: '#666', marginTop: 4 },
  artistDark: { color: '#aaa' },
  actionIcon: { 
    padding: 8, // Visual-only: Increase touch target
    marginLeft: 4,
  },
});