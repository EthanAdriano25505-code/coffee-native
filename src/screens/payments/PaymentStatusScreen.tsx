import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { usePayment } from '../../contexts/PaymentContext';
import { spacing } from '../../theme/designTokens';
import { t } from '../../i18n/t';

export default function PaymentStatusScreen({ navigation }: { navigation: { navigate: (name: string) => void; goBack: () => void } }) {
  const { stage, actions } = usePayment();

  const statusText = useMemo(() => {
    switch (stage.kind) {
      case 'Idle':
        return 'No payment in progress.';
      case 'Initiated':
        return `Created intent ${stage.intent.id}`;
      case 'PendingConfirmation':
        return 'Waiting for confirmation…';
      case 'Succeeded':
        return `Succeeded${stage.receipt ? ` (tx: ${stage.receipt.transactionId})` : ''}`;
      case 'Failed':
        return `Failed: ${stage.errorMessage}`;
      case 'Cancelled':
        return 'Cancelled.';
      default: {
        const _exhaustive: never = stage;
        throw new Error(`Unhandled payment stage: ${stage}`);
      }
    }
  }, [stage]);

  return (
    <LinearGradient colors={['#070B12', '#05070D']} style={styles.root}>
      <View style={styles.container}>
        <Text style={styles.title}>{t('payments.status.title')}</Text>
        <Text style={styles.body}>{statusText}</Text>

        <View style={{ height: spacing.lg }} />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('payments.status.tryAgain')}
          onPress={() => {
            actions.reset();
            navigation.navigate('Checkout');
          }}
          style={({ pressed }) => [styles.primaryBtn, { opacity: pressed ? 0.9 : 1 }]}
        >
          <Text style={styles.primaryBtnText}>{t('payments.status.tryAgain')}</Text>
        </Pressable>

        <View style={{ height: spacing.sm }} />

        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [styles.secondaryBtn, { opacity: pressed ? 0.9 : 1 }]}
        >
          <Text style={styles.secondaryBtnText}>{t('payments.status.back')}</Text>
        </Pressable>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  container: { flex: 1, padding: spacing.lg },
  title: { color: '#fff', fontWeight: '900', fontSize: 22, marginBottom: spacing.md },
  body: { color: 'rgba(255,255,255,0.85)', fontWeight: '700' },
  primaryBtn: { backgroundColor: '#2F80ED', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 14, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontWeight: '900' },
  secondaryBtn: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', backgroundColor: 'rgba(255,255,255,0.05)', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 14, alignItems: 'center' },
  secondaryBtnText: { color: '#fff', fontWeight: '900' },
});
