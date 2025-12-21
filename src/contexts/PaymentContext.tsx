import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { kpayClient, toPaymentError } from '../payments/kpayClient';
import type { KPayInitPayload, PaymentIntent, PaymentReceipt, PaymentStatus } from '../payments/types';

export type PaymentStage =
  | { kind: 'Idle' }
  | { kind: 'Initiated'; intent: PaymentIntent }
  | { kind: 'PendingConfirmation'; intent: PaymentIntent; init: KPayInitPayload }
  | { kind: 'Succeeded'; intent: PaymentIntent; receipt?: PaymentReceipt }
  | { kind: 'Failed'; intent: PaymentIntent; errorMessage: string }
  | { kind: 'Cancelled'; intent: PaymentIntent };

export type PaymentActions = {
  createIntent(params: { amount: number; description?: string; metadata?: Record<string, string> }): Promise<void>;
  initiate(): Promise<void>;
  startPolling(): Promise<void>;
  cancel(): Promise<void>;
  reset(): void;
};

type PaymentContextValue = {
  stage: PaymentStage;
  isBusy: boolean;
  lastStatus?: PaymentStatus;
  actions: PaymentActions;
};

const PaymentContext = createContext<PaymentContextValue | null>(null);

export function PaymentProvider({ children }: { children: React.ReactNode }) {
  const [stage, setStage] = useState<PaymentStage>({ kind: 'Idle' });
  const [isBusy, setIsBusy] = useState<boolean>(false);
  const [lastStatus, setLastStatus] = useState<PaymentStatus | undefined>(undefined);

  const pollAbortRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    pollAbortRef.current?.abort();
    pollAbortRef.current = null;
    setIsBusy(false);
    setLastStatus(undefined);
    setStage({ kind: 'Idle' });
  }, []);

  const createIntent: PaymentActions['createIntent'] = useCallback(async (params) => {
    setIsBusy(true);
    try {
      const intent = await kpayClient.createIntent({
        amount: params.amount,
        currency: 'MMK',
        description: params.description,
        metadata: params.metadata,
      });
      setStage({ kind: 'Initiated', intent });
      setLastStatus(intent.status);
    } catch (e) {
      const pe = toPaymentError(e);
      setStage({ kind: 'Failed', intent: { id: 'unknown', amount: params.amount, currency: 'MMK', method: 'KPAY', status: 'Failed', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, errorMessage: pe.message });
      setLastStatus('Failed');
    } finally {
      setIsBusy(false);
    }
  }, []);

  const initiate: PaymentActions['initiate'] = useCallback(async () => {
    if (stage.kind !== 'Initiated') return;

    setIsBusy(true);
    try {
      const init = await kpayClient.initiate({ intentId: stage.intent.id });
      setStage({ kind: 'PendingConfirmation', intent: stage.intent, init });
      setLastStatus('PendingConfirmation');
    } catch (e) {
      const pe = toPaymentError(e);
      setStage({ kind: 'Failed', intent: stage.intent, errorMessage: pe.message });
      setLastStatus('Failed');
    } finally {
      setIsBusy(false);
    }
  }, [stage]);

  const startPolling: PaymentActions['startPolling'] = useCallback(async () => {
    if (stage.kind !== 'PendingConfirmation') return;

    pollAbortRef.current?.abort();
    const ac = new AbortController();
    pollAbortRef.current = ac;

    setIsBusy(true);
    try {
      const result = await kpayClient.pollStatus({
        intentId: stage.intent.id,
        signal: ac.signal,
        maxMs: 60_000,
        initialIntervalMs: 3000,
        maxIntervalMs: 4000,
      });

      setLastStatus(result.status);
      switch (result.status) {
        case 'Succeeded':
          setStage({ kind: 'Succeeded', intent: stage.intent, receipt: result.receipt });
          return;
        case 'Failed':
          setStage({ kind: 'Failed', intent: stage.intent, errorMessage: 'Payment failed.' });
          return;
        case 'Cancelled':
          setStage({ kind: 'Cancelled', intent: stage.intent });
          return;
        case 'Idle':
        case 'Initiated':
        case 'PendingConfirmation':
          setStage({ kind: 'Failed', intent: stage.intent, errorMessage: 'Unexpected payment status.' });
          return;
        default: {
          const _exhaustive: never = result.status;
          throw _exhaustive;
        }
      }
    } catch (e) {
      const pe = toPaymentError(e);
      if (pe.code === 'CANCELLED') {
        setStage({ kind: 'Cancelled', intent: stage.intent });
        setLastStatus('Cancelled');
      } else {
        setStage({ kind: 'Failed', intent: stage.intent, errorMessage: pe.message });
        setLastStatus('Failed');
      }
    } finally {
      setIsBusy(false);
    }
  }, [stage]);

  const cancel: PaymentActions['cancel'] = useCallback(async () => {
    if (stage.kind !== 'Initiated' && stage.kind !== 'PendingConfirmation') return;

    pollAbortRef.current?.abort();
    pollAbortRef.current = null;

    setIsBusy(true);
    try {
      const updated = await kpayClient.cancel({ intentId: stage.intent.id });
      setStage({ kind: 'Cancelled', intent: updated });
      setLastStatus(updated.status);
    } catch (e) {
      const pe = toPaymentError(e);
      setStage({ kind: 'Failed', intent: stage.intent, errorMessage: pe.message });
      setLastStatus('Failed');
    } finally {
      setIsBusy(false);
    }
  }, [stage]);

  const value = useMemo<PaymentContextValue>(
    () => ({
      stage,
      isBusy,
      lastStatus,
      actions: { createIntent, initiate, startPolling, cancel, reset },
    }),
    [stage, isBusy, lastStatus, createIntent, initiate, startPolling, cancel, reset]
  );

  return <PaymentContext.Provider value={value}>{children}</PaymentContext.Provider>;
}

export function usePayment(): PaymentContextValue {
  const ctx = useContext(PaymentContext);
  if (!ctx) {
    throw new Error('usePayment must be used within PaymentProvider');
  }
  return ctx;
}
