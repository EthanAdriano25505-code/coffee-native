import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';
import type { SupabaseClient } from '@supabase/supabase-js';

const DEVICE_KEY = 'deviceId';

/**
 * Return a stable actor id:
 * - If authenticated user present -> `user:<uid>`
 * - Otherwise -> persistent `device:<uuid>` stored in AsyncStorage
 *
 * Works with supabase-js v1 (auth.user()) and v2 (auth.getUser()).
 */
export async function getActorId(supabaseClient?: SupabaseClient | any): Promise<string> {
  try {
    // Try supabase-js v2: auth.getUser()
    if (supabaseClient?.auth?.getUser && typeof supabaseClient.auth.getUser === 'function') {
      const res = await supabaseClient.auth.getUser();
      const user = res?.data?.user ?? res?.user ?? null;
      if (user?.id) return `user:${user.id}`;
    }

    // Try supabase-js v1: auth.user() function
    if (supabaseClient?.auth && typeof supabaseClient.auth.user === 'function') {
      const user = supabaseClient.auth.user();
      if (user?.id) return `user:${user.id}`;
    }

    // Some setups expose auth.user as object
    if (supabaseClient?.auth?.user && supabaseClient.auth.user?.id) {
      return `user:${supabaseClient.auth.user.id}`;
    }

    // Fallback to persistent device id
    let deviceId: string | null = await AsyncStorage.getItem(DEVICE_KEY);
    if (!deviceId) {
      const newId = uuidv4();
      // store the generated id (guaranteed string)
      await AsyncStorage.setItem(DEVICE_KEY, newId);
      deviceId = newId;
    }

    return `device:${deviceId}`;
  } catch (err) {
    // If anything goes wrong, return a short-lived volatile device id
    return `device:volatile-${Math.random().toString(36).slice(2, 10)}`;
  }
}