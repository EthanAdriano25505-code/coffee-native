import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

const supabaseUrl = 'https://qemfsflhllxvdqmftnvz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlbWZzZmxobGx4dmRxbWZ0bnZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyMTY5NTQsImV4cCI6MjA3Njc5Mjk1NH0.pIiga67O2Ev3LICAMlcxBwhDgNyIBpiBu_qpZQOonRc';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
