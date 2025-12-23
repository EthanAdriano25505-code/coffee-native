/**
 * Waveform Component
 * Animated waveform visualization placeholder for audio playback.
 * Uses react-native-reanimated for smooth bar animations.
 * 
 * TODO: Wire to real audio engine
 * - Connect to audio frequency/amplitude data from playback service
 * - Implement real-time audio visualization using FFT data
 * - Consider using Expo AV's onPlaybackStatusUpdate for position-based animation
 */
import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  cancelAnimation,
} from 'react-native-reanimated';
import { colors, durations, radii } from '../utils/tokens';

interface WaveformProps {
  /** Whether the waveform should animate (tied to isPlaying) */
  isAnimating: boolean;
  /** Number of bars to display (default: 5) */
  barCount?: number;
  /** Width of each bar (default: 4) */
  barWidth?: number;
  /** Maximum height of bars (default: 24) */
  maxHeight?: number;
  /** Minimum height of bars (default: 8) */
  minHeight?: number;
  /** Gap between bars (default: 3) */
  gap?: number;
  /** Bar color when active */
  activeColor?: string;
  /** Bar color when inactive */
  inactiveColor?: string;
  /** Optional testID for testing */
  testID?: string;
}

/**
 * Waveform displays animated bars that simulate audio visualization.
 * When isAnimating is true, bars animate up and down at staggered intervals.
 * When paused, bars smoothly transition to a resting state.
 */
export default function Waveform({
  isAnimating,
  barCount = 5,
  barWidth = 4,
  maxHeight = 24,
  minHeight = 8,
  gap = 3,
  activeColor = colors.primary,
  inactiveColor = colors.trackBackground,
  testID,
}: WaveformProps) {
  // Generate bar animation values
  const bars = useMemo(() => {
    return Array.from({ length: barCount }, (_, index) => ({
      key: `bar-${index}`,
      delay: index * 100, // Stagger animation start
      // Random-ish height variation for organic feel
      heightVariation: 0.6 + (Math.sin(index * 1.2) * 0.4),
    }));
  }, [barCount]);

  return (
    <View testID={testID} style={styles.container}>
      {bars.map((bar, index) => (
        <WaveformBar
          key={bar.key}
          isAnimating={isAnimating}
          delay={bar.delay}
          barIndex={index}
          barWidth={barWidth}
          maxHeight={maxHeight * bar.heightVariation}
          minHeight={minHeight}
          activeColor={activeColor}
          inactiveColor={inactiveColor}
          style={index < barCount - 1 ? { marginRight: gap } : undefined}
        />
      ))}
    </View>
  );
}

interface WaveformBarProps {
  isAnimating: boolean;
  delay: number;
  barIndex: number; // Used for deterministic duration variation
  barWidth: number;
  maxHeight: number;
  minHeight: number;
  activeColor: string;
  inactiveColor: string;
  style?: object;
}

/**
 * Generate deterministic duration variation based on bar index.
 * Uses a simple sine-based formula for organic-feeling but predictable animation.
 */
function getDeterministicDuration(baseMs: number, barIndex: number): number {
  // Use sine wave for variation (0.8x to 1.2x of base duration)
  const variation = 0.8 + (Math.sin(barIndex * 1.7) + 1) * 0.2;
  return Math.round(baseMs * variation);
}

function WaveformBar({
  isAnimating,
  delay,
  barIndex,
  barWidth,
  maxHeight,
  minHeight,
  activeColor,
  inactiveColor,
  style,
}: WaveformBarProps) {
  const height = useSharedValue(minHeight);
  const color = useSharedValue(0); // 0 = inactive, 1 = active

  // Calculate deterministic durations based on bar index
  const upDuration = getDeterministicDuration(350, barIndex);
  const downDuration = getDeterministicDuration(350, barIndex + 3);

  React.useEffect(() => {
    if (isAnimating) {
      // Animate color to active
      color.value = withTiming(1, { duration: durations.fast });
      
      // Start height animation with delay and repeat
      height.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(maxHeight, { duration: upDuration }),
            withTiming(minHeight, { duration: downDuration })
          ),
          -1, // Infinite repeat
          true // Reverse
        )
      );
    } else {
      // Stop animation and return to rest
      cancelAnimation(height);
      height.value = withTiming(minHeight, { duration: durations.normal });
      color.value = withTiming(0, { duration: durations.normal });
    }
  }, [isAnimating, delay, maxHeight, minHeight, upDuration, downDuration, height, color]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: height.value,
    backgroundColor: color.value === 1 ? activeColor : inactiveColor,
  }));

  return (
    <Animated.View
      style={[
        styles.bar,
        { width: barWidth, borderRadius: barWidth / 2 },
        animatedStyle,
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bar: {
    backgroundColor: colors.trackBackground,
  },
});
