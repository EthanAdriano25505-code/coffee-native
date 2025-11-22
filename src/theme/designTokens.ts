export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };
export const radii = { small: 8, normal: 12, medium: 16, round: 9999 };
export const sizes = { touchTarget: 48, fabMini: 40 };
export const glass = { intensityIOS: 80, intensityAndroid: 50, miniPlayerHeight: 80 };

export const getColors = (isDark: boolean) => ({
  background: isDark ? '#000' : '#fff',
  surfaceAlt: isDark ? '#1A1A1A' : '#F5F5F5',
  text: isDark ? '#fff' : '#000',
  textSecondary: isDark ? '#999' : '#666',
  muted: isDark ? '#666' : '#999',
  border: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
  primary: '#2f6dfd',
  accent: '#fff',
});
