import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, useColorScheme } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { getColors, spacing } from '../theme/designTokens';

type Props = {
  title?: string;
  icon?: React.ComponentProps<typeof Feather>['name'];
};

export default function HeaderBack({ title, icon }: Props) {
  const navigation = useNavigation<any>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = getColors(isDark);

  const canGoBack = navigation?.canGoBack?.() ?? false;

  return (
    <View style={styles.header}>
      <View style={styles.left}>
        {canGoBack ? (
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} accessibilityLabel="Back">
            <Feather name="chevron-left" size={22} color={colors.text} />
          </TouchableOpacity>
        ) : icon ? (
          <Feather name={icon} size={20} color={colors.text} style={{ marginRight: spacing.sm }} />
        ) : null}

        {title ? <Text style={[styles.title, { color: colors.text }]}>{title}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  left: { flexDirection: 'row', alignItems: 'center' },
  backButton: { padding: 6, marginRight: spacing.sm },
  title: { fontSize: 20, fontWeight: '800' },
});
