/**
 * MiniPlayer Component
 * Compact player bar for bottom navigation with animated progress.
 * Uses react-native-reanimated for smooth animations.
 */
import React from 'react';
import { View, Text, Image, StyleSheet, Pressable, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radii, durations, springConfig, hitSlop, iconSizes } from '../utils/tokens';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Song {
  id: string | number;
  title: string;
  artist?: string | null;
  cover_url?: string | null;
}

interface MiniPlayerProps {
  /** Current song data */
  song: Song | null;
  /** Whether audio is playing */
  isPlaying: boolean;
  /** Current position in milliseconds */
  positionMillis: number;
  /** Total duration in milliseconds */
  durationMillis: number;
  /** Callback for play/pause toggle */
  onTogglePlay: () => void;
  /** Callback for next track */
  onNext: () => void;
  /** Callback for previous track */
  onPrev: () => void;
  /** Callback when player bar is pressed (navigate to full player) */
  onPress?: () => void;
  /** Optional testID for testing */
  testID?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * MiniPlayer displays a compact player bar at the bottom of the screen.
 * Shows current track info, playback controls, and an animated progress bar.
 * 
 * TODO: Wire to real playback service
 * - Connect positionMillis/durationMillis to audio engine
 * - Implement gesture-based scrubbing on progress bar
 */
export default function MiniPlayer({
  song,
  isPlaying,
  positionMillis,
  durationMillis,
  onTogglePlay,
  onNext,
  onPrev,
  onPress,
  testID,
}: MiniPlayerProps) {
  const scale = useSharedValue(1);
  const progressValue = useSharedValue(0);

  // Animate progress bar
  React.useEffect(() => {
    const progress = durationMillis > 0 
      ? (positionMillis / durationMillis) * 100 
      : 0;
    progressValue.value = withTiming(progress, { duration: durations.progress });
  }, [positionMillis, durationMillis, progressValue]);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedProgressStyle = useAnimatedStyle(() => ({
    width: `${progressValue.value}%`,
  }));

  const handlePressIn = () => {
    scale.value = withTiming(0.98, { duration: durations.instant });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: durations.fast });
  };

  if (!song) return null;

  return (
    <AnimatedPressable
      testID={testID}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.container, animatedContainerStyle]}
    >
      {/* Progress bar at top */}
      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressFill, animatedProgressStyle]} />
      </View>

      <View style={styles.content}>
        {/* Album art */}
        {song.cover_url ? (
          <Image 
            source={{ uri: song.cover_url }} 
            style={styles.artwork} 
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.artwork, styles.artworkPlaceholder]}>
            <Ionicons name="musical-notes" size={20} color={colors.textSecondary} />
          </View>
        )}

        {/* Song info */}
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>
            {song.title}
          </Text>
          {song.artist && (
            <Text style={styles.artist} numberOfLines={1}>
              {song.artist}
            </Text>
          )}
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <Pressable 
            onPress={onPrev} 
            hitSlop={hitSlop}
            style={styles.controlButton}
          >
            <Ionicons name="play-skip-back" size={iconSizes.md} color={colors.text} />
          </Pressable>

          <Pressable 
            onPress={onTogglePlay} 
            hitSlop={hitSlop}
            style={styles.playButton}
          >
            <Ionicons 
              name={isPlaying ? 'pause' : 'play'} 
              size={iconSizes.md} 
              color={colors.textLight} 
            />
          </Pressable>

          <Pressable 
            onPress={onNext} 
            hitSlop={hitSlop}
            style={styles.controlButton}
          >
            <Ionicons name="play-skip-forward" size={iconSizes.md} color={colors.text} />
          </Pressable>
        </View>
      </View>
    </AnimatedPressable>
  );
}

const PLAYER_HEIGHT = 64;

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.backgroundDark,
    borderRadius: radii.lg,
    marginHorizontal: spacing.lg,
    overflow: 'hidden',
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  progressTrack: {
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    height: PLAYER_HEIGHT,
    paddingHorizontal: spacing.md,
  },
  artwork: {
    width: 44,
    height: 44,
    borderRadius: radii.sm,
    marginRight: spacing.md,
  },
  artworkPlaceholder: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    marginRight: spacing.md,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textLight,
  },
  artist: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlButton: {
    padding: spacing.sm,
  },
  playButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.round,
    padding: spacing.sm,
    marginHorizontal: spacing.xs,
  },
});
