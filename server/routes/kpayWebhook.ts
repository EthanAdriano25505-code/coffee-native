import { Router, type Request, type Response } from 'express';
import { kpayService } from '../services/kpay';
import type { KPayWebhookPayload, PaymentStatus } from '../../src/payments/types';

const r = Router();

// Webhooks often require the raw body for signature verification.
// TODO: In production, use a raw-body middleware and verify signature using KPAY_WEBHOOK_SECRET.
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isFinalStatus(value: unknown): value is Extract<PaymentStatus, 'Succeeded' | 'Failed' | 'Cancelled'> {
  return value === 'Succeeded' || value === 'Failed' || value === 'Cancelled';
}

function parseWebhookPayload(body: unknown): KPayWebhookPayload {
  if (!isRecord(body)) {
    throw new Error('INVALID_BODY');
  }

  const intentId = body.intentId;
  const status = body.status;

  if (typeof intentId !== 'string' || !isFinalStatus(status)) {
    throw new Error('VALIDATION_ERROR');
  }

  const eventId = typeof body.eventId === 'string' ? body.eventId : undefined;
  const occurredAt = typeof body.occurredAt === 'string' ? body.occurredAt : undefined;

  return {
    intentId,
    status,
    eventId,
    occurredAt,
  };
}

r.post('/', async (req: Request, res: Response) => {
  try {
    const signatureHeader = req.header('x-kpay-signature') ?? undefined;
    const rawBody = JSON.stringify(req.body ?? {});

    // NOTE: payload shape is still TBD. This is a stub.
    const payload = parseWebhookPayload(req.body as unknown);

    const intent = await kpayService.applyWebhook({
      signatureHeader,
      rawBody,
      payload,
    });

    return res.json({ ok: true, intent });
  } catch (e) {
    return res.status(400).json({ ok: false, error: (e as Error).message });
  }
});

export default r;
