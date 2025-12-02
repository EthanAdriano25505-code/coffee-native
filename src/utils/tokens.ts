/**
 * Motion Tokens
 * Centralized animation configuration for consistent UX across PlayerScreen and related components.
 * These tokens are tuned for Reanimated v3+ / Expo SDK 54.
 */

/** Colors used across the player UI */
export const colors = {
  primary: '#2f6dfd',
  primaryDark: '#1a52d4',
  background: '#ffffff',
  backgroundDark: '#111111',
  surface: '#f7f7f8',
  text: '#111111',
  textSecondary: '#666666',
  textLight: '#ffffff',
  border: '#e0e0e0',
  trackProgress: '#2f6dfd',
  trackBackground: '#e0e0e0',
  glassBackground: 'rgba(255, 255, 255, 0.15)',
  glassBorder: 'rgba(255, 255, 255, 0.25)',
  shadowColor: '#000000',
} as const;

/** Spacing scale (in pixels) */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

/** Border radius values */
export const radii = {
  sm: 8,
  md: 12,
  lg: 18,
  xl: 24,
  round: 9999,
} as const;

/** Animation durations in milliseconds */
export const durations = {
  /** Very fast micro-interactions (button press feedback) */
  instant: 80,
  /** Quick transitions (icon changes, state toggles) */
  fast: 150,
  /** Standard UI transitions */
  normal: 250,
  /** Slower, more deliberate animations */
  slow: 400,
  /** Progress bar smooth updates */
  progress: 300,
} as const;

/**
 * Easing presets using Reanimated's native spring/timing configurations.
 * For withSpring, use springConfig; for withTiming, use timingConfig.
 */
export const springConfig = {
  /** Snappy, responsive feel for button presses */
  snappy: {
    damping: 15,
    stiffness: 300,
    mass: 0.8,
  },
  /** Gentle bounce for playful elements */
  bouncy: {
    damping: 10,
    stiffness: 150,
    mass: 1,
  },
  /** Smooth, no overshoot for progress-like animations */
  smooth: {
    damping: 20,
    stiffness: 200,
    mass: 1,
  },
} as const;

/**
 * Timing configs with easing for withTiming
 * Import Easing from 'react-native-reanimated' when using
 */
export const timingConfig = {
  /** Linear progress animation */
  linear: {
    duration: durations.progress,
  },
  /** Standard ease-out for UI transitions */
  easeOut: {
    duration: durations.normal,
  },
  /** Quick fade in/out */
  fade: {
    duration: durations.fast,
  },
} as const;

/** Icon sizes */
export const iconSizes = {
  sm: 18,
  md: 24,
  lg: 32,
  xl: 48,
  playButton: 28,
} as const;

/** Hit slop for touch targets (accessibility) */
export const hitSlop = {
  top: 12,
  bottom: 12,
  left: 12,
  right: 12,
} as const;

/** Z-index layers */
export const zIndex = {
  base: 0,
  overlay: 10,
  modal: 20,
  toast: 30,
} as const;

export default {
  colors,
  spacing,
  radii,
  durations,
  springConfig,
  timingConfig,
  iconSizes,
  hitSlop,
  zIndex,
};
