// Design tokens (light + dark), simple exported object for components to import
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const radii = {
  small: 8,
  normal: 14,
  round: 999,
  pill: 24,
};

export const sizes = {
  fabMini: 56,
  fabLarge: 60,
  touchTarget: 44,
};

export const elevation = {
  low: {
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 6,
  },
  high: {
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 12,
  },
};

// Glass/Blur design tokens
export const glass = {
  bgLight: 'rgba(255, 255, 255, 0.75)',
  bgDark: 'rgba(25, 25, 25, 0.75)',
  borderLight: 'rgba(255, 255, 255, 0.2)',
  borderDark: 'rgba(255, 255, 255, 0.1)',
  intensityIOS: 80,
  intensityAndroid: 40,
  pillHeight: 50,
  miniPlayerHeight: 72,
};

export const light = {
  colors: {
    primary: '#2F6DFD',
    accent: '#FFD166',
    surface: '#FFFFFF',
    surfaceAlt: '#F6F7FB',
    text: '#0F172A',
    textSecondary: '#55617A',
    muted: '#55617A',
    border: '#E6EAF2',
    background: '#F6F7FB',
  },
};

export const dark = {
  colors: {
    primary: '#2F6DFD',
    accent: '#FFD166',
    surface: '#0B0F1A',
    surfaceAlt: '#0F1722',
    text: '#E6EEF8',
    textSecondary: '#9AA7BF',
    muted: '#9AA7BF',
    border: 'rgba(255,255,255,0.06)',
    background: '#000000',
  },
};

export const tokens = { spacing, radii, sizes, elevation, glass, light, dark };

// Helper to get colors based on color scheme
export function getColors(isDark: boolean) {
  return isDark ? dark.colors : light.colors;
}
