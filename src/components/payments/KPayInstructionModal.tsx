import React, { useMemo } from 'react';
import { Linking, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { spacing } from '../../theme/designTokens';
import { t } from '../../i18n/t';

export function KPayInstructionModal(props: {
  visible: boolean;
  onClose: () => void;
  deepLinkUrl?: string;
  qrPayload?: string;
}) {
  const canOpenLink = useMemo(() => Boolean(props.deepLinkUrl), [props.deepLinkUrl]);

  return (
    <Modal
      visible={props.visible}
      onRequestClose={props.onClose}
      animationType="slide"
      transparent
      presentationStyle="overFullScreen"
    >
      <Pressable style={styles.backdrop} onPress={props.onClose} accessibilityRole="button" accessibilityLabel={t('common.close')}>
        <View style={styles.sheetWrap}>
          <Pressable onPress={() => {}} style={{ width: '100%' }}>
            <BlurView intensity={70} tint="dark" style={styles.sheet}>
              <LinearGradient
                colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.03)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.sheetInner}
              >
                <View style={styles.header}>
                  <Text style={styles.title}>{t('payments.kpay.title')}</Text>
                  <Pressable onPress={props.onClose} accessibilityRole="button" accessibilityLabel={t('common.close')} style={styles.close}>
                    <Feather name="x" size={18} color="#fff" />
                  </Pressable>
                </View>

                <Text style={styles.step}>{t('payments.kpay.steps.openApp')}</Text>
                <Text style={styles.step}>{t('payments.kpay.steps.scan')}</Text>
                <Text style={styles.step}>{t('payments.kpay.steps.confirm')}</Text>

                {props.qrPayload ? (
                  <View style={styles.box} accessible accessibilityLabel="KPay QR payload">
                    <Text style={styles.boxTitle}>QR Payload (mock)</Text>
                    <Text style={styles.boxText} numberOfLines={2}>
                      {props.qrPayload}
                    </Text>
                  </View>
                ) : null}

                {props.deepLinkUrl ? (
                  <Pressable
                    onPress={async () => {
                      if (!props.deepLinkUrl) return;
                      // Best-effort: do not crash if cannot open.
                      try {
                        const supported = await Linking.canOpenURL(props.deepLinkUrl);
                        if (supported) await Linking.openURL(props.deepLinkUrl);
                      } catch {
                        // ignore
                      }
                    }}
                    disabled={!canOpenLink}
                    accessibilityRole="button"
                    accessibilityLabel={t('payments.kpay.cta.openApp')}
                    style={({ pressed }) => [styles.openBtn, { opacity: pressed ? 0.85 : 1 }]}
                  >
                    <Text style={styles.openBtnText}>{t('payments.kpay.cta.openApp')}</Text>
                    <Feather name="external-link" size={16} color="#fff" />
                  </Pressable>
                ) : null}
              </LinearGradient>
            </BlurView>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheetWrap: { width: '100%', padding: spacing.md },
  sheet: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  sheetInner: { padding: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  title: { color: '#fff', fontWeight: '900', fontSize: 18 },
  close: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  step: { color: 'rgba(255,255,255,0.86)', fontSize: 13, fontWeight: '700', marginTop: 6 },
  box: {
    marginTop: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    padding: spacing.sm,
  },
  boxTitle: { color: '#fff', fontWeight: '900', fontSize: 12, marginBottom: 4 },
  boxText: { color: 'rgba(255,255,255,0.85)', fontWeight: '700', fontSize: 12 },
  openBtn: {
    marginTop: spacing.md,
    backgroundColor: '#2F80ED',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  openBtnText: { color: '#fff', fontWeight: '900', fontSize: 14 },
});
