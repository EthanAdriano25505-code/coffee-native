import type { SupabaseClient } from '@supabase/supabase-js';
import { getActorId } from './actor';

export type MarkResult = {
  play_marks: number;
  purchase_marks: number;
  total_marks: number;
};

export type MarkType = 'teaser' | 'purchase' | 'play';

/**
 * markSongInteraction
 * - Calls the DB RPC `mark_song_interaction`
 * - Handles multiple supabase-js auth shapes (v1/v2)
 */
export async function markSongInteraction(
  supabase: SupabaseClient | any,
  songId: number,
  markType: MarkType
): Promise<MarkResult | null> {
  const actorId = await getActorId(supabase);

  // Get user id in a robust way for either supabase-js version
  let userId: string | null = null;
  try {
    if (supabase?.auth?.getUser && typeof supabase.auth.getUser === 'function') {
      const res = await supabase.auth.getUser();
      userId = res?.data?.user?.id ?? null;
    } else if (supabase?.auth && typeof supabase.auth.user === 'function') {
      const user = supabase.auth.user();
      userId = user?.id ?? null;
    } else if (supabase?.auth?.user && supabase.auth.user?.id) {
      userId = supabase.auth.user.id;
    }
  } catch {
    userId = null;
  }

  const params = {
    _actor_id: actorId,
    _user_id: userId,
    _song_id: songId,
    _mark: markType,
  };

  const { data, error } = await supabase.rpc('mark_song_interaction', params);

  if (error) {
    // rethrow so callers can handle it
    throw error;
  }
  // supabase-js returns an array row for RPC results
  return (data && data[0]) ? (data[0] as MarkResult) : null;
}

// -------- Teaser/source helpers (pure, no Supabase calls) --------

export type SourceSongShape = {
  id?: string | number;
  uri?: { uri: string } | null;
  audio_url?: string | null;
  teaser_url?: string | null;
};

export function hasTeaser(song: SourceSongShape | null | undefined): boolean {
  if (!song) return false;
  const url = (song as any).teaser_url;
  return typeof url === 'string' && url.trim().length > 0;
}

export function getTeaserUrl(song: SourceSongShape | null | undefined): string | null {
  if (!song) return null;
  const url = (song as any).teaser_url;
  if (typeof url === 'string') {
    const trimmed = url.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  return null;
}

export function normalizeSource(song: SourceSongShape | null | undefined): { uri: string } | null {
  if (!song) return null;

  const audioUrl = (song as any).audio_url;
  if (typeof audioUrl === 'string') {
    const trimmed = audioUrl.trim();
    if (trimmed.length > 0) {
      return { uri: trimmed };
    }
  }

  const existingUri = (song as any).uri?.uri;
  if (typeof existingUri === 'string') {
    const trimmed = existingUri.trim();
    // Treat uri equal to teaser_url as a teaser, not a full track; skip it here.
    const teaser = (song as any).teaser_url;
    const teaserTrimmed = typeof teaser === 'string' ? teaser.trim() : null;
    if (trimmed.length > 0 && (!teaserTrimmed || trimmed !== teaserTrimmed)) {
      return { uri: trimmed };
    }
  }

  return null;
}
