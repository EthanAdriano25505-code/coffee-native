import type {
  CurrencyCode,
  KPayInitPayload,
  KPayWebhookPayload,
  PaymentIntent,
  PaymentReceipt,
  PaymentStatus,
  RefundParams,
} from '../../src/payments/types';
import {
  createIntent,
  getIntent,
  getStatusWithDeterministicAdvance,
  markInitiated,
  nowISO,
  setFinalStatus,
} from '../store/memory';

export type CreateIntentRequest = {
  amount: number;
  currency: CurrencyCode;
  description?: string;
  metadata?: Record<string, string>;
};

export type InitiateRequest = { intentId: string };

export type StatusResponse = { intentId: string; status: PaymentStatus; receipt?: PaymentReceipt };

/**
 * KPay service stub.
 *
 * IMPORTANT:
 * - This file is intentionally a mock implementation.
 * - When real KPay API details arrive, replace the TODO sections and keep method signatures stable.
 */
export const kpayService = {
  async createIntent(req: CreateIntentRequest): Promise<PaymentIntent> {
    // TODO: Replace with real KPay intent creation using KPAY_API_BASE_URL, KPAY_API_KEY, etc.
    if (!Number.isFinite(req.amount) || req.amount <= 0) {
      throw new Error('INVALID_AMOUNT');
    }

    const stored = createIntent({
      amount: req.amount,
      currency: req.currency,
      description: req.description,
      metadata: req.metadata,
    });

    return stored.intent;
  },

  async initiate(req: InitiateRequest): Promise<KPayInitPayload> {
    // TODO: Replace with a real "initiate" request to KPay and return a deep link URL / QR payload.
    const stored = markInitiated(req.intentId);

    return {
      intentId: stored.intent.id,
      amount: stored.intent.amount,
      currency: stored.intent.currency,
      deepLinkUrl: `kpay://pay?intentId=${encodeURIComponent(stored.intent.id)}`,
      qrPayload: `KPAY_QR_${stored.intent.id}_${stored.intent.amount}`,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    };
  },

  async refund(_req: RefundParams): Promise<{ success: boolean }> {
    // TODO: Refunds must be implemented server-side once official API is known.
    // For now, return controlled mock response.
    return { success: true };
  },

  async getStatus(intentId: string): Promise<StatusResponse> {
    const { status, receipt } = getStatusWithDeterministicAdvance(intentId);
    return { intentId, status, receipt };
  },

  async applyWebhook(params: {
    signatureHeader?: string;
    rawBody: string;
    payload: KPayWebhookPayload;
  }): Promise<PaymentIntent> {
    // TODO: Verify signatureHeader using KPAY_WEBHOOK_SECRET and rawBody (HMAC, timestamp, replay protection).
    // This mock implementation accepts the payload and updates the in-memory store.

    const intentId = params.payload.intentId;
    const stored = getIntent(intentId);
    if (!stored) throw new Error('UNKNOWN_INTENT');

    // Normalize status: allow only final statuses.
    const status = params.payload.status;
    if (status !== 'Succeeded' && status !== 'Failed' && status !== 'Cancelled') {
      throw new Error('INVALID_WEBHOOK_STATUS');
    }

    setFinalStatus({ intentId, status });

    // Update timestamps to reflect webhook occurrence.
    const updated = getIntent(intentId);
    if (!updated) throw new Error('UNKNOWN_INTENT');
    updated.intent.updatedAt = nowISO();

    return updated.intent;
  },
};
