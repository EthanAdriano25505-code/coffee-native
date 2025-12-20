import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  useColorScheme,
} from 'react-native';
import GlassView from './GlassView';
import { spacing, radii, getColors } from '../theme/designTokens';

type PillItem = {
  id: string;
  label: string;
};

type CenterMiniPillProps = {
  items: PillItem[];
  activeId: string;
  onSelect: (id: string) => void;
  style?: any;
};

/**
 * CenterMiniPill: Horizontal pill filter bar with glass backgrounds
 * 
 * Renders a horizontal scrollable list of pill-shaped buttons with
 * rounded corners and glass background effects.
 */
const CenterMiniPill: React.FC<CenterMiniPillProps> = ({
  items,
  activeId,
  onSelect,
  style,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = getColors(isDark);

  return (
    <View style={[styles.container, style]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {items.map((item) => {
          const isActive = item.id === activeId;
          return (
            <TouchableOpacity
              key={item.id}
              onPress={() => onSelect(item.id)}
              activeOpacity={0.7}
            >
              <GlassView
                intensity={isActive ? 60 : 40}
                tint={isDark ? 'dark' : 'light'}
                style={[
                  styles.pill,
                  isActive && styles.pillActive,
                  {
                    backgroundColor: isActive
                      ? isDark
                        ? 'rgba(47, 109, 253, 0.25)'
                        : 'rgba(47, 109, 253, 0.15)'
                      : isDark
                      ? 'rgba(255, 255, 255, 0.08)'
                      : 'rgba(0, 0, 0, 0.05)',
                    borderColor: isActive
                      ? isDark
                        ? 'rgba(47, 109, 253, 0.4)'
                        : 'rgba(47, 109, 253, 0.3)'
                      : isDark
                      ? 'rgba(255, 255, 255, 0.1)'
                      : 'rgba(0, 0, 0, 0.08)',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.pillText,
                    {
                      color: isActive ? colors.primary : colors.text,
                    },
                    isActive && styles.pillTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </GlassView>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 50,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  pill: {
    paddingHorizontal: spacing.md + spacing.xs,
    paddingVertical: spacing.sm + 2,
    borderRadius: radii.round,
    borderWidth: 1,
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
    // Subtle shadow for depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  pillActive: {
    // Enhanced shadow for active state
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  pillText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  pillTextActive: {
    fontWeight: '700',
  },
});

export default CenterMiniPill;
