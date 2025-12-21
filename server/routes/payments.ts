import { Router, type Request, type Response } from 'express';
import { kpayService } from '../services/kpay';

type Json = Record<string, unknown>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getString(obj: Json, key: string): string | undefined {
  const v = obj[key];
  return typeof v === 'string' ? v : undefined;
}

function getNumber(obj: Json, key: string): number | undefined {
  const v = obj[key];
  return typeof v === 'number' ? v : undefined;
}

function parseMetadata(value: unknown): Record<string, string> | undefined {
  if (!isRecord(value)) return undefined;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(value)) {
    if (typeof v === 'string') out[k] = v;
  }
  return Object.keys(out).length ? out : undefined;
}

const r = Router();

r.post('/kpay/intent', async (req: Request, res: Response) => {
  try {
    const body: unknown = req.body;
    if (!isRecord(body)) {
      return res.status(400).json({ ok: false, error: 'INVALID_BODY' });
    }

    const amount = getNumber(body, 'amount');
    const currency = getString(body, 'currency');
    const description = getString(body, 'description');

    if (amount === undefined || currency !== 'MMK') {
      return res.status(400).json({ ok: false, error: 'VALIDATION_ERROR' });
    }

    const intent = await kpayService.createIntent({
      amount,
      currency: 'MMK',
      description,
      metadata: parseMetadata(body.metadata),
    });

    return res.json(intent);
  } catch (e) {
    return res.status(500).json({ ok: false, error: (e as Error).message });
  }
});

r.post('/kpay/initiate', async (req: Request, res: Response) => {
  try {
    const body: unknown = req.body;
    if (!isRecord(body)) {
      return res.status(400).json({ ok: false, error: 'INVALID_BODY' });
    }

    const intentId = getString(body, 'intentId');
    if (!intentId) {
      return res.status(400).json({ ok: false, error: 'VALIDATION_ERROR' });
    }

    const payload = await kpayService.initiate({ intentId });
    return res.json(payload);
  } catch (e) {
    return res.status(500).json({ ok: false, error: (e as Error).message });
  }
});

r.post('/kpay/refund', async (req: Request, res: Response) => {
  try {
    const body: unknown = req.body;
    if (!isRecord(body)) {
      return res.status(400).json({ ok: false, error: 'INVALID_BODY' });
    }

    const intentId = getString(body, 'intentId');
    const amount = getNumber(body, 'amount');
    const reason = getString(body, 'reason');

    if (!intentId) {
      return res.status(400).json({ ok: false, error: 'VALIDATION_ERROR' });
    }

    const result = await kpayService.refund({ intentId, amount, reason });
    return res.json(result);
  } catch (e) {
    return res.status(500).json({ ok: false, error: (e as Error).message });
  }
});

r.get('/kpay/status/:intentId', async (req: Request, res: Response) => {
  try {
    const intentId = req.params.intentId;
    const status = await kpayService.getStatus(intentId);
    return res.json(status);
  } catch (e) {
    const msg = (e as Error).message;
    const code = msg === 'UNKNOWN_INTENT' ? 404 : 500;
    return res.status(code).json({ ok: false, error: msg });
  }
});

export default r;
