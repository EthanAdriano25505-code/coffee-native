import React, { useMemo, useEffect } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import { colors, gradients, waveform as waveformConfig } from '../utils/tokens';

interface WaveformProps {
  /** Progress from 0 to 1 */
  progress: number;
  /** Optional animated shared value for smoother progress updates */
  progressValue?: any;
  /** Width of the waveform container */
  width?: number;
  /** Height of the waveform container */
  height?: number;
  /** Custom bar heights array (0-1 normalized) */
  barHeights?: number[];
  style?: ViewStyle;
  /** Whether the audio is currently playing */
  isPlaying?: boolean;
}

/**
 * Waveform - Displays a 40-bar audio waveform visualization.
 * The played portion shows a gradient fill, while the unplayed portion is muted.
 * Bars animate when playing to simulate audio visualization.
 */
export default function Waveform({
  progress,
  progressValue,
  width = 300,
  height = 50,
  barHeights: customBarHeights,
  style,
  isPlaying = false,
}: WaveformProps) {
  const { barCount, barGap, minHeight, maxHeight } = waveformConfig;

  // NEW: Calculate bar width to fill container
  const barWidth = (width - (barCount - 1) * barGap) / barCount;

  // Shared value for animation phase (0 to 1)
  const animationPhase = useSharedValue(0);

  useEffect(() => {
    if (isPlaying) {
      animationPhase.value = withRepeat(
        withTiming(1, { duration: 1000, easing: Easing.linear }),
        -1,
        false
      );
    } else {
      cancelAnimation(animationPhase);
      // Optional: reset or keep current phase
    }
  }, [isPlaying, animationPhase]);

  // Generate deterministic bar heights if not provided
  const barHeights = useMemo(() => {
    if (customBarHeights && customBarHeights.length === barCount) {
      return customBarHeights;
    }
    // Generate pseudo-random but deterministic heights
    const heights: number[] = [];
    for (let i = 0; i < barCount; i++) {
      // Use a simple deterministic pattern for visual interest
      const seed = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
      const normalized = (seed - Math.floor(seed)) * 0.7 + 0.3; // Range 0.3-1.0
      heights.push(normalized);
    }
    return heights;
  }, [customBarHeights, barCount]);

  // Calculate which bar index corresponds to current progress (fallback)
  const progressBarIndex = Math.floor(progress * barCount);

  return (
    <View style={[styles.container, { width, height }, style]}>
      <View style={styles.barsContainer}>
        {barHeights.map((heightRatio, index) => {
          return (
            <WaveformBar
              key={index}
              baseHeightRatio={heightRatio}
              minHeight={minHeight}
              maxHeight={maxHeight}
              width={barWidth}
              index={index}
              progress={progress}
              progressValue={progressValue}
              barCount={barCount}
              animationPhase={animationPhase}
              isPlaying={isPlaying}
            />
          );
        })}
      </View>
    </View>
  );
}

interface WaveformBarProps {
  baseHeightRatio: number;
  minHeight: number;
  maxHeight: number;
  width: number;
  index: number;
  progress: number;
  progressValue?: any;
  barCount: number;
  animationPhase: any;
  isPlaying: boolean;
}

function WaveformBarComponent({
  baseHeightRatio,
  minHeight,
  maxHeight,
  width,
  index,
  progress,
  progressValue,
  barCount,
  animationPhase,
  isPlaying,
}: WaveformBarProps) {
  // Random offset for each bar to make animation look organic
  const randomOffset = useMemo(() => Math.random() * Math.PI * 2, []);

  const barHeight = minHeight + (maxHeight - minHeight) * baseHeightRatio;
  const barStyle = [
    styles.bar,
    {
      height: barHeight,
      width,
    },
  ];

  // Animated style driven by both the visual audio phase and the progress shared value
  const animatedStyle = useAnimatedStyle(() => {
    let scaleY = 1;
    if (isPlaying) {
      const phase = animationPhase.value * Math.PI * 2;
      const wave1 = Math.sin(index * 0.5 + phase + randomOffset);
      const wave2 = Math.cos(index * 0.3 - phase * 2);
      const variation = (wave1 + wave2) * 0.12;
      scaleY = 1 + variation;
    }
    return {
      transform: [{ scaleY }],
    };
  });

  const overlayAnimatedStyle = useAnimatedStyle(() => {
    let playedOpacity = 0;
    if (progressValue) {
      const cur = progressValue.value;
      const barProgress = index / barCount;
      if (cur >= barProgress + (1 / barCount) * 0.5) {
        playedOpacity = 1;
      } else if (cur <= barProgress - (1 / barCount) * 0.5) {
        playedOpacity = 0;
      } else {
        const d = Math.max(0, Math.abs(cur - barProgress));
        playedOpacity = interpolate(d, [0.0, 0.5], [1, 0], Extrapolation.CLAMP);
        playedOpacity = 1 - playedOpacity;
      }
    } else {
      const cur = progress;
      const barProgress = index / barCount;
      playedOpacity = cur >= barProgress ? 1 : 0;
    }
    return { opacity: playedOpacity };
  });

  // We render both layers: base unplayed and overlay gradient for played portion.
  // The gradient's visual opacity is pulled via an inner animated view.
  return (
    <Animated.View style={animatedStyle}>
      <View style={[barStyle, styles.unplayedBar]} />
      <Animated.View style={[StyleSheet.absoluteFill, overlayAnimatedStyle]} pointerEvents="none">
        <LinearGradient
          colors={gradients.waveformPlayed}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={[barStyle, styles.playedBar]}
        />
      </Animated.View>
    </Animated.View>
  );
}

const WaveformBar = React.memo(WaveformBarComponent);

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    justifyContent: 'center',
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  bar: {
    borderRadius: 2,
  },
  playedBar: {
    // Gradient applied via LinearGradient
  },
  unplayedBar: {
    backgroundColor: colors.controlInactive,
    opacity: 0.4,
  },
});
