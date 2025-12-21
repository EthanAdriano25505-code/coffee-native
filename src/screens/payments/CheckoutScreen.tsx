import React, { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { KPAY_ENABLED, PAYMENT_CURRENCY } from '../../config/featureFlags';
import { usePayment } from '../../contexts/PaymentContext';
import { KPayInstructionModal } from '../../components/payments/KPayInstructionModal';
import { PayButton } from '../../components/payments/PayButton';
import { PaymentMethodCard } from '../../components/payments/PaymentMethodCard';
import { getColors, spacing } from '../../theme/designTokens';
import { t } from '../../i18n/t';

export default function CheckoutScreen({ navigation }: { navigation: { navigate: (name: string, params?: unknown) => void; goBack: () => void } }) {
  const colors = getColors(true);
  const { stage, isBusy, actions } = usePayment();

  const [amountText, setAmountText] = useState('1000');
  const [selectedKPay, setSelectedKPay] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const amount = useMemo(() => {
    const n = Number(amountText);
    return Number.isFinite(n) ? n : 0;
  }, [amountText]);

  useEffect(() => {
    if (stage.kind === 'PendingConfirmation') {
      setShowModal(true);
      // Polling should not rely on timeouts; it is abortable.
      actions.startPolling().catch(() => {
        // state handles errors
      });
    }
  }, [stage.kind, actions]);

  if (!KPAY_ENABLED) {
    return (
      <View style={[styles.center, { backgroundColor: '#000' }]}>
        <Text style={{ color: '#fff', fontWeight: '800' }}>{t('payments.disabled')}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.9 : 1 }]}
        >
          <Text style={styles.backBtnText}>{t('payments.status.back')}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <LinearGradient colors={['#070B12', '#05070D']} style={styles.root}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.root}>
        <View style={styles.container}>
          <Text style={styles.title}>{t('payments.checkout.title')}</Text>

          <Text style={[styles.label, { color: colors.muted }]}>
            {t('payments.checkout.amountLabel')} ({PAYMENT_CURRENCY})
          </Text>
          <TextInput
            value={amountText}
            onChangeText={setAmountText}
            keyboardType="numeric"
            placeholder={t('payments.checkout.amountPlaceholder')}
            placeholderTextColor={'rgba(255,255,255,0.35)'}
            style={styles.input}
            accessibilityLabel={t('payments.checkout.amountLabel')}
          />

          <Text style={[styles.label, { color: colors.muted, marginTop: spacing.md }]}>
            {t('payments.checkout.methodLabel')}
          </Text>

          <PaymentMethodCard
            selected={selectedKPay}
            onPress={() => setSelectedKPay(true)}
            label="KPay (Myanmar)"
            description="Mock flow (QR/deep link + polling)"
          />

          <View style={{ height: spacing.lg }} />

          <PayButton
            title={t('payments.checkout.payCta')}
            loading={isBusy}
            disabled={!selectedKPay || amount <= 0}
            onPress={async () => {
              actions.reset();
              await actions.createIntent({ amount, description: 'KPay test payment' });
              await actions.initiate();
            }}
          />

          <View style={{ height: spacing.md }} />

          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.navigate('PaymentStatus')}
            style={({ pressed }) => [styles.secondaryBtn, { opacity: pressed ? 0.85 : 1 }]}
          >
            <Text style={styles.secondaryBtnText}>View status</Text>
          </Pressable>
        </View>

        <KPayInstructionModal
          visible={showModal}
          onClose={() => setShowModal(false)}
          deepLinkUrl={stage.kind === 'PendingConfirmation' ? stage.init.deepLinkUrl : undefined}
          qrPayload={stage.kind === 'PendingConfirmation' ? stage.init.qrPayload : undefined}
        />
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  container: { flex: 1, padding: spacing.lg },
  title: { color: '#fff', fontWeight: '900', fontSize: 22, letterSpacing: 0.2, marginBottom: spacing.md },
  label: { fontSize: 12, fontWeight: '800', letterSpacing: 0.3 },
  input: {
    marginTop: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#fff',
    fontWeight: '800',
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, gap: spacing.md },
  backBtn: { backgroundColor: '#2F80ED', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 14 },
  backBtnText: { color: '#fff', fontWeight: '900' },
  secondaryBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  secondaryBtnText: { color: '#fff', fontWeight: '900' },
});
