import React, { useMemo } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolation,
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
}

/**
 * Waveform - Displays a 40-bar audio waveform visualization.
 * The played portion shows a gradient fill, while the unplayed portion is muted.
 */
export default function Waveform({
  progress,
  progressValue,
  width = 300,
  height = 50,
  barHeights: customBarHeights,
  style,
}: WaveformProps) {
  const { barCount, barWidth, barGap, minHeight, maxHeight } = waveformConfig;

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

  // Calculate which bar index corresponds to current progress
  const progressBarIndex = Math.floor(progress * barCount);

  // Scale for fitting bars in container
  const totalBarsWidth = barCount * (barWidth + barGap) - barGap;
  const scale = width / totalBarsWidth;

  return (
    <View style={[styles.container, { width, height }, style]}>
      <View style={[styles.barsContainer, { transform: [{ scaleX: scale }] }]}>
        {barHeights.map((heightRatio, index) => {
          const barHeight = minHeight + (maxHeight - minHeight) * heightRatio;
          const isPlayed = index < progressBarIndex;
          const isActive = index === progressBarIndex;

          return (
            <WaveformBar
              key={index}
              height={barHeight}
              width={barWidth}
              isPlayed={isPlayed}
              isActive={isActive}
              index={index}
              progress={progress}
              progressValue={progressValue}
              barCount={barCount}
            />
          );
        })}
      </View>
    </View>
  );
}

interface WaveformBarProps {
  height: number;
  width: number;
  isPlayed: boolean;
  isActive: boolean;
  index: number;
  progress: number;
  progressValue?: any;
  barCount: number;
}

function WaveformBar({
  height,
  width,
  isPlayed,
  isActive,
  index,
  progress,
  progressValue,
  barCount,
}: WaveformBarProps) {
  // Subtle animation for bars near the progress point
  const animatedStyle = useAnimatedStyle(() => {
    if (!progressValue) {
      return {};
    }

    const currentProgress = progressValue.value;
    const barProgress = index / barCount;
    const distance = Math.abs(currentProgress - barProgress);

    // Animate bars within 5% of current progress
    if (distance < 0.05) {
      const scaleY = interpolate(
        distance,
        [0, 0.05],
        [1.15, 1],
        Extrapolation.CLAMP
      );
      return {
        transform: [{ scaleY }],
      };
    }

    return {};
  });

  const barStyle = [
    styles.bar,
    {
      height,
      width,
      marginRight: waveformConfig.barGap,
    },
  ];

  if (isPlayed || isActive) {
    // Gradient bar for played portion
    return (
      <Animated.View style={animatedStyle}>
        <LinearGradient
          colors={gradients.waveformPlayed}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={[barStyle, styles.playedBar]}
        />
      </Animated.View>
    );
  }

  // Muted bar for unplayed portion
  return (
    <Animated.View style={animatedStyle}>
      <View style={[barStyle, styles.unplayedBar]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    justifyContent: 'center',
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
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
