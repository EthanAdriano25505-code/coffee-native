// Minimal Node-runner tests for teaser source selection and mark interaction formatting.
// These tests are intentionally dependency-light and do NOT import React Native modules.

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

// Local copy of the core selector logic (mirrors src/contexts/playbackMarks.ts markTeaserIfNeeded)
function getTeaserUrlLocal(song) {
  if (!song) return null;
  const url = song.teaser_url;
  if (typeof url === 'string') {
    const trimmed = url.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  return null;
}

function normalizeSourceLocal(song) {
  if (!song) return null;

  if (typeof song.audio_url === 'string') {
    const trimmed = song.audio_url.trim();
    if (trimmed.length > 0) return { uri: trimmed };
  }

  if (song.uri && typeof song.uri.uri === 'string') {
    const trimmed = song.uri.uri.trim();
    if (trimmed.length > 0) return { uri: trimmed };
  }

  return null;
}

function markTeaserIfNeededLocal(song, env) {
  if (!song) return null;
  const mode = env && env.TEASER_MODE;

  if (mode === 'on') {
    const teaser = getTeaserUrlLocal(song);
    if (teaser) return { uri: teaser };
    // No teaser available, fall back to full-track source
    return normalizeSourceLocal(song);
  }

  // When TEASER_MODE is off/unset, ALWAYS use full-track source and never teaser.
  return normalizeSourceLocal(song);
}

async function markSongInteractionLocal(supabase, songId, markType) {
  // Minimal mirror of src/utils/marks.ts, but with a stub actor id to avoid RN/AsyncStorage.
  const actorId = 'actor:test';

  let userId = null;
  try {
    if (supabase && supabase.auth && typeof supabase.auth.getUser === 'function') {
      const res = await supabase.auth.getUser();
      userId = (res && res.data && res.data.user && res.data.user.id) || null;
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
  if (error) throw error;
  return data && data[0] ? data[0] : null;
}

function runSelectorTests() {
  const baseSong = {
    id: 1,
    title: 'Test',
    artist: 'Artist',
    audio_url: 'https://example.com/full.mp3',
    teaser_url: 'https://example.com/teaser.mp3',
  };

  // TEASER_MODE=on prefers teaser
  const s1 = markTeaserIfNeededLocal(baseSong, { TEASER_MODE: 'on' });
  assert(s1 && s1.uri === baseSong.teaser_url, 'TEASER_MODE=on should pick teaser_url');

  // TEASER_MODE=on with no teaser falls back to full
  const s2 = markTeaserIfNeededLocal({ ...baseSong, teaser_url: null }, { TEASER_MODE: 'on' });
  assert(s2 && s2.uri === baseSong.audio_url, 'TEASER_MODE=on without teaser should fall back to audio_url');

  // TEASER_MODE off must always use full track, never teaser, even if teaser_url is present
  const s3 = markTeaserIfNeededLocal(baseSong, {});
  assert(s3 && s3.uri === baseSong.audio_url, 'TEASER_MODE off should use full audio_url even when teaser_url exists');

  // TEASER_MODE off with only a non-teaser explicit uri should use that uri as full track
  const s4 = markTeaserIfNeededLocal(
    { ...baseSong, audio_url: null, uri: { uri: 'https://example.com/full-explicit.mp3' } },
    {}
  );
  assert(
    s4 && s4.uri === 'https://example.com/full-explicit.mp3',
    'TEASER_MODE off should use non-teaser explicit uri as full track when audio_url is missing'
  );

  // TEASER_MODE off with pre-resolved teaser uri should suppress it and return audio_url
  const s5 = markTeaserIfNeededLocal(
    { ...baseSong, uri: { uri: baseSong.teaser_url } },
    {}
  );
  assert(
    s5 && s5.uri === baseSong.audio_url,
    'TEASER_MODE off with pre-resolved teaser uri should ignore uri and return audio_url'
  );
}

async function runMarkInteractionTests() {
  const calls = [];
  const fakeSupabase = {
    auth: {
      async getUser() {
        return { data: { user: { id: 'user-123' } } };
      },
    },
    async rpc(name, params) {
      calls.push({ name, params });
      return { data: [{ play_marks: 1, purchase_marks: 0, total_marks: 1 }], error: null };
    },
  };

  const result = await markSongInteractionLocal(fakeSupabase, 42, 'play');

  assert(calls.length === 1, 'Expected exactly one RPC call');
  const call = calls[0];
  assert(call.name === 'mark_song_interaction', 'Expected RPC name mark_song_interaction');
  assert(call.params._song_id === 42, 'Expected _song_id=42');
  assert(call.params._mark === 'play', 'Expected _mark="play"');
  assert(call.params._actor_id === 'actor:test', 'Expected stub actor id');
  assert(result && result.total_marks === 1, 'Expected total_marks=1 in mock result');
}

(async () => {
  try {
    runSelectorTests();
    await runMarkInteractionTests();
    console.log('All teaser/mark tests passed.');
  } catch (err) {
    console.error('Teaser/mark tests failed:', err && err.message ? err.message : err);
    process.exitCode = 1;
  }
})();
