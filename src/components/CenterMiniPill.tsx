import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, useColorScheme } from 'react-native';
import GlassView from './GlassView';
import { spacing, radii, getColors } from '../theme/designTokens';

type PillItem = {
  id: string;
  label: string;
};

type Props = {
  items: PillItem[];
  onSelectItem?: (id: string) => void;
};

export default function CenterMiniPill({ items, onSelectItem }: Props) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = getColors(isDark);
  const [selectedId, setSelectedId] = useState(items[0]?.id || '');

  const handlePress = (id: string) => {
    setSelectedId(id);
    onSelectItem?.(id);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {items.map((item) => {
          const isSelected = item.id === selectedId;
          return (
            <TouchableOpacity
              key={item.id}
              onPress={() => handlePress(item.id)}
              activeOpacity={0.7}
            >
              {isSelected ? (
                <GlassView
                  intensity={isDark ? 60 : 80}
                  tint={isDark ? 'dark' : 'light'}
                  style={[styles.pill, styles.pillSelected]}
                >
                  <Text style={[styles.pillText, { color: colors.primary }]}>{item.label}</Text>
                </GlassView>
              ) : (
                <View style={[styles.pill, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
                  <Text style={[styles.pillText, { color: colors.textSecondary }]}>{item.label}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.sm,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.round,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillSelected: {
    borderWidth: 1,
    borderColor: 'rgba(47, 109, 253, 0.3)',
  },
  pillText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
