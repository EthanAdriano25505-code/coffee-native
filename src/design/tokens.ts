// Centralized design tokens for the player UI
export const colors = {
  primaryBlue: '#2F80ED',
  accentBlue: '#0AA1FF',
  bgTop: '#FFFFFF',
  bgMid: '#E9F7FF',
  bgBottom: '#D0ECFF',
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  glassBorder: 'rgba(255,255,255,0.12)',
  glassHighlight: 'rgba(255,255,255,0.08)',
};

export const radii = {
  card24: 24,
  card28: 28,
  round: 999,
};

export const spacing = {
  x4: 4,
  x8: 8,
  x12: 12,
  x16: 16,
  x20: 20,
  x24: 24,
};

export const shadows = {
  card: {
    shadowColor: colors.primaryBlue,
    shadowOpacity: 0.15,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  primaryButton: {
    shadowColor: colors.primaryBlue,
    shadowOpacity: 0.4,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
};

export const typography = {
  title: { fontSize: 22, fontWeight: '700' as const, color: colors.textPrimary },
  artist: { fontSize: 14, fontWeight: '500' as const, color: colors.textSecondary },
  time: { fontSize: 12, fontWeight: '500' as const, color: colors.textSecondary },
};
