import { KPAY_ENABLED, KPAY_SERVER_BASE_URL, PAYMENT_CURRENCY, PAYMENT_TESTMODE } from '../config/featureFlags';
import type { PaymentProvider } from './PaymentProvider';
import {
  PaymentError,
  type CreateIntentParams,
  type KPayInitPayload,
  type KPayWebhookPayload,
  type PaymentIntent,
  type PaymentReceipt,
  type PaymentStatus,
  type PollStatusParams,
  type RefundParams,
} from './types';

type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

type KPayClientConfig = {
  enabled: boolean;
  testMode: boolean;
  baseUrl: string;
  fetchFn: FetchLike;
};

function kpNotConfigured(): never {
  // Requirement: clearly throw this if inadvertently called
  throw new Error('KPAY_API_NOT_CONFIGURED');
}

function asPaymentError(err: unknown): PaymentError {
  if (err instanceof PaymentError) return err;
  if (err instanceof Error && err.message === 'KPAY_API_NOT_CONFIGURED') {
    return new PaymentError({
      code: 'KPAY_API_NOT_CONFIGURED',
      message:
        'KPay API is not configured. This is scaffolding only. Replace stubs when official API is available.',
      cause: err,
    });
  }
  if (err instanceof DOMException && err.name === 'AbortError') {
    return new PaymentError({ code: 'CANCELLED', message: 'Request aborted.', cause: err });
  }
  return new PaymentError({ code: 'UNKNOWN', message: 'Unknown payment error.', cause: err });
}

function assertNever(_x: never): never {
  throw new Error('UNREACHABLE');
}

