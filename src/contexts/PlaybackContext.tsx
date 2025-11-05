import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Audio } from 'expo-av';

type Song = { id: string | number; title: string; artist?: string | null; uri?: { uri: string } | undefined; cover_url?: string | null };

type PlaybackContextType = {
  currentSong: Song | null;
  isPlaying: boolean;
  positionMillis: number;    // <-- added
  durationMillis: number;    // <-- added
  play: (song: Song) => Promise<void>;
  pause: () => Promise<void>;
  stop: () => Promise<void>;
  next: () => Promise<void>;
  prev: () => Promise<void>;
  seek: (positionMillis: number) => Promise<void>;
  togglePlay: (song?: Song) => Promise<void>; // <-- added togglePlay
};

const PlaybackContext = createContext<PlaybackContextType | undefined>(undefined);

export const usePlayback = () => {
  const ctx = useContext(PlaybackContext);
  if (!ctx) throw new Error('usePlayback must be used within PlaybackProvider');
  return ctx;
};

export const PlaybackProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const soundRef = useRef<Audio.Sound | null>(null);
  const isLoadingRef = useRef(false);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playlist, setPlaylist] = useState<Song[]>([]);

  // New: position + duration state
  const [positionMillis, setPositionMillis] = useState<number>(0);
  const [durationMillis, setDurationMillis] = useState<number>(0);

  // ---- REPLACE/INSERT in src/contexts/PlaybackContext.tsx (inside PlaybackProvider) ----

  /* small monotonic id to track most recent request and ignore stale async results */
  const lastActionIdRef = React.useRef(0);

  /* Helper: stop and unload existing sound immediately (best-effort) */
  const _stopAndUnloadCurrent = async () => {
    if (soundRef.current) {
      try { await (soundRef.current as any).stopAsync(); } catch (e) {}
      try { await (soundRef.current as any).unloadAsync(); } catch (e) {}
      soundRef.current = null;
    }
  };

  /* Optimistic toggle: play or pause the current sound (works for existing currentSong) */
  const togglePlay = async (song?: any) => {
    // If a specific song is provided and it's different than current, start that song
    if (song && (currentSong as any)?.id !== song.id) {
      await play(song);
      return;
    }

    // If there's a sound instance, toggle pause/play quickly and update UI optimistically
    if (soundRef.current) {
      // optimistic UI update
      setIsPlaying((prev: boolean) => {
        const next = !prev;
        return next;
      });

      try {
        const status = await (soundRef.current as any).getStatusAsync();
        if (status.isLoaded) {
          if (status.isPlaying) {
            // pause
            await (soundRef.current as any).pauseAsync();
            setIsPlaying(false);
          } else {
            // play
            await (soundRef.current as any).playAsync();
            setIsPlaying(true);
          }
        } else {
          // if not loaded, attempt reload/play
          await (soundRef.current as any).playAsync();
          setIsPlaying(true);
        }
      } catch (e) {
        console.warn('togglePlay error', e);
        setIsPlaying(false);
      }
      return;
    }

    // If no sound instance: play currentSong if exists
    if (currentSong) {
      await play(currentSong as any);
    }
  };

  const play = async (song: any) => {
    // increment action id and capture locally so any stale async results can be dropped
    const actionId = ++lastActionIdRef.current;
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;

    // Optimistic UI: set currentSong and show playing immediately
    setCurrentSong((prev: any) => ({ ...(prev ?? {}), ...song }));
    setIsPlaying(true);

    try {
      // Stop + unload existing sound instance first (synchronously awaited)
      await _stopAndUnloadCurrent();

        if (!song?.uri) {
          // nothing to play — make sure UI reflects stopped state
          // clear current song to avoid leaving an invalid currentSong
          setCurrentSong(null);
          setIsPlaying(false);
          setPositionMillis(0);
          setDurationMillis(0);
          return;
        }

      // create and play new sound
      const created = await Audio.Sound.createAsync(song.uri, { shouldPlay: true });
      const sound = (created as any).sound;
      soundRef.current = sound;

      // update position/duration right away
      const statusAny = (await sound.getStatusAsync()) as any;
      if (lastActionIdRef.current !== actionId) {
        // a newer action happened — abandon this sound
        try { await sound.unloadAsync(); } catch (e) {}
        soundRef.current = null;
        return;
      }
      setPositionMillis(statusAny.positionMillis ?? 0);
      setDurationMillis(statusAny.durationMillis ?? 0);

      // make sure isPlaying flag matches actual status
      setIsPlaying(statusAny.isPlaying ?? true);

      sound.setOnPlaybackStatusUpdate((s: any) => {
        if (!s) return;

        // ignore updates from stale actions
        if (lastActionIdRef.current !== actionId) return;

        setPositionMillis(s.positionMillis ?? 0);
        setDurationMillis(s.durationMillis ?? 0);

        if (s.didJustFinish) {
          setIsPlaying(false);
          // optional: unload to free resources
          try { sound.unloadAsync().catch(() => {}); } catch (e) {}
          soundRef.current = null;
        }
      });
    } catch (err) {
      console.warn('play error', err);
      setIsPlaying(false);
    } finally {
      isLoadingRef.current = false;
    }
  };

  const pause = async () => {
    // Optimistic UI update: set not-playing immediately
    setIsPlaying(false);
    if (soundRef.current) {
      try {
        await (soundRef.current as any).pauseAsync();
      } catch (e) {
        console.warn('pause error', e);
      }
    }
  };

  const stop = async () => {
    // Optimistic UI update
    setIsPlaying(false);
    await _stopAndUnloadCurrent();
    setPositionMillis(0);
    setDurationMillis(0);
  };

  // ---- END INSERT ----

  const next = async () => {
    if (!currentSong || playlist.length === 0) return;
    const idx = playlist.findIndex((s) => s.id === currentSong.id);
    const nextSong = playlist[(idx + 1) % playlist.length];
    if (nextSong) await play(nextSong);
  };

  const prev = async () => {
    if (!currentSong || playlist.length === 0) return;
    const idx = playlist.findIndex((s) => s.id === currentSong.id);
    const prevSong = playlist[(idx - 1 + playlist.length) % playlist.length];
    if (prevSong) await play(prevSong);
  };

  const seek = async (positionMillis: number) => {
    if (soundRef.current) {
      try {
        await soundRef.current.setPositionAsync(positionMillis);
        setPositionMillis(positionMillis);
      } catch (e) {
        console.warn('seek error', e);
      }
    }
  };

  // Ensure provider value includes togglePlay and seek (if seek exists)
  const value = {
    currentSong,
    isPlaying,
    positionMillis,   // exposed
    durationMillis,   // exposed
    togglePlay,
    play,
    pause,
    stop,
    next,
    prev,
    seek,
  };

  return (
    <PlaybackContext.Provider value={value}>
      {children}
    </PlaybackContext.Provider>
  );
};

export default PlaybackContext;


