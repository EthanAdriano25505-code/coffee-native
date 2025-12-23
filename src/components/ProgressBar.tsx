/**
 * ProgressBar Component
 * Animated progress bar using react-native-reanimated.
 * Designed to be wired to a real audio engine (Supabase data later).
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { colors, durations, spacing, radii } from '../utils/tokens';

interface ProgressBarProps {
  /** Current position in milliseconds */
  positionMillis: number;
  /** Total duration in milliseconds */
  durationMillis: number;
  /** Whether to show time labels (default: true) */
  showLabels?: boolean;
  /** Optional custom track color */
  trackColor?: string;
  /** Optional custom progress color */
  progressColor?: string;
  /** Height of the progress bar (default: 4) */
  height?: number;
  /** Optional testID for testing */
  testID?: string;
}

/**
 * Format milliseconds to mm:ss display string
 */
function formatTime(ms: number | null | undefined): string {
  if (!ms || ms < 0) return '0:00';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * ProgressBar displays animated playback progress.
 * 
 * TODO: Wire to real playback service
 * - Connect positionMillis/durationMillis to audio engine (e.g., Expo AV, Supabase streaming)
 * - Add onSeek callback for scrubbing functionality
 * - Consider adding buffered progress indicator
 */
export default function ProgressBar({
  positionMillis,
  durationMillis,
  showLabels = true,
  trackColor = colors.trackBackground,
  progressColor = colors.trackProgress,
  height = 4,
  testID,
}: ProgressBarProps) {
  const animatedWidth = useSharedValue(0);

  // Calculate progress percentage and animate
  React.useEffect(() => {
    const progress = durationMillis > 0 
      ? Math.min((positionMillis / durationMillis) * 100, 100) 
      : 0;
    
    animatedWidth.value = withTiming(progress, {
      duration: durations.progress,
    });
  }, [positionMillis, durationMillis, animatedWidth]);

  const animatedProgressStyle = useAnimatedStyle(() => ({
    width: `${animatedWidth.value}%`,
  }));

  return (
    <View testID={testID} style={styles.container}>
      {showLabels && (
        <Text style={styles.timeLabel}>{formatTime(positionMillis)}</Text>
      )}
      
      <View 
        style={[
          styles.track,
          { backgroundColor: trackColor, height },
        ]}
      >
        <Animated.View
          style={[
            styles.progress,
            animatedProgressStyle,
            { backgroundColor: progressColor, height },
          ]}
        />
      </View>

      {showLabels && (
        <Text style={styles.timeLabel}>{formatTime(durationMillis)}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: spacing.sm,
  },
  track: {
    flex: 1,
    borderRadius: radii.sm,
    overflow: 'hidden',
    marginHorizontal: spacing.sm,
  },
  progress: {
    borderRadius: radii.sm,
  },
  timeLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    minWidth: 40,
    textAlign: 'center',
  },
});
