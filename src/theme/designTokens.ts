// Design tokens (light + dark), simple exported object for components to import
// Premium Palette: "Midnight Glass"
// Focus: Deep blacks, subtle glass surfaces, and a vibrant primary accent.

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radii = {
  small: 8,
  normal: 16, // Slightly more rounded for modern feel
  large: 24,
  round: 999,
};

export const sizes = {
  fabMini: 56,
  fabLarge: 60,
  touchTarget: 44,
  headerHeight: 60,
};

export const elevation = {
  low: {
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  high: {
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 12 },
    elevation: 16,
  },
  glow: {
    shadowColor: '#1DB954',
    shadowOpacity: 0.5,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  }
};

// Shared Palette
const palette = {
  brand: {
    primary: '#1DB954', // Spotify-ish Green - Vibrant, energetic
    secondary: '#1ed760', // Lighter green for gradients/hovers
    tertiary: '#121212', // Deep background
  },
  neutral: {
    white: '#FFFFFF',
    black: '#000000',
    gray50: '#F9FAFB',
    gray100: '#F3F4F6',
    gray200: '#E5E7EB',
    gray300: '#D1D5DB',
    gray400: '#9CA3AF',
    gray500: '#6B7280',
    gray600: '#4B5563',
    gray700: '#374151',
    gray800: '#1F2937',
    gray900: '#111827',
    gray950: '#030712',
  },
  semantic: {
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
    info: '#3B82F6',
  }
};

export const light = {
  colors: {
    primary: palette.brand.primary,
    secondary: palette.brand.secondary,
    background: '#FFFFFF',
    surface: '#F3F4F6',
    surfaceHighlight: '#FFFFFF',
    text: '#111827',
    textSecondary: '#6B7280',
    textMuted: '#9CA3AF',
    border: '#E5E7EB',
    icon: '#374151',
    glass: 'rgba(255, 255, 255, 0.7)',
    glassBorder: 'rgba(255, 255, 255, 0.5)',
    surfaceAlt: '#FFFFFF',
    muted: '#9CA3AF',
  },
  gradients: {
    primary: [palette.brand.primary, palette.brand.secondary],
    surface: ['#FFFFFF', '#F9FAFB'],
    skeleton: ['#E5E7EB', '#F3F4F6', '#E5E7EB'],
  }
};

export const dark = {
  colors: {
    primary: palette.brand.primary,
    secondary: palette.brand.secondary,
    background: '#000000', // OLED Black
    surface: '#121212', // Material Dark
    surfaceHighlight: '#1E1E1E', // Slightly lighter
    text: '#FFFFFF',
    textSecondary: '#A1A1AA', // Zinc 400
    textMuted: '#52525B', // Zinc 600
    border: '#27272A', // Zinc 800
    icon: '#D4D4D8', // Zinc 300
    glass: 'rgba(20, 20, 20, 0.6)',
    glassBorder: 'rgba(255, 255, 255, 0.08)',
    surfaceAlt: '#18181B',
    muted: '#52525B',
  },
  gradients: {
    primary: [palette.brand.primary, '#15803d'], // Green to Dark Green
    surface: ['#121212', '#000000'],
    skeleton: ['#27272A', '#3F3F46', '#27272A'],
    fadeOverlay: ['transparent', 'rgba(0,0,0,0.8)', '#000000'],
  }
};

export const tokens = { spacing, radii, sizes, elevation, light, dark };

// Helper to get colors based on color scheme
export function getColors(isDark: boolean) {
  return isDark ? dark.colors : light.colors;
}

export function getGradients(isDark: boolean) {
  return isDark ? dark.gradients : light.gradients;
}
