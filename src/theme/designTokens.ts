// src/theme/designTokens.ts

/**
 * Spacing scale for consistent layout
 */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

/**
 * Border radius values
 */
export const radii = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  round: 9999,
} as const;

/**
 * Size constants for common UI elements
 */
export const sizes = {
  touchTarget: 44,
  fabMini: 40,
  fabRegular: 56,
  fabLarge: 64,
  iconSmall: 16,
  iconMedium: 24,
  iconLarge: 32,
  avatarSmall: 32,
  avatarMedium: 48,
  avatarLarge: 64,
} as const;

/**
 * Color palette
 */
type ColorPalette = {
  background: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  text: string;
  textSecondary: string;
  primary: string;
  primaryDark: string;
  primaryLight: string;
  secondary: string;
  accent: string;
  success: string;
  warning: string;
  error: string;
  muted: string;
};

/**
 * Get color palette based on theme mode
 */
export function getColors(isDark: boolean): ColorPalette {
  if (isDark) {
    return {
      background: '#000000',
      surface: '#1C1C1E',
      surfaceAlt: '#2C2C2E',
      border: '#3A3A3C',
      text: '#FFFFFF',
      textSecondary: '#8E8E93',
      primary: '#0A84FF',
      primaryDark: '#0066CC',
      primaryLight: '#409CFF',
      secondary: '#5E5CE6',
      accent: '#FF9F0A',
      success: '#32D74B',
      warning: '#FF9F0A',
      error: '#FF453A',
      muted: '#636366',
    };
  }

  return {
    background: '#FFFFFF',
    surface: '#F2F2F7',
    surfaceAlt: '#E5E5EA',
    border: '#C6C6C8',
    text: '#000000',
    textSecondary: '#6C6C70',
    primary: '#007AFF',
    primaryDark: '#0051D5',
    primaryLight: '#409CFF',
    secondary: '#5856D6',
    accent: '#FF9500',
    success: '#34C759',
    warning: '#FF9500',
    error: '#FF3B30',
    muted: '#8E8E93',
  };
}

/**
 * Glass effect constants
 */
export const glass = {
  lightIntensity: 20,
  mediumIntensity: 50,
  heavyIntensity: 80,
  defaultIntensity: 50,
  tintLight: 'light' as const,
  tintDark: 'dark' as const,
  tintDefault: 'default' as const,
} as const;
