import React, { useEffect } from 'react';
import { StyleSheet, View, ViewStyle, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolate,
  Extrapolation,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';
import { colors, gradients } from '../utils/tokens';

interface ProgressBarProps {
  /** Current progress (0-1) from source of truth */
  progress: number;
  /** Total duration in ms (needed for smooth interpolation) */
  durationMillis?: number;
  /** Whether currently playing (to drive local animation) */
  isPlaying?: boolean;
  /** Optional shared value to drive progress without re-rendering */
  progressShared?: any;
  /** Buffer progress from 0 to 1 */
  buffered?: number;
  /** Width of the progress bar */
  width?: number;
  style?: ViewStyle;
}

const THUMB_SIZE = 16;
const THUMB_HALO_SIZE = 32;
const TRACK_HEIGHT = 4;

/**
 * ProgressBar - Optimized for smooth playback.
 * Uses Reanimated to interpolate progress between updates.
 */
export default function ProgressBar({
  progress,
  durationMillis = 0,
  isPlaying = false,
  buffered = 0,
  width: containerWidth = 300,
  progressShared,
  style,
}: ProgressBarProps) {
  // The animated value driving the UI. Prefer an external shared value
  // (so we avoid React re-renders) when provided.
  const internalProgress = useSharedValue(progress);
  const animatedProgress = progressShared ?? internalProgress;

  useEffect(() => {
    if (progressShared) {
      // external owner will drive the shared value; do nothing
      return;
    }

    cancelAnimation(animatedProgress);

    if (isPlaying && durationMillis > 0) {
      const remaining = 1 - progress;
      const dur = Math.max(50, remaining * durationMillis);
      internalProgress.value = progress;
      internalProgress.value = withTiming(1, { duration: dur, easing: Easing.linear });
    } else {
      internalProgress.value = withTiming(progress, { duration: 100 });
    }
  }, [progress, isPlaying, durationMillis, animatedProgress, progressShared, internalProgress]);

  const thumbAnimatedStyle = useAnimatedStyle(() => {
    const trackWidth = containerWidth - THUMB_SIZE;
    const translateX = interpolate(
      animatedProgress.value,
      [0, 1],
      [0, trackWidth],
      Extrapolation.CLAMP
    );
    return {
      transform: [{ translateX }],
    };
  });

  const progressAnimatedStyle = useAnimatedStyle(() => {
    const width = interpolate(
      animatedProgress.value,
      [0, 1],
      [0, containerWidth - THUMB_SIZE],
      Extrapolation.CLAMP
    );
    return {
      width: width + THUMB_SIZE / 2,
    };
  });

  // Calculate buffered width
  const bufferedWidth = buffered * (containerWidth - THUMB_SIZE);

  return (
    <View style={[styles.container, { width: containerWidth }, style]}>
      <View style={styles.trackContainer}>
        {/* Base track */}
        <View style={[styles.track, { width: containerWidth }]} />

        {/* Buffered track */}
        {buffered > 0 && (
          <View style={[styles.bufferedTrack, { width: bufferedWidth + THUMB_SIZE / 2 }]} />
        )}

        {/* Progress track with gradient */}
        <Animated.View style={[styles.progressTrack, progressAnimatedStyle]}>
          <LinearGradient
            colors={gradients.playButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFillObject}
          />
        </Animated.View>
      </View>

      {/* Thumb */}
      <Animated.View style={[styles.thumbContainer, thumbAnimatedStyle]}>
        {/* Halo effect */}
        <View style={styles.thumbHalo} />
        {/* Thumb */}
        <View style={styles.thumb} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: THUMB_HALO_SIZE,
    justifyContent: 'center',
    position: 'relative',
  },
  trackContainer: {
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    overflow: 'hidden',
    position: 'relative',
  },
  track: {
    height: TRACK_HEIGHT,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    borderRadius: TRACK_HEIGHT / 2,
  },
  bufferedTrack: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: TRACK_HEIGHT,
    backgroundColor: colors.progressTrack,
    borderRadius: TRACK_HEIGHT / 2,
  },
  progressTrack: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    overflow: 'hidden',
  },
  thumbContainer: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    top: (THUMB_HALO_SIZE - THUMB_SIZE) / 2,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbHalo: {
    position: 'absolute',
    width: THUMB_HALO_SIZE,
    height: THUMB_HALO_SIZE,
    borderRadius: THUMB_HALO_SIZE / 2,
    backgroundColor: colors.progressThumbHalo,
    opacity: 0.5,
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: colors.textWhite,
    ...Platform.select({
      ios: {
        shadowColor: colors.primaryBlue,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
});
