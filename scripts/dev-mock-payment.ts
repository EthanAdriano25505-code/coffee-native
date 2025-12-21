// Dev utility: end-to-end mocked flow against the local Express server.
// Usage: `npm run dev:mock-payment`

type Json = Record<string, unknown>;

type PaymentIntent = {
  id: string;
  amount: number;
  currency: 'MMK';
  status: string;
};

type InitPayload = {
  intentId: string;
  deepLinkUrl?: string;
  qrPayload?: string;
};

const BASE = process.env.APP_BASE_URL ?? 'http://localhost:3000';

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  }
  return (await res.json()) as T;
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  }
  return (await res.json()) as T;
}

async function main() {
  console.log('Creating intent…');
  const intent = await postJson<PaymentIntent>('/api/payments/kpay/intent', {
    amount: 1000,
    currency: 'MMK',
    description: 'dev mock payment',
  });
  console.log('Intent:', intent);

  console.log('Initiating…');
  const init = await postJson<InitPayload>('/api/payments/kpay/initiate', { intentId: intent.id });
  console.log('Initiate payload:', init);

  console.log('Polling status…');
  for (let i = 0; i < 6; i += 1) {
    const status = await getJson<Json>(`/api/payments/kpay/status/${encodeURIComponent(intent.id)}`);
    console.log('Status:', status);
    if (status.status === 'Succeeded' || status.status === 'Failed' || status.status === 'Cancelled') break;
    await new Promise((r) => setTimeout(r, 3000));
  }

  console.log('Simulating webhook (Succeeded)…');
  const webhook = await postJson<Json>('/api/payments/kpay/webhook', {
    intentId: intent.id,
    status: 'Succeeded',
    eventId: `evt_${Date.now()}`,
    occurredAt: new Date().toISOString(),
  });
  console.log('Webhook response:', webhook);

  const final = await getJson<Json>(`/api/payments/kpay/status/${encodeURIComponent(intent.id)}`);
  console.log('Final:', final);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
