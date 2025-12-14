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
  large: 24,
  round: 999,
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
    shadowColor: '#2F80ED',
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
};

export const light = {
  colors: {
    primary: '#2F80ED',
    secondary: '#0AA1FF',
    surface: 'rgba(255, 255, 255, 0.7)',
    surfaceAlt: '#E9F7FF',
    text: '#0F172A',
    textSecondary: '#55617A',
    muted: '#9AA7BF',
    border: 'rgba(255, 255, 255, 0.5)',
    background: '#D0ECFF',
    palette: {
      accent: '#2F80ED',
      progress: '#0AA1FF',
      bgTop: '#FFFFFF',
      bgMid: '#E9F7FF',
      bgBottom: '#D0ECFF',
      glassBorder: 'rgba(255,255,255,0.2)',
    }
  },
};

export const dark = {
  colors: {
    primary: '#2F80ED',
    secondary: '#0AA1FF',
    surface: 'rgba(30, 41, 59, 0.7)',
    surfaceAlt: '#0F1722',
    text: '#E6EEF8',
    textSecondary: '#9AA7BF',
    muted: '#55617A',
    border: 'rgba(255,255,255,0.06)',
    background: '#000000',
    palette: {
      accent: '#2F80ED',
      progress: '#0AA1FF',
      bgTop: '#0F1722',
      bgMid: '#0B0F1A',
      bgBottom: '#000000',
      glassBorder: 'rgba(255,255,255,0.1)',
    }
  },
};

export const tokens = { spacing, radii, sizes, elevation, light, dark };

// Helper to get colors based on color scheme
export function getColors(isDark: boolean) {
  return isDark ? dark.colors : light.colors;
}
