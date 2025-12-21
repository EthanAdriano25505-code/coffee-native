/**
 * Design tokens for the liquid glass UI player
 * Centralized colors, spacing, radii, and animation values
 */

export const colors = {
  // Background gradient (white to blue)
  backgroundTop: '#FFFFFF',
  // Make background stops neutral/white for light mode
  backgroundMid: '#F8F9FA',
  backgroundBottom: '#FFFFFF',

  // Primary accent colors
  primaryBlue: '#2F80ED', // Standard Blue
  accentBlue: '#0AA1FF', // Light Blue

  // Glass effect colors
  glassBackground: 'rgba(255, 255, 255, 0.25)',
  glassBorder: 'rgba(255, 255, 255, 0.30)',
  glassBorderSubtle: 'rgba(255, 255, 255, 0.12)',
  glassHighlight: 'rgba(255, 255, 255, 0.50)',

  // Dark glass (for mini player)
  darkGlassBackground: 'rgba(17, 17, 17, 0.85)',
  darkGlassBorder: 'rgba(255, 255, 255, 0.08)',

  // Dark Mode Gradient Colors (Premium Midnight)
  backgroundDarkTop: '#0f172a', // Deep Navy
  backgroundDarkMid: '#1e1b4b', // Deep Purple
  backgroundDarkBottom: '#000000', // Pure Black

  // Text colors
  textPrimary: '#111111',
  textSecondary: '#666666',
  textMuted: '#999999',
  textWhite: '#FFFFFF',
  textOnDark: '#FFFFFF',

  // Progress bar colors
  progressTrack: 'rgba(47, 128, 237, 0.20)', // accentBlue at 20% opacity
  progressThumbHalo: 'rgba(47, 128, 237, 0.30)',

  // Control colors
  controlInactive: '#AAAAAA',
  controlActive: '#2F80ED',

  // Shadows
  shadowLight: 'rgba(0, 0, 0, 0.08)',
  shadowMedium: 'rgba(0, 0, 0, 0.12)',
  shadowDark: 'rgba(0, 0, 0, 0.25)',
};

export const gradients = {
  background: [colors.backgroundTop, colors.backgroundMid, colors.backgroundBottom] as const,
  backgroundDark: [colors.backgroundDarkTop, colors.backgroundDarkMid, colors.backgroundDarkBottom] as const,
  playButton: [colors.primaryBlue, colors.accentBlue] as const,
  waveformPlayed: [colors.primaryBlue, colors.accentBlue] as const,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  round: 9999,
};

export const blur = {
  glass: 24,
  glassIntense: 26,
  subtle: 12,
};

export const shadows = {
  card: {
    shadowColor: colors.shadowMedium,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  playButton: {
    shadowColor: colors.primaryBlue,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 32,
    elevation: 24,
  },
  playButtonGlow: {
    shadowColor: colors.accentBlue,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
  },
};

export const typography = {
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500' as const,
  },
  body: {
    fontSize: 14,
    fontWeight: '400' as const,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
  },
};

export const animation = {
  duration: {
    fast: 150,
    normal: 300,
    slow: 500,
  },
  spring: {
    damping: 15,
    stiffness: 150,
    mass: 1,
  },
};

// Touch target minimum size (accessibility)
export const touchTargetMinSize = 44;

// Waveform configuration
export const waveform = {
  barCount: 40,
  barWidth: 3,
  barGap: 2,
  minHeight: 4,
  maxHeight: 40,
};

export default {
  colors,
  gradients,
  spacing,
  radii,
  blur,
  shadows,
  typography,
  animation,
  touchTargetMinSize,
  waveform,
};
