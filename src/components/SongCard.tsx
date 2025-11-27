// src/components/SongCard.tsx
// Visual-only: Modern song card with rounded thumbnail and trailing action icon
import React from 'react';
import { Animated, Pressable, Text, View, Image, StyleSheet, useColorScheme, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

type Song = { id: string | number; title: string; artist?: string | null; cover_url?: string | null };

type Props = { song: Song; onPress: () => void; onMorePress?: () => void };

export default function SongCard({ song, onPress }: Props) {
  const scale = React.useRef(new Animated.Value(1)).current;
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const onPressIn = () => Animated.spring(scale, { toValue: 0.98, useNativeDriver: true }).start();
  const onPressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();

  return (
    <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}>
      <Animated.View style={[styles.container, { transform: [{ scale }] }]}>
        <BlurView
          intensity={Platform.OS === 'ios' ? 80 : 40}
          tint={isDark ? 'dark' : 'light'}
          style={[
            styles.blurContainer,
            { borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.6)' }
          ]}
        >
          <LinearGradient
            colors={
              isDark
                ? ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']
                : ['rgba(255,255,255,0.8)', 'rgba(255,255,255,0.5)']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.gradient}
          >
            {/* Album Art */}
            <Image 
              source={{ uri: song.cover_url || 'https://via.placeholder.com/150' }} 
              style={styles.art} 
            />

            {/* Meta */}
            <View style={styles.meta}>
              <Text numberOfLines={1} style={[styles.title, isDark && styles.textDark]}>
                {song.title}
              </Text>
              <Text numberOfLines={1} style={[styles.artist, isDark && styles.textDarkSecondary]}>
                {song.artist || 'Unknown Artist'}
              </Text>
            </View>

            {/* Right Action */}
            <View style={styles.rightSection}>
              <View style={[styles.playButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
                 <Ionicons name="play" size={14} color={isDark ? '#ffffffff' : '#555'} style={{ marginLeft: 2 }} />
              </View>
              <Text style={[styles.duration, isDark && styles.textDarkSecondary]}>3:45</Text>
            </View>
          </LinearGradient>
        </BlurView>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    backgroundColor: 'transparent',
  },
  blurContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 0,
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    minHeight: 80,
  },
  art: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor:  'transparent',
  },
  meta: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
    marginBottom: 4,
  },
  artist: {
    fontSize: 14,
    color: '#666',
  },
  textDark: { color: '#fff' },
  textDarkSecondary: { color: '#aaa' },
  rightSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  playButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  duration: {
    fontSize: 11,
    color: '#888',
    fontWeight: '500',
  },
});