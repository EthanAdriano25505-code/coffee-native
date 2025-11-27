import React, { useEffect } from 'react';
import { StyleSheet, Pressable, View, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  interpolate,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import { colors, gradients, radii, shadows, touchTargetMinSize, animation } from '../utils/tokens';

interface PlayButtonProps {
  isPlaying: boolean;
  onPress: () => void;
  size?: number;
  accessibilityLabel?: string;
}

/**
 * PlayButton - Gradient play/pause button with pulsing glow animation when playing.
 * Uses Reanimated for smooth 60fps animations.
 */
export default function PlayButton({
  isPlaying,
  onPress,
  size = 64,
  accessibilityLabel,
}: PlayButtonProps) {
  // Shared value for pulsing glow animation (0 to 1)
  const glowProgress = useSharedValue(0);
  // Shared value for press scale animation
  const pressScale = useSharedValue(1);

  // Start/stop pulsing animation based on playing state
  useEffect(() => {
    if (isPlaying) {
      glowProgress.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 1200, easing: Easing.inOut(Easing.ease) })
        ),
        -1, // infinite repeat
        false
      );
    } else {
      cancelAnimation(glowProgress);
      glowProgress.value = withTiming(0, { duration: animation.duration.normal });
    }
  }, [isPlaying, glowProgress]);

  // Animated style for the glow effect
  const glowStyle = useAnimatedStyle(() => {
    const scale = interpolate(glowProgress.value, [0, 1], [1, 1.15]);
    const opacity = interpolate(glowProgress.value, [0, 1], [0.3, 0.6]);
    return {
      transform: [{ scale }],
      opacity,
    };
  });

  // Animated style for press feedback
  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));

  const handlePressIn = () => {
    pressScale.value = withTiming(0.92, { duration: 100 });
  };

  const handlePressOut = () => {
    pressScale.value = withTiming(1, { duration: 150 });
  };

  const iconSize = size * 0.4;
  const iconStyle = isPlaying
    ? { fontSize: iconSize, color: colors.textWhite }
    : { fontSize: iconSize, color: colors.textWhite, marginLeft: size * 0.05 }; // slight offset for play icon visual centering

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityLabel={accessibilityLabel || (isPlaying ? 'Pause' : 'Play')}
      accessibilityRole="button"
      accessibilityState={{ checked: isPlaying }}
      style={[styles.wrapper, { width: Math.max(size, touchTargetMinSize), height: Math.max(size, touchTargetMinSize) }]}
    >
      {/* Glow effect layer (behind button) */}
      <Animated.View
        style={[
          styles.glow,
          {
            width: size * 1.4,
            height: size * 1.4,
            borderRadius: size * 0.7,
          },
          glowStyle,
        ]}
      />

      {/* Main button with gradient */}
      <Animated.View style={[styles.buttonOuter, { width: size, height: size }, buttonStyle]}>
        <LinearGradient
          colors={gradients.playButton}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.button, { width: size, height: size, borderRadius: size / 2 }]}
        >
          <View style={styles.iconContainer}>
            {isPlaying ? (
              <View style={styles.pauseIcon}>
                <View style={[styles.pauseBar, { height: iconSize * 0.6, width: iconSize * 0.18 }]} />
                <View style={[styles.pauseBar, { height: iconSize * 0.6, width: iconSize * 0.18, marginLeft: iconSize * 0.22 }]} />
              </View>
            ) : (
              <View
                style={[
                  styles.playIcon,
                  {
                    borderLeftWidth: iconSize * 0.6,
                    borderTopWidth: iconSize * 0.35,
                    borderBottomWidth: iconSize * 0.35,
                    marginLeft: size * 0.08,
                  },
                ]}
              />
            )}
          </View>
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  glow: {
    position: 'absolute',
    backgroundColor: colors.accentBlue,
  },
  buttonOuter: {
    ...Platform.select({
      ios: shadows.playButton,
      android: shadows.playButton,
    }),
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pauseIcon: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pauseBar: {
    backgroundColor: colors.textWhite,
    borderRadius: 2,
  },
  playIcon: {
    width: 0,
    height: 0,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: colors.textWhite,
    borderStyle: 'solid',
  },
});
