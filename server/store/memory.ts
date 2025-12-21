import type { CurrencyCode, PaymentIntent, PaymentReceipt, PaymentStatus } from '../../src/payments/types';

export type StoredIntent = {
  intent: PaymentIntent;
  // internal deterministic state machine
  initiatedAtMs?: number;
  polls: number;
  finalStatus?: Exclude<PaymentStatus, 'Idle' | 'Initiated' | 'PendingConfirmation'>;
  receipt?: PaymentReceipt;
};

const store = new Map<string, StoredIntent>();

export function nowISO(): string {
  return new Date().toISOString();
}

export function createIntent(params: {
  amount: number;
  currency: CurrencyCode;
  description?: string;
  metadata?: Record<string, string>;
}): StoredIntent {
  const id = `intent_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const now = nowISO();
  const intent: PaymentIntent = {
    id,
    amount: params.amount,
    currency: params.currency,
    method: 'KPAY',
    status: 'Initiated',
    createdAt: now,
    updatedAt: now,
    description: params.description,
    metadata: params.metadata,
  };

  const stored: StoredIntent = { intent, polls: 0 };
  store.set(id, stored);
  return stored;
}

export function getIntent(intentId: string): StoredIntent | undefined {
  return store.get(intentId);
}

export function setFinalStatus(params: {
  intentId: string;
  status: Exclude<PaymentStatus, 'Idle' | 'Initiated' | 'PendingConfirmation'>;
}): StoredIntent {
  const stored = store.get(params.intentId);
  if (!stored) {
    throw new Error('UNKNOWN_INTENT');
  }

  stored.finalStatus = params.status;
  stored.intent.status = params.status;
  stored.intent.updatedAt = nowISO();

  if (params.status === 'Succeeded' && !stored.receipt) {
    stored.receipt = {
      intentId: stored.intent.id,
      transactionId: `mock_tx_${stored.intent.id}`,
      paidAt: nowISO(),
      amount: stored.intent.amount,
      currency: stored.intent.currency,
    };
  }

  store.set(params.intentId, stored);
  return stored;
}

export function markInitiated(intentId: string): StoredIntent {
  const stored = store.get(intentId);
  if (!stored) {
    throw new Error('UNKNOWN_INTENT');
  }

  stored.intent.status = 'PendingConfirmation';
  stored.intent.updatedAt = nowISO();
  stored.initiatedAtMs = Date.now();
  stored.polls = 0;
  store.set(intentId, stored);
  return stored;
}

export function getStatusWithDeterministicAdvance(intentId: string): {
  status: PaymentStatus;
  receipt?: PaymentReceipt;
} {
  const stored = store.get(intentId);
  if (!stored) {
    throw new Error('UNKNOWN_INTENT');
  }

  // If webhook already set a final status, keep it.
  if (stored.finalStatus) {
    return { status: stored.finalStatus, receipt: stored.receipt };
  }

  // Deterministic state machine:
  // - after initiate: PendingConfirmation
  // - after 3 polls and >= 8 seconds since initiation: Succeeded
  if (stored.intent.status === 'PendingConfirmation') {
    stored.polls += 1;

    const ageMs = stored.initiatedAtMs ? Date.now() - stored.initiatedAtMs : 0;
    if (stored.polls >= 3 && ageMs >= 8000) {
      setFinalStatus({ intentId, status: 'Succeeded' });
    } else {
      store.set(intentId, stored);
    }
  }

  return { status: store.get(intentId)!.intent.status, receipt: store.get(intentId)!.receipt };
}

export function resetStore(): void {
  store.clear();
}
