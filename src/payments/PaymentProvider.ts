import type {
  CreateIntentParams,
  InitiateParams,
  KPayInitPayload,
  KPayWebhookPayload,
  PaymentIntent,
  PaymentReceipt,
  PaymentStatus,
  PollStatusParams,
  RefundParams,
} from './types';

export interface PaymentProvider {
  createIntent(params: CreateIntentParams): Promise<PaymentIntent>;

  initiate(params: InitiateParams): Promise<KPayInitPayload>;

  pollStatus(params: PollStatusParams): Promise<{
    status: PaymentStatus;
    receipt?: PaymentReceipt;
  }>;

  cancel(params: { intentId: string }): Promise<PaymentIntent>;

  refund(params: RefundParams): Promise<{ success: boolean }>; // placeholder until API is known

  parseWebhook(payload: KPayWebhookPayload): Promise<PaymentIntent>; // client-side normalized parsing only
}
