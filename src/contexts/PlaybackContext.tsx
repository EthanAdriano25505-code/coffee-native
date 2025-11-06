import React, { createContext, useContext, useRef, useState, useEffect } from 'react';
import { Audio } from 'expo-av';

type Song = { id: string | number; title: string; artist?: string | null; uri?: { uri: string } | undefined; cover_url?: string | null };

type PlaybackContextType = {
  currentSong: Song | null;
  isPlaying: boolean;
  positionMillis: number;
  durationMillis: number;
  play: (song: Song) => Promise<void>;
  pause: () => Promise<void>;
  stop: () => Promise<void>;
  next: () => Promise<void>;
  prev: () => Promise<void>;
  seek: (positionMillis: number) => Promise<void>;
  togglePlay: (song?: Song) => Promise<void>;
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
  const [positionMillis, setPositionMillis] = useState<number>(0);
  const [durationMillis, setDurationMillis] = useState<number>(0);

  // Monotonic request id: newest action wins
  const lastActionIdRef = useRef(0);

  // Throttle position updates to avoid excessive re-renders
  const lastPositionUpdateRef = useRef<number>(0);
  const POSITION_UPDATE_THROTTLE_MS = 100; // 100ms

  const _stopAndUnloadCurrent = async () => {
    if (soundRef.current) {
      try { await (soundRef.current as any).stopAsync(); } catch (e) {}
      try { await (soundRef.current as any).unloadAsync(); } catch (e) {}
      soundRef.current = null;
    }
  };

  const togglePlay = async (song?: any) => {
    // If a specific song is requested and it's different, start it
    if (song && (currentSong as any)?.id !== song.id) {
      await play(song);
      return;
    }

    // If there's an active sound, toggle quickly and optimistically
    if (soundRef.current) {
      setIsPlaying((prev) => !prev); // optimistic UI
      try {
        const status = await (soundRef.current as any).getStatusAsync();
        if (status.isLoaded) {
          if (status.isPlaying) {
            await (soundRef.current as any).pauseAsync();
            setIsPlaying(false);
          } else {
            await (soundRef.current as any).playAsync();
            setIsPlaying(true);
          }
        } else {
          // attempt to play if not loaded
          await (soundRef.current as any).playAsync();
          setIsPlaying(true);
        }
      } catch (e) {
        console.warn('togglePlay error', e);
        setIsPlaying(false);
      }
      return;
    }

    // No instance: play currentSong if available
    if (currentSong) {
      await play(currentSong as any);
    }
  };

  const play = async (song: any) => {
    const actionId = ++lastActionIdRef.current;
    // mark loading (do not reject new requests, latest actionId controls correctness)
    isLoadingRef.current = true;

    // Optimistic UI: reflect user's intent immediately
    setCurrentSong((prev: any) => ({ ...(prev ?? {}), ...song }));
    setIsPlaying(true);

    try {
      // Ensure any existing sound is stopped/unloaded before creating a new one
      await _stopAndUnloadCurrent();

      if (!song?.uri) {
        // nothing playable: only clear UI if this action is still the latest
        if (lastActionIdRef.current === actionId) {
          setCurrentSong(null);
          setIsPlaying(false);
          setPositionMillis(0);
          setDurationMillis(0);
        }
        return;
      }

      // create and play new sound
      const created = await Audio.Sound.createAsync(song.uri, { shouldPlay: true });
      const sound = (created as any).sound;

      // If a newer action arrived while we were creating the sound, unload & abandon
      if (lastActionIdRef.current !== actionId) {
        try { await sound.unloadAsync(); } catch (e) {}
        return;
      }

      soundRef.current = sound;

      // Seed position/duration and set playback status update with throttle & staleness checks
      const statusAny = (await sound.getStatusAsync()) as any;

      if (lastActionIdRef.current !== actionId) {
        try { await sound.unloadAsync(); } catch (e) {}
        soundRef.current = null;
        return;
      }

      setPositionMillis(statusAny.positionMillis ?? 0);
      setDurationMillis(statusAny.durationMillis ?? 0);
      setIsPlaying(statusAny.isPlaying ?? true);

      sound.setOnPlaybackStatusUpdate((s: any) => {
        if (!s) return;
        // Ignore updates for stale actions
        if (lastActionIdRef.current !== actionId) return;

        // Always handle didJustFinish immediately
        if (s.didJustFinish) {
          setPositionMillis( s.positionMillis ?? 0 );
          setDurationMillis( s.durationMillis ?? 0 );
          setIsPlaying(false);
          try { sound.unloadAsync().catch(() => {}); } catch (e) {}
          soundRef.current = null;
          return;
        }

        // Throttle frequent position updates to reduce re-renders
        const now = Date.now();
        if (now - lastPositionUpdateRef.current >= POSITION_UPDATE_THROTTLE_MS) {
          lastPositionUpdateRef.current = now;
          setPositionMillis(s.positionMillis ?? 0);
          setDurationMillis(s.durationMillis ?? 0);
        }
      });
    } catch (err) {
      console.warn('play error', err);
      // Only flip UI if this action is still the latest
      if (lastActionIdRef.current === actionId) {
        setIsPlaying(false);
      }
    } finally {
      // Only clear loading flag if this action is still active
      if (lastActionIdRef.current === actionId) {
        isLoadingRef.current = false;
      }
    }
  };

  const pause = async () => {
    setIsPlaying(false); // optimistic
    if (soundRef.current) {
      try {
        await (soundRef.current as any).pauseAsync();
      } catch (e) {
        console.warn('pause error', e);
      }
    }
  };

  const stop = async () => {
    setIsPlaying(false);
    await _stopAndUnloadCurrent();
    setPositionMillis(0);
    setDurationMillis(0);
  };

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

  const seek = async (position: number) => {
    if (soundRef.current) {
      try {
        await soundRef.current.setPositionAsync(position);
        setPositionMillis(position);
      } catch (e) {
        console.warn('seek error', e);
      }
    }
  };

  // Expose methods
  const value: PlaybackContextType = {
    currentSong,
    isPlaying,
    positionMillis,
    durationMillis,
    play,
    pause,
    stop,
    next,
    prev,
    seek,
    togglePlay,
  };

  return <PlaybackContext.Provider value={value}>{children}</PlaybackContext.Provider>;
};

export default PlaybackContext;