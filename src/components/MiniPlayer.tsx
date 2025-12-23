import React from 'react';
import { StyleSheet, View, Text, Image, Pressable, Dimensions, Platform } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
  useSharedValue,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { spacing } from '../theme/designTokens';
import { useTheme } from '../contexts/ThemeContext';

const { width } = Dimensions.get('window');

interface Song {
  id: string | number;
  title: string;
  artist?: string | null;
  cover_url?: string | null;
}

interface MiniPlayerProps {
  song: Song;
  isPlaying: boolean;
  progress: number; // 0 to 1
  onPress: () => void;
  onPlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
}

/**
 * MiniPlayer - "Glass UI" variant.
 * Floating pill shape, dark background, top progress bar.
 */
export default function MiniPlayer({
  song,
  isPlaying,
  progress,
  onPress,
  onPlayPause,
  onNext,
  onPrev,
}: MiniPlayerProps) {
  const { isDarkMode, colors } = useTheme();
  const pressScale = useSharedValue(1);

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));

  const handlePressIn = () => {
    pressScale.value = withTiming(0.98, { duration: 100 });
  };

  const handlePressOut = () => {
    pressScale.value = withTiming(1, { duration: 150 });
  };

  return (
    <Animated.View style={[styles.container, containerAnimatedStyle]}>
      <BlurView
        intensity={Platform.OS === 'ios' ? 90 : 60}
        tint="dark"
        style={StyleSheet.absoluteFill}
      />
      {/* Progress Bar (Top Edge) */}
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBarFill, { width: `${Math.min(100, Math.max(0, progress * 100))}%` }]} />
      </View>

      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.content}
        accessibilityLabel={`Now playing: ${song.title}`}
      >
        {/* Artwork */}
        <View style={styles.artworkContainer}>
          {song.cover_url ? (
            <Image source={{ uri: song.cover_url }} style={styles.artwork} />
          ) : (
            <View style={[styles.artwork, styles.placeholderArt]}>
              <Ionicons name="musical-note" size={20} color="#666" />
            </View>
          )}
        </View>

        {/* Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {song.title}
          </Text>
          <Text style={styles.artist} numberOfLines={1}>
            {song.artist || 'Unknown Artist'}
          </Text>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          {/* Like Button (Visual only for now) */}
          <Pressable style={styles.iconButton}>
            <Ionicons name="heart" size={24} color="#2F80ED" />
          </Pressable>

          {/* Previous Button */}
          <Pressable onPress={(e) => { e.stopPropagation(); onPrev(); }} style={styles.iconButton}>
            <Ionicons name="play-skip-back" size={24} color="#fff" />
          </Pressable>

          {/* Play/Pause Button */}
          <Pressable onPress={(e) => { e.stopPropagation(); onPlayPause(); }} style={styles.playButton}>
            <Ionicons name={isPlaying ? "pause" : "play"} size={24} color="#fff" style={{ marginLeft: isPlaying ? 0 : 2 }} />
          </Pressable>

          {/* Next Button */}
          <Pressable onPress={(e) => { e.stopPropagation(); onNext(); }} style={styles.iconButton}>
            <Ionicons name="play-skip-forward" size={24} color="#fff" />
          </Pressable>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 72,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderRadius: 22,
    backgroundColor: 'rgba(15, 23, 42, 0.7)', // Navy glass
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
    overflow: 'hidden', // Clip progress bar
  },
  progressBarContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.1)',
    zIndex: 10,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#2F80ED', // Blue
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  artworkContainer: {
  },
  artwork: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#333',
  },
  placeholderArt: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContainer: {
    flex: 1,
    marginLeft: spacing.md,
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
  },
  artist: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingRight: 4,
  },
  iconButton: {
    padding: 4,
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2F80ED', // Blue circle
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2F80ED',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
});

