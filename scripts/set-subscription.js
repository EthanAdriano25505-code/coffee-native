#!/usr/bin/env node
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_KEY in env.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function main() {
  const userId = process.argv[2];
  if (!userId) {
    console.error('Usage: node scripts/set-subscription.js <userId>');
    process.exit(1);
  }

  const { error } = await supabase.from('subscriptions').upsert({
    user_id: userId,
    status: 'active',
    started_at: new Date().toISOString(),
  });

  if (error) {
    console.error('Supabase upsert error:', error);
    process.exit(1);
  }

  console.log('Subscription set active for', userId);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
