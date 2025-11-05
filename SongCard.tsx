// src/components/SongCard.tsx
import React from 'react';
import { Animated, Pressable, Text, View, Image, StyleSheet } from 'react-native';

type Song = { id: string | number; title: string; artist?: string | null; cover_url?: string | null };

type Props = { song: Song; onPress: () => void };

export default function SongCard({ song, onPress }: Props) {
  const scale = React.useRef(new Animated.Value(1)).current;
  const onPressIn = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start();
  const onPressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();

  return (
    <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut} android_ripple={{ color: 'rgba(0,0,0,0.05)' }}>
      <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
        {song.cover_url ? (
          <Image source={{ uri: String(song.cover_url) }} style={styles.thumb} />
        ) : (
          <View style={styles.thumb} />
        )}
        <View style={styles.meta}>
          <Text numberOfLines={1} style={styles.title}>{song.title}</Text>
          <Text numberOfLines={1} style={styles.artist}>{song.artist}</Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, backgroundColor: '#fff' },
  thumb: { width: 56, height: 56, borderRadius: 8, backgroundColor: '#eee', marginRight: 12 },
  meta: { flex: 1 },
  title: { fontSize: 16, fontWeight: '700', color: '#111' },
  artist: { fontSize: 13, color: '#666', marginTop: 4 },
});