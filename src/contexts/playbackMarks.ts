// Small helper module to integrate teaser marking into playback
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getActorId } from '../utils/actor';
import { getTeaserUrl, markSongInteraction, normalizeSource, SourceSongShape } from '../utils/marks';

import type { SupabaseClient } from '@supabase/supabase-js';

const STORAGE_KEY = 'marked_songs_v1'; // persisted map: { "<actorId>": { "<songId>": { teaser: true, purchase: true } } }

/**
 * In-memory cache to reduce AsyncStorage reads.
 * Structure: Record<actorId, Record<songId, { teaser?: true, purchase?: true }>>
 */
let cache: Record<string, Record<number, { teaser?: true; purchase?: true }>> | null = null;

async function loadCache(): Promise<Record<string, Record<number, { teaser?: true; purchase?: true }>>> {
  if (cache) return cache;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    cache = raw ? JSON.parse(raw) : {};
  } catch {
    cache = {};
  }
  return cache!;
}

async function persistCache() {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cache ?? {}));
  } catch {
    // ignore persistence failures; cache still prevents duplicates during session
  }
}

/**
 * markTeaserIfNeeded (pure selector)
 * - Chooses which audio source to play based on TEASER_MODE and song fields.
 * - When TEASER_MODE === 'on' and a valid teaser_url exists, returns teaser source.
 * - Otherwise always returns the normalized full-track source (audio_url or a non-teaser uri), or null if none.
 */
export function markTeaserIfNeeded(
  song: SourceSongShape | null | undefined,
  env?: { TEASER_MODE?: string }
): { uri: string } | null {
  if (!song) return null;

  const mode = env?.TEASER_MODE;

  // When teaser mode is enabled, prefer teaser_url when available
  if (mode === 'on') {
    const teaser = getTeaserUrl(song);
    if (teaser) {
      return { uri: teaser };
    }
    // No teaser available, fall back to full-track source
    return normalizeSource(song);
  }

  // When teaser mode is off (default), ALWAYS use the full-track source and never teaser.
  // normalizeSource is implemented to avoid returning teaser_url as a full-track uri.
  return normalizeSource(song);
}

/**
 * markTeaserInteractionIfNeeded
 * - idempotent: it checks local persisted cache and only calls RPC when necessary
 * - factionThreshold check is left to the caller; this helper just ensures single RPC per actor+song
 */
export async function markTeaserInteractionIfNeeded(
  supabase: SupabaseClient | any,
  songId: number
): Promise<{ called: boolean; result?: any } | { called: false; reason: string }> {
  try {
    const actorId = await getActorId(supabase);
    const c = await loadCache();

    const actorMap = (c[actorId] ||= {});
    if (actorMap[songId]?.teaser) {
      return { called: false, reason: 'already-marked' };
    }

    // call RPC
    const result = await markSongInteraction(supabase, songId, 'teaser');

    // mark locally (persist)
    actorMap[songId] = { ...(actorMap[songId] ?? {}), teaser: true };
    await persistCache();

    return { called: true, result };
  } catch (err) {
    return { called: false, reason: 'error', result: err };
  }
}

/**
 * markPurchaseNow
 * - use this when a purchase is confirmed to record the purchase mark server-side
 */
export async function markPurchaseIfNeeded(
  supabase: SupabaseClient | any,
  songId: number
): Promise<{ called: boolean; result?: any } | { called: false; reason: string }> {
  try {
    const actorId = await getActorId(supabase);
    const c = await loadCache();

    const actorMap = (c[actorId] ||= {});
    if (actorMap[songId]?.purchase) {
      return { called: false, reason: 'already-marked' };
    }

    const result = await markSongInteraction(supabase, songId, 'purchase');

    actorMap[songId] = { ...(actorMap[songId] ?? {}), purchase: true };
    await persistCache();

    return { called: true, result };
  } catch (err) {
    return { called: false, reason: 'error', result: err };
  }
}