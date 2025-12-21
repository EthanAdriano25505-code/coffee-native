const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

let supabase = null;
if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
}

const app = express();
app.use(bodyParser.json());
app.use(morgan('dev'));
app.use(cors());

app.post('/create-payment', (req, res) => {
  const { amount, userId } = req.body || {};
  const paymentId = `mock_${Date.now()}`;
  return res.json({
    paymentId,
    status: 'created',
    redirectUrl: `https://mock-kbz/pay/${paymentId}`,
    amount,
    userId,
  });
});

app.post('/confirm-payment', async (req, res) => {
  const { paymentId, success = true, userId } = req.body || {};

  // Optionally mark a subscription active in Supabase when userId provided
  if (success && userId && supabase) {
    try {
      await supabase.from('subscriptions').upsert({
        user_id: userId,
        status: 'active',
        started_at: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Supabase upsert failed', err);
    }
  }

  return res.json({ ok: true, paymentId, status: success ? 'paid' : 'failed' });
});

app.post('/webhook', async (req, res) => {
  console.log('webhook received', req.body);
  // For local testing, you could forward the webhook to your app here.
  res.status(200).send('ok');
});

const port = process.env.MOCK_KBZ_PORT || 4000;
app.listen(port, () => console.log(`Mock KBZ server listening on http://localhost:${port}`));
