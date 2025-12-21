import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { getColors, spacing } from '../../theme/designTokens';
import { t } from '../../i18n/t';

export function PayButton(props: {
  title: string;
  onPress: () => void | Promise<void>;
  loading?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
}) {
  const colors = getColors(true);
  const isDisabled = Boolean(props.disabled || props.loading);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={props.accessibilityLabel ?? props.title}
      onPress={props.onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.btn,
        {
          backgroundColor: colors.primary,
          opacity: isDisabled ? 0.55 : pressed ? 0.9 : 1,
        },
      ]}
    >
      <View style={styles.row}>
        <Text style={styles.text}>{props.loading ? t('common.loading') : props.title}</Text>
        {props.loading ? (
          <ActivityIndicator color="#fff" style={{ marginLeft: spacing.sm }} />
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  text: { color: '#fff', fontWeight: '800', fontSize: 16, letterSpacing: 0.2 },
});