async function sleepAbortable(ms: number, signal?: AbortSignal): Promise<void> {
  if (ms <= 0) return;
  if (signal?.aborted) {
    throw new PaymentError({ code: 'CANCELLED', message: 'Aborted.' });
  }

  await new Promise<void>((resolve, reject) => {
    const id = setTimeout(() => resolve(), ms);
    const onAbort = () => {
      clearTimeout(id);
      reject(new PaymentError({ code: 'CANCELLED', message: 'Aborted.' }));
    };
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

function jitter(ms: number): number {
  const factor = 0.15;
  const delta = ms * factor;
  return Math.max(0, Math.round(ms + (Math.random() * 2 - 1) * delta));
}

function nextBackoff(current: number, max: number): number {
  const next = Math.round(current * 1.35);
  return Math.min(next, max);
}

async function httpJson<T>(params: {
  fetchFn: FetchLike;
  url: string;
  method: 'GET' | 'POST';
  body?: unknown;
  signal?: AbortSignal;
}): Promise<T> {
  const { fetchFn, url, method, body, signal } = params;

  let res: Response;
  try {
    res = await fetchFn(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (e) {
    throw new PaymentError({ code: 'NETWORK', message: 'Network request failed.', cause: e });
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new PaymentError({
      code: 'NETWORK',
      message: `Server responded with ${res.status}. ${text}`.trim(),
    });
  }

  try {
    return (await res.json()) as T;
  } catch (e) {
    throw new PaymentError({ code: 'NETWORK', message: 'Invalid JSON response.', cause: e });
  }
}

/**
 * Factory to make unit-testing easy.
 *
 * TODO (real integration): replace these endpoints and shapes to match the official KPay API.
 */
export function createKPayClient(config: KPayClientConfig): PaymentProvider {
  const intents = new Map<string, PaymentIntent>();

  const base = config.baseUrl.replace(/\/$/, '');

  return {
    async createIntent(params: CreateIntentParams): Promise<PaymentIntent> {
      if (!config.enabled) kpNotConfigured();

      if (params.amount <= 0 || !Number.isFinite(params.amount)) {
        throw new PaymentError({ code: 'VALIDATION', message: 'Amount must be positive.' });
      }

      // In test mode we can run fully client-side without needing the server.
      if (config.testMode) {
        const now = new Date().toISOString();
        const intent: PaymentIntent = {
          id: `intent_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          amount: params.amount,
          currency: params.currency,
          method: 'KPAY',
          status: 'Initiated',
          createdAt: now,
          updatedAt: now,
          description: params.description,
          metadata: params.metadata,
        };
        intents.set(intent.id, intent);
        return intent;
      }

      // TODO: call backend stub endpoint.
      return await httpJson<PaymentIntent>({
        fetchFn: config.fetchFn,
        url: `${base}/api/payments/kpay/intent`,
        method: 'POST',
        body: {
          amount: params.amount,
          currency: params.currency,
          description: params.description,
          metadata: params.metadata,
        },
      });
    },

    async initiate({ intentId }): Promise<KPayInitPayload> {
      if (!config.enabled) kpNotConfigured();

      if (config.testMode) {
        const intent = intents.get(intentId);
        if (!intent) {
          throw new PaymentError({ code: 'VALIDATION', message: 'Unknown intentId.' });
        }
        intent.status = 'PendingConfirmation';
        intent.updatedAt = new Date().toISOString();
        intents.set(intent.id, intent);
        return {
          intentId: intent.id,
          amount: intent.amount,
          currency: intent.currency,
          // Placeholder values — replace once official API is known
          deepLinkUrl: `kpay://pay?intentId=${encodeURIComponent(intent.id)}`,
          qrPayload: `KPAY_QR_${intent.id}_${intent.amount}`,
          expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        };
      }

      // TODO: call backend stub endpoint.
      return await httpJson<KPayInitPayload>({
        fetchFn: config.fetchFn,
        url: `${base}/api/payments/kpay/initiate`,
        method: 'POST',
        body: { intentId },
      });
    },

    async pollStatus(params: PollStatusParams): Promise<{ status: PaymentStatus; receipt?: PaymentReceipt }> {
      if (!config.enabled) kpNotConfigured();

      const maxMs = params.maxMs ?? 60_000;
      let interval = params.initialIntervalMs ?? 3000;
      const maxInterval = params.maxIntervalMs ?? 4000;
      const start = Date.now();

      while (Date.now() - start < maxMs) {
        if (params.signal?.aborted) {
          throw new PaymentError({ code: 'CANCELLED', message: 'Polling aborted.' });
        }

        let status: PaymentStatus;
        let receipt: PaymentReceipt | undefined;

        if (config.testMode) {
          const intent = intents.get(params.intentId);
          if (!intent) {
            throw new PaymentError({ code: 'VALIDATION', message: 'Unknown intentId.' });
          }

          // Deterministic-ish: succeed after ~3 polls.
          if (intent.status === 'PendingConfirmation') {
            const createdMs = new Date(intent.createdAt).getTime();
            const age = Date.now() - createdMs;
            if (age > 10_000) {
              intent.status = 'Succeeded';
              intent.updatedAt = new Date().toISOString();
              intents.set(intent.id, intent);
            }
          }

          status = intent.status;
          if (status === 'Succeeded') {
            receipt = {
              intentId: intent.id,
              transactionId: `mock_tx_${intent.id}`,
              paidAt: new Date().toISOString(),
              amount: intent.amount,
              currency: intent.currency,
            };
          }
        } else {
          const res = await httpJson<{ intentId: string; status: PaymentStatus; receipt?: PaymentReceipt }>({
            fetchFn: config.fetchFn,
            url: `${base}/api/payments/kpay/status/${encodeURIComponent(params.intentId)}`,
            method: 'GET',
            signal: params.signal,
          });
          status = res.status;
          receipt = res.receipt;
        }

        switch (status) {
          case 'Idle':
          case 'Initiated':
          case 'PendingConfirmation':
            break;
          case 'Succeeded':
          case 'Failed':
          case 'Cancelled':
            return { status, receipt };
          default:
            assertNever(status);
        }

        await sleepAbortable(jitter(interval), params.signal);
        interval = nextBackoff(interval, maxInterval);
      }

      throw new PaymentError({ code: 'TIMEOUT', message: 'Payment polling timed out.' });
    },

    async cancel({ intentId }): Promise<PaymentIntent> {
      if (!config.enabled) kpNotConfigured();

      if (config.testMode) {
        const intent = intents.get(intentId);
        if (!intent) {
          throw new PaymentError({ code: 'VALIDATION', message: 'Unknown intentId.' });
        }
        intent.status = 'Cancelled';
        intent.updatedAt = new Date().toISOString();
        intents.set(intent.id, intent);
        return intent;
      }

      // TODO: implement cancel endpoint if/when required by KPay.
      throw new PaymentError({
        code: 'KPAY_API_NOT_CONFIGURED',
        message: 'Cancel is not implemented for backend mode yet.',
      });
    },

    async refund(_params: RefundParams): Promise<{ success: boolean }> {
      if (!config.enabled) kpNotConfigured();

      // TODO: call backend stub endpoint.
      // NOTE: refund logic typically must live on the backend only.
      if (config.testMode) return { success: true };

      throw new PaymentError({
        code: 'KPAY_API_NOT_CONFIGURED',
        message: 'Refund is not configured. Implement server-side refund when KPay API is known.',
      });
    },

    async parseWebhook(payload: KPayWebhookPayload): Promise<PaymentIntent> {
      if (!config.enabled) kpNotConfigured();

      // Client-side normalization only.
      // TODO: real webhook parsing/verification is server-side ONLY.
      if (!payload.intentId) {
        throw new PaymentError({ code: 'VALIDATION', message: 'Missing intentId.' });
      }

      const intent = intents.get(payload.intentId);
      if (!intent) {
        throw new PaymentError({ code: 'VALIDATION', message: 'Unknown intentId.' });
      }

      intent.status = payload.status;
      intent.updatedAt = new Date().toISOString();
      intents.set(intent.id, intent);
      return intent;
    },
  };
}

export const kpayClient: PaymentProvider = createKPayClient({
  enabled: KPAY_ENABLED,
  testMode: PAYMENT_TESTMODE,
  baseUrl: KPAY_SERVER_BASE_URL,
  fetchFn: (globalThis.fetch as FetchLike).bind(globalThis),
});

export function toPaymentError(err: unknown): PaymentError {
  return asPaymentError(err);
}
