export type CurrencyCode = 'MMK';

export type PaymentMethod = 'KPAY';

export type PaymentStatus =
  | 'Idle'
  | 'Initiated'
  | 'PendingConfirmation'
  | 'Succeeded'
  | 'Failed'
  | 'Cancelled';

export type PaymentErrorCode =
  | 'KPAY_API_NOT_CONFIGURED'
  | 'NETWORK'
  | 'TIMEOUT'
  | 'VALIDATION'
  | 'CANCELLED'
  | 'UNKNOWN';

export class PaymentError extends Error {
  public readonly code: PaymentErrorCode;
  public readonly cause?: unknown;

  constructor(params: { code: PaymentErrorCode; message: string; cause?: unknown }) {
    super(params.message);
    this.name = 'PaymentError';
    this.code = params.code;
    this.cause = params.cause;
  }
}

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: CurrencyCode;
  method: PaymentMethod;
  status: PaymentStatus;
  createdAt: string;
  updatedAt: string;
  description?: string;
  metadata?: Record<string, string>;
}

export interface KPayInitPayload {
  intentId: string;
  amount: number;
  currency: CurrencyCode;
  deepLinkUrl?: string;
  qrPayload?: string;
  expiresAt?: string;
}

export interface PaymentReceipt {
  intentId: string;
  transactionId: string;
  paidAt: string;
  amount: number;
  currency: CurrencyCode;
}

export interface KPayWebhookPayload {
  // Placeholder — real fields TBD
  intentId: string;
  status: Exclude<PaymentStatus, 'Idle' | 'Initiated'>;
  // Signature is server-verified only; client receives normalized payload
  signature?: string;
  eventId?: string;
  occurredAt?: string;
}

export interface CreateIntentParams {
  amount: number;
  currency: CurrencyCode;
  description?: string;
  metadata?: Record<string, string>;
}

export interface RefundParams {
  intentId: string;
  amount?: number;
  reason?: string;
}

export interface PollStatusParams {
  intentId: string;
  signal?: AbortSignal;
  maxMs?: number;
  initialIntervalMs?: number;
  maxIntervalMs?: number;
}

export interface InitiateParams {
  intentId: string;
}
