# feat: wire teaser selection & mark-on-complete (TEASER_MODE)

## Summary

This PR implements end-to-end teaser/full-track selection logic with TEASER_MODE environment control and records playback completion marks via Supabase RPC. When `TEASER_MODE=on`, the app prefers `teaser_url` (if available) and falls back to full track on load failure. When `TEASER_MODE` is off or unset, the app **never** uses teasers and always plays the full track. On playback completion (`didJustFinish`), a single `mark_song_interaction` RPC call records a `play` mark.

## Files Changed

- **`src/contexts/playbackMarks.ts`** (new): Pure `markTeaserIfNeeded` selector that picks teaser vs full based on TEASER_MODE; idempotent helper functions for teaser/purchase marks
- **`src/utils/marks.ts`** (new): `markSongInteraction` RPC wrapper, `normalizeSource` full-track extractor, `getTeaserUrl` helper; exports `MarkType` union
- **`src/utils/actor.ts`** (new): Actor ID generator for anonymous device tracking (AsyncStorage-based UUID)
- **`src/contexts/PlaybackContext.tsx`**: Integrated `markTeaserIfNeeded` selector; added pre-resolved teaser uri suppression guard when TEASER_MODE off; refactored `play` to stop/unload previous sound before creating new one; added teaser load failure log with fallback to full track; fires single `markSongInteraction(..., 'play')` on `didJustFinish` with success/error logging
- **`test/run-mark-tests.js`** (new): Node-runnable tests for selector logic (TEASER_MODE on/off, fallback cases, pre-resolved teaser uri suppression) and RPC payload format validation

## How to Run Locally

### Prerequisites
1. Node.js and npm installed
2. Expo CLI installed (`npm install -g expo-cli`)
3. Supabase project with test credentials (or use mock/local backend)

### Environment Variables

Create a `.env` file in the project root (or set environment variables):

```bash
# Required: Supabase credentials (use test/dev project)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here

# Optional: Teaser mode control
# To enable teaser mode (prefers teaser_url when available)
TEASER_MODE=on

# To disable teaser mode (always uses full track, never teaser)
# Leave unset or set to any value other than 'on'
# TEASER_MODE=off
```

### Install & Run
```bash
# Install dependencies
npm install

# Run tests first
node test/run-mark-tests.js

# TypeScript check (should pass with no errors)
npx tsc --noEmit

# Start the app
npm start
# or
npx expo start
```

### Run Tests
```bash
node test/run-mark-tests.js
```

**Expected output:**
```
All teaser/mark tests passed.
```

### TypeScript Check
```bash
npx tsc --noEmit
```

**Expected output:**
```
(No output = success)
```

## Manual Verification Steps

### 1. TEASER_MODE=on with valid teaser
```bash
# Set environment
export TEASER_MODE=on  # or TEASER_MODE=on in .env
```
- Play a song with both `audio_url` and `teaser_url`
- **Verify**: Console shows teaser uri being loaded
- **Verify**: Audio plays the shorter teaser version
- Let playback complete naturally
- **Verify**: Console shows `Playback completion mark success` log with `{ songId, uri, result }`
- **Verify**: Database shows new `play` mark record with correct `_song_id`, `_actor_id`, `_user_id`, `_mark='play'`

### 2. TEASER_MODE=on with teaser load failure
```bash
export TEASER_MODE=on
```
- Play a song with invalid `teaser_url` (404 or malformed URL)
- **Verify**: Console shows exact log format:
  ```javascript
  console.warn('Teaser load failed', { 
    songId: <number>, 
    attemptedUri: '<teaser-url>', 
    error: '<error-message>' 
  })
  ```
- **Verify**: App automatically falls back to full track (`audio_url`) without crashing
- **Verify**: Playback continues successfully with full track
- **Verify**: Completion mark still fires after full track finishes

### 3. TEASER_MODE=off (or unset) - Never use teaser
```bash
unset TEASER_MODE
# or
export TEASER_MODE=off
# or omit from .env
```
- Play a song with both `audio_url` and `teaser_url`
- **Verify**: Console never references teaser uri
- **Verify**: Audio always uses `audio_url` (full track)
- **Verify**: Playback completion mark fires correctly
- **Critical**: Even if song has valid `teaser_url`, it must NEVER be played

### 4. Pre-resolved teaser uri suppression
```bash
export TEASER_MODE=off
```
- Pass a song object with `uri: { uri: <teaser_url> }` pre-resolved
- **Verify**: `PlaybackContext` detects that `uri.uri` matches `teaser_url`
- **Verify**: Context suppresses the teaser uri and falls back to `audio_url`
- **Verify**: Full track plays, not the teaser

### 5. RPC call verification
On any completed playback, check console logs:

**Success case:**
```javascript
console.log('Playback completion mark success', { 
  songId: 42, 
  uri: 'https://...', 
  result: { play_marks: 1, purchase_marks: 0, total_marks: 1 } 
})
```

**Failure case:**
```javascript
console.error('Mark RPC failed', { 
  songId: 42, 
  rpc: 'mark_song_interaction', 
  error: 'error message here' 
})
```

**Database verification:**
```sql
-- Check marks table for play records
SELECT * FROM song_marks 
WHERE song_id = <song_id> 
  AND mark_type = 'play' 
ORDER BY created_at DESC 
LIMIT 5;
```

### 6. No duplicate marks per playback session
- Play a song to completion
- **Verify**: Only ONE `Playback completion mark success` log appears
- **Verify**: Only ONE database record created for that playback session
- **Note**: `completionMarked` flag prevents duplicate RPC calls within same play session

## Renamed/New Helpers

- **`markTeaserIfNeeded`** (new in `playbackMarks.ts`): Pure selector function for teaser vs full source
- **`markSongInteraction`** (new in `marks.ts`): Supabase RPC wrapper for `mark_song_interaction` with robust auth detection
- **`normalizeSource`** (new in `marks.ts`): Extracts full-track uri from song object, never returns teaser
- **`getActorId`** (new in `actor.ts`): Generates/retrieves persistent anonymous device UUID

## Notes

- No changes to `app.json` or `package.json` per requirements
- No secrets or service_role keys added to repository
- RPC `mark_song_interaction` signature validated: accepts `{ _actor_id, _user_id, _song_id, _mark }` where `_mark` is one of `'teaser' | 'purchase' | 'play'`
- Tests are dependency-free and use Node's built-in assert
- Playback completion mark is idempotent per play session (guarded by `completionMarked` flag)
- Replaced `uuid` package with native UUID generator to avoid TypeScript type dependency issues
- TypeScript compilation passes with no errors (`npx tsc --noEmit`)

## Test Results

### Unit Tests
```bash
$ node test/run-mark-tests.js
All teaser/mark tests passed.
```

### TypeScript Check
```bash
$ npx tsc --noEmit
(No output = success)
```

## Implementation Details

### Sound Cleanup
- `_stopAndUnloadCurrent()` called before every new `Audio.Sound` creation
- Prevents overlapping audio instances
- Ensures clean state transitions between tracks

### Teaser Fallback Logic
```typescript
try {
  sound = await createSound(primarySource);
} catch (err) {
  if (isTeaserPreferred && fullFallback && fullFallback.uri !== primarySource.uri) {
    console.warn('Teaser load failed', { songId, attemptedUri, error: err.message });
    sound = await createSound(fullFallback); // Single retry with full track
  } else {
    throw err;
  }
}
```

### Completion Mark Idempotency
```typescript
let completionMarked = false;
if (s.didJustFinish && !completionMarked) {
  completionMarked = true;
  await markSongInteraction(supabase, songId, 'play');
}
```
