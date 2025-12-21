import React, { useEffect } from 'react';
import { StyleSheet, Pressable, View, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, RadialGradient, Stop, Circle } from 'react-native-svg';
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
import { colors, gradients, touchTargetMinSize, shadows, animation } from '../utils/tokens';
import Ionicons from '@expo/vector-icons/Ionicons';

interface PlayButtonProps {
  isPlaying: boolean;
  onPress: () => void;
  size?: number;
  accessibilityLabel?: string;
}

export default function PlayButton({
  isPlaying,
  onPress,
  size = 64,
  accessibilityLabel,
}: PlayButtonProps) {
  const glowProgress = useSharedValue(0); // Animation for the glowing pulse
  const pressScale = useSharedValue(1); // Animation for press interactions

  useEffect(() => {
    if (isPlaying) {
      glowProgress.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 1000, easing: Easing.inOut(Easing.ease) })
        ),
        -1, // Infinite loop
        false
      );
    } else {
      cancelAnimation(glowProgress);
      glowProgress.value = withTiming(0, { duration: animation.duration.normal });
    }
  }, [isPlaying, glowProgress]);

  const glowStyle = useAnimatedStyle(() => {
    const scale = interpolate(glowProgress.value, [0, 1], [1, 1.15]);
    const opacity = interpolate(glowProgress.value, [0, 1], [0.3, 0.6]);
    return {
      transform: [{ scale }],
      opacity,
    };
  });

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));

  const handlePressIn = () => {
    pressScale.value = withTiming(0.92, { duration: animation.duration.fast });
  };

  const handlePressOut = () => {
    pressScale.value = withTiming(1, { duration: animation.duration.fast });
  };

  const iconSize = size * 0.4;
  const glowSize = size * 2.5; // Glow size expanded for softer effect

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || (isPlaying ? 'Pause' : 'Play')}
      accessibilityState={{ checked: isPlaying }}
      style={[styles.wrapper, { width: Math.max(size, touchTargetMinSize), height: Math.max(size, touchTargetMinSize) }]}
    >
      {/* Glow effect (SVG Radial Gradient) */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: glowSize,
            height: glowSize,
            alignItems: 'center',
            justifyContent: 'center',
          },
          glowStyle,
        ]}
      >
        <Svg height={glowSize} width={glowSize}>
          <Defs>
            <RadialGradient
              id="glowGrad"
              cx="50%"
              cy="50%"
              rx="50%"
              ry="50%"
              fx="50%"
              fy="50%"
              gradientUnits="userSpaceOnUse"
            >
              <Stop offset="20%" stopColor={colors.primaryBlue} stopOpacity="0.3" />
              <Stop offset="70%" stopColor={colors.accentBlue} stopOpacity="0.1" />
              <Stop offset="100%" stopColor={colors.accentBlue} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx={glowSize / 2} cy={glowSize / 2} r={glowSize / 2} fill="url(#glowGrad)" />
        </Svg>
      </Animated.View>

      {/* Button UI */}
      <Animated.View style={[styles.buttonOuter, { width: size, height: size }, buttonStyle]}>
        <LinearGradient
          colors={gradients.playButton}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.button, { width: size, height: size, borderRadius: size / 2 }]}
        >
          <Ionicons name={isPlaying ? 'pause' : 'play'} size={iconSize} color={colors.textWhite} />
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
  buttonOuter: {
    ...Platform.select({
      ios: shadows.playButton,
      android: shadows.playButton,
    }),
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
});