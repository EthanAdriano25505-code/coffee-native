import { StyleSheet } from 'react-native';
import { tokens } from '../theme/designTokens';

const createStyles = (colors: any) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: tokens.spacing.md,
    alignItems: 'center',
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: tokens.spacing.lg,
  },
  profileImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    marginBottom: tokens.spacing.md,
  },
  imagePicker: {
    backgroundColor: colors.primary,
    paddingVertical: tokens.spacing.sm,
    paddingHorizontal: tokens.spacing.md,
    borderRadius: tokens.radii.round,
  },
  imagePickerText: {
    color: colors.textOnPrimary,
    // ...tokens.typography.button, // typography is not in tokens
  },
  infoSection: {
    width: '100%',
    marginBottom: tokens.spacing.lg,
  },
  label: {
    // ...tokens.typography.label, // typography is not in tokens
    color: colors.textSecondary,
    marginBottom: tokens.spacing.sm,
  },
  input: {
    // ...tokens.typography.body, // typography is not in tokens
    backgroundColor: colors.inputBackground,
    borderRadius: tokens.radii.normal,
    padding: tokens.spacing.md,
    color: colors.textPrimary,
    marginBottom: tokens.spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bioInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: tokens.spacing.lg,
    backgroundColor: colors.surface,
    padding: tokens.spacing.md,
    borderRadius: tokens.radii.normal,
  },
  statText: {
    // ...tokens.typography.body, // typography is not in tokens
    color: colors.textPrimary,
  },
  settingsSection: {
    width: '100%',
  },
  button: {
    backgroundColor: colors.primary,
    padding: tokens.spacing.md,
    borderRadius: tokens.radii.round,
    alignItems: 'center',
    marginBottom: tokens.spacing.md,
    // ...tokens.shadows.card, // shadows is not in tokens
  },
  buttonText: {
    // ...tokens.typography.button, // typography is not in tokens
    color: colors.textOnPrimary,
  },
  darkModeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: tokens.spacing.md,
    backgroundColor: colors.surface,
    borderRadius: tokens.radii.normal,
    marginBottom: tokens.spacing.md,
  },
  darkModeText: {
    // ...tokens.typography.body, // typography is not in tokens
    color: colors.textPrimary,
  },
  logoutButton: {
    backgroundColor: colors.error,
  },
});

export default createStyles;
