/**
 * PlayButton Component
 * Animated play/pause button using react-native-reanimated and @expo/vector-icons.
 * Provides proper toggle logic, accessibility, and press feedback.
 */
import React from 'react';
import { Pressable, StyleSheet, AccessibilityInfo } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors, durations, springConfig, iconSizes, hitSlop, radii } from '../utils/tokens';

interface PlayButtonProps {
  /** Whether audio is currently playing */
  isPlaying: boolean;
  /** Callback when button is pressed to toggle play/pause */
  onToggle: () => void;
  /** Optional size override (default: 56) */
  size?: number;
  /** Optional custom background color */
  backgroundColor?: string;
  /** Optional custom icon color */
  iconColor?: string;
  /** Optional testID for testing */
  testID?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * PlayButton provides an accessible, animated play/pause control.
 * - Animates scale on press
 * - Animates icon opacity/rotation on state change
 * - Accessible with proper role and label
 */
export default function PlayButton({
  isPlaying,
  onToggle,
  size = 56,
  backgroundColor = colors.primary,
  iconColor = colors.textLight,
  testID,
}: PlayButtonProps) {
  // Animation values
  const scale = useSharedValue(1);
  const iconProgress = useSharedValue(isPlaying ? 1 : 0);

  // Update icon animation when isPlaying changes
  React.useEffect(() => {
    iconProgress.value = withTiming(isPlaying ? 1 : 0, { duration: durations.fast });
  }, [isPlaying, iconProgress]);

  // Scale animation for press feedback
  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Icon opacity/scale animation
  const animatedIconStyle = useAnimatedStyle(() => ({
    opacity: interpolate(iconProgress.value, [0, 0.5, 1], [1, 0.7, 1]),
    transform: [
      { scale: interpolate(iconProgress.value, [0, 0.5, 1], [1, 0.9, 1]) },
    ],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.92, springConfig.snappy);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, springConfig.snappy);
  };

  const handlePress = () => {
    onToggle();
    // Announce state change for accessibility
    const announcement = isPlaying ? 'Paused' : 'Playing';
    AccessibilityInfo.announceForAccessibility(announcement);
  };

  const iconName = isPlaying ? 'pause' : 'play';
  const iconSize = Math.round(size * 0.5);

  return (
    <AnimatedPressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
      accessibilityState={{ checked: isPlaying }}
      hitSlop={hitSlop}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.container,
        animatedContainerStyle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor,
        },
      ]}
    >
      <Animated.View style={animatedIconStyle}>
        <Ionicons
          name={iconName}
          size={iconSize}
          color={iconColor}
          style={!isPlaying && styles.playIconOffset}
        />
      </Animated.View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  // Play icon visual center offset (play icons are often visually off-center)
  playIconOffset: {
    marginLeft: 3,
  },
});
