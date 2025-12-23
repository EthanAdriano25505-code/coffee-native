import React from 'react';
import { StyleSheet, View, Text, Image, Pressable, Platform } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
  interpolate,
  Extrapolation,
  useSharedValue,
} from 'react-native-reanimated';
import GlassCard from './GlassCard';
import { colors, spacing, radii, touchTargetMinSize, typography } from '../utils/tokens';

interface Song {
  id: string | number;
  title: string;
  artist?: string | null;
  cover_url?: string | null;
}

interface MiniPlayerProps {
  song: Song;
  isPlaying: boolean;
  progress: number;
  onPress: () => void;
  onPlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
}

/**
 * MiniPlayer - Dark glass variant mini player with top progress strip.
 * Renders at the bottom of the screen when in minimized state.
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
      <GlassCard variant="dark" style={styles.card}>
        {/* Progress strip at top */}
        <View style={styles.progressStrip}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>

        <Pressable
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={styles.content}
          accessibilityLabel={`Now playing: ${song.title} by ${song.artist || 'Unknown artist'}. Tap to expand.`}
          accessibilityRole="button"
        >
          {/* Artwork */}
          {song.cover_url ? (
            <Image source={{ uri: song.cover_url }} style={styles.artwork} />
          ) : (
            <View style={[styles.artwork, styles.artworkPlaceholder]}>
              <Text style={styles.artworkPlaceholderText}>♪</Text>
            </View>
          )}

          {/* Song info */}
          <View style={styles.info}>
            <Text style={styles.title} numberOfLines={1}>
              {song.title}
            </Text>
            <Text style={styles.artist} numberOfLines={1}>
              {song.artist || 'Unknown artist'}
            </Text>
          </View>

          {/* Controls */}
          <View style={styles.controls}>
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                onPrev();
              }}
              style={styles.controlButton}
              accessibilityLabel="Previous track"
              accessibilityRole="button"
              hitSlop={8}
            >
              <Text style={styles.controlIcon}>⏮</Text>
            </Pressable>

            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                onPlayPause();
              }}
              style={[styles.controlButton, styles.playButton]}
              accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
              accessibilityRole="button"
              hitSlop={8}
            >
              <Text style={styles.playIcon}>{isPlaying ? '⏸' : '▶'}</Text>
            </Pressable>

            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                onNext();
              }}
              style={styles.controlButton}
              accessibilityLabel="Next track"
              accessibilityRole="button"
              hitSlop={8}
            >
              <Text style={styles.controlIcon}>⏭</Text>
            </Pressable>
          </View>
        </Pressable>
      </GlassCard>
    </Animated.View>
  );
}

const ARTWORK_SIZE = 48;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
  },
  card: {
    overflow: 'hidden',
  },
  progressStrip: {
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    width: '100%',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.accentBlue,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    minHeight: 64,
  },
  artwork: {
    width: ARTWORK_SIZE,
    height: ARTWORK_SIZE,
    borderRadius: radii.sm,
    backgroundColor: colors.darkGlassBorder,
  },
  artworkPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  artworkPlaceholderText: {
    fontSize: 20,
    color: colors.textMuted,
  },
  info: {
    flex: 1,
    marginLeft: spacing.md,
    marginRight: spacing.sm,
  },
  title: {
    ...typography.subtitle,
    color: colors.textOnDark,
  },
  artist: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlButton: {
    width: touchTargetMinSize,
    height: touchTargetMinSize,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlIcon: {
    fontSize: 18,
    color: colors.textOnDark,
  },
  playButton: {
    backgroundColor: colors.textWhite,
    borderRadius: touchTargetMinSize / 2,
    marginHorizontal: spacing.xs,
  },
  playIcon: {
    fontSize: 16,
    color: colors.textPrimary,
  },
});
