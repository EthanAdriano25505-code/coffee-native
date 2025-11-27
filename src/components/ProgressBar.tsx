import React from 'react';
import { StyleSheet, View, ViewStyle, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { colors, gradients } from '../utils/tokens';

interface ProgressBarProps {
  /** Progress from 0 to 1 */
  progress: number;
  /** Buffer progress from 0 to 1 (for streaming) */
  buffered?: number;
  /** Width of the progress bar */
  width?: number;
  style?: ViewStyle;
}

const THUMB_SIZE = 16;
const THUMB_HALO_SIZE = 32;
const TRACK_HEIGHT = 4;

/**
 * ProgressBar - A styled progress bar with buffered track, gradient progress,
 * and a thumb with blue halo. This is a display-only component; for seeking,
 * use the native Slider component in PlayerScreen.
 */
export default function ProgressBar({
  progress,
  buffered = 0,
  width: containerWidth = 300,
  style,
}: ProgressBarProps) {
  const animatedProgress = useSharedValue(progress);

  // Update animated progress when props change
  React.useEffect(() => {
    animatedProgress.value = withTiming(progress, { duration: 100 });
  }, [progress, animatedProgress]);

  const thumbAnimatedStyle = useAnimatedStyle(() => {
    const trackWidth = containerWidth - THUMB_SIZE;
    const translateX = animatedProgress.value * trackWidth;
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
