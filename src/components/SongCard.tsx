// src/components/SongCard.tsx
// Visual-only: Modern song card with rounded thumbnail and trailing action icon
import React from 'react';
import { Animated, Pressable, Text, View, Image, StyleSheet, useColorScheme } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getColors, radii, spacing, elevation } from '../theme/designTokens';

type Song = { id: string | number; title: string; artist?: string | null; cover_url?: string | null };

type Props = { 
  song: Song; 
  onPress: () => void; 
  index?: number;
  isActive?: boolean;
};

export default function SongCard({ song, onPress, index, isActive = false }: Props) {
  const scale = React.useRef(new Animated.Value(1)).current;
  const [imageError, setImageError] = React.useState(false);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = getColors(isDark);

  const onPressIn = () => Animated.spring(scale, { toValue: 0.98, useNativeDriver: true }).start();
  const onPressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();

  // Format index to be 2 digits (01, 02, etc.)
  const formattedIndex = index !== undefined ? String(index + 1).padStart(2, '0') : '';

  return (
    <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut} style={{ marginBottom: spacing.xs }}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <View
          style={[
            styles.container,
            { backgroundColor: isDark ? colors.surfaceAlt : '#FFFFFF', overflow: 'hidden' },
            isActive && styles.activeContainer,
          ]}
        >
          {isActive && (
            <LinearGradient
              colors={['#2F80ED', 'rgba(47, 128, 237, 0.1)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          )}

          {/* Index Number / Playing Icon */}
          <View style={styles.indexContainer}>
            {isActive ? (
              <Ionicons name="stats-chart" size={18} color="#FFD700" />
            ) : (
              <Text style={[styles.index, { color: isDark ? '#888' : '#999' }]}>
                {formattedIndex}
              </Text>
            )}
          </View>

          {/* Album Art (Circular) */}
          <View style={[styles.artContainer, isActive && styles.activeArtContainer]}>
            <View style={[styles.artWrapper, isActive && styles.activeArtWrapper]}>
              {song.cover_url && !imageError ? (
                <Image 
                  source={{ uri: song.cover_url }} 
                  style={styles.art}
                  onError={() => setImageError(true)}
                />
              ) : (
                <View style={[styles.art, { backgroundColor: isDark ? '#333' : '#F0F0F0', justifyContent: 'center', alignItems: 'center' }]}>
                  <Ionicons name="musical-note" size={24} color={isDark ? '#666' : '#CCC'} />
                </View>
              )}
            </View>
          </View>

          {/* Meta: Title + Artist */}
          <View style={styles.meta}>
            <Text numberOfLines={1} style={[styles.title, { color: isActive ? '#FFF' : colors.text }]}>
              {song.title}
            </Text>
            <Text numberOfLines={1} style={[styles.artist, { color: isActive ? 'rgba(255,255,255,0.7)' : colors.textSecondary }]}>
              {song.artist || 'Unknown Artist'}
            </Text>
          </View>

          {/* Right: Menu Icon (3 dots) */}
          <View style={styles.menuButton}>
              <Feather name="more-horizontal" size={20} color={isActive ? '#FFF' : (isDark ? '#555' : '#CCC')} />
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  activeContainer: {
    shadowColor: '#2F80ED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  indexContainer: {
    width: 30,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  index: {
    fontSize: 14,
    fontWeight: '600',
  },
  artContainer: {
    marginRight: 16,
  },
  activeArtContainer: {
    // Glow effect around the art
  },
  artWrapper: {
    width: 52,
    height: 52,
    borderRadius: 26,
    padding: 2, // Space for the ring
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeArtWrapper: {
    borderWidth: 2,
    borderColor: '#FFD700', // Yellow ring from screenshot
  },
  art: {
    width: '100%',
    height: '100%',
    borderRadius: 26,
    backgroundColor: '#222',
  },
  meta: {
    flex: 1,
    justifyContent: 'center',
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
    letterSpacing: 0.2,
  },
  artist: {
    fontSize: 13,
    fontWeight: '500',
  },
  menuButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
});