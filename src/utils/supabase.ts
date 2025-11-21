import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

// Prefer local config (not committed with secrets) then fall back to env vars.
let localUrl: string | undefined;
let localKey: string | undefined;
try {
  // Dynamically require to avoid bundling issues if file absent
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const local = require('../config/supabaseLocal');
  localUrl = local.SUPABASE_URL || undefined;
  localKey = local.SUPABASE_ANON_KEY || undefined;
} catch {}

const env = (globalThis as any)?.process?.env ?? {};
const envUrl = env.SUPABASE_URL as string | undefined;
const envKey = env.SUPABASE_ANON_KEY as string | undefined;

const finalUrl = localUrl || envUrl;
const finalKey = localKey || envKey;

console.log('SUPABASE_URL present?', !!finalUrl);

if (!finalUrl) {
  throw new Error('SUPABASE_URL is required (set SUPABASE_URL env or create src/config/supabaseLocal.ts)');
}

export const supabase = createClient(finalUrl, finalKey || '', {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

