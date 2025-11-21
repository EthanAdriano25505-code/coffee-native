import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

// Read from environment; do not hardcode secrets.
const env = (globalThis as any)?.process?.env ?? {};
const supabaseUrl = env.SUPABASE_URL as string | undefined;
const supabaseKey = env.SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase env missing', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseKey,
  });
}

export const supabase = createClient(supabaseUrl || '', supabaseKey || '', {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

