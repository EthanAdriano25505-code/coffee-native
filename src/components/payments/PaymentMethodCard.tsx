import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { getColors, spacing } from '../../theme/designTokens';

export function PaymentMethodCard(props: {
  selected: boolean;
  onPress: () => void;
  label: string;
  description?: string;
}) {
  const colors = getColors(true);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: props.selected }}
      accessibilityLabel={props.label}
      onPress={props.onPress}
      style={{ marginTop: spacing.sm }}
    >
      <BlurView intensity={50} tint="dark" style={[styles.blur, { borderColor: props.selected ? 'rgba(47,128,237,0.55)' : 'rgba(255,255,255,0.08)' }]}
      >
        <LinearGradient
          colors={props.selected ? ['rgba(47,128,237,0.22)', 'rgba(10,161,255,0.10)'] : ['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.03)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.content}
        >
          <View style={styles.left}>
            <View style={[styles.icon, { backgroundColor: props.selected ? 'rgba(47,128,237,0.22)' : 'rgba(255,255,255,0.08)' }]}>
              <Feather name="credit-card" size={16} color={colors.text} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: colors.text }]}>{props.label}</Text>
              {props.description ? (
                <Text style={[styles.sub, { color: colors.muted }]}>{props.description}</Text>
              ) : null}
            </View>
          </View>
          <Feather name={props.selected ? 'check-circle' : 'circle'} size={18} color={props.selected ? '#2F80ED' : colors.muted} />
        </LinearGradient>
      </BlurView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  blur: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
  },
  content: {
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  left: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: spacing.sm },
  icon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontWeight: '800', fontSize: 15 },
  sub: { marginTop: 2, fontSize: 12, fontWeight: '600', opacity: 0.85 },
});
