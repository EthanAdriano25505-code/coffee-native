import React, { createContext, useContext, useRef, useState, useEffect } from 'react';
import { Audio } from 'expo-av';

type Song = { id: string | number; title: string; artist?: string | null; uri?: { uri: string } | undefined; cover_url?: string | null; artwork?: string | null; url?: string };

type PlaybackContextType = {
  currentSong: Song | null;
  isPlaying: boolean;
  positionMillis: number;
  durationMillis: number;
  playlist: Song[];
  shuffleEnabled: boolean;
  repeatMode: 'off' | 'all' | 'one';
  play: (song: Song, newPlaylist?: Song[]) => Promise<void>;
  pause: () => Promise<void>;
  stop: () => Promise<void>;
  next: () => Promise<void>;
  prev: () => Promise<void>;
  seek: (positionMillis: number) => Promise<void>;
  togglePlay: (song?: Song) => Promise<void>;
  toggleShuffle: () => void;
  setRepeatMode: (mode: 'off' | 'all' | 'one') => void;
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
  const [shuffleEnabled, setShuffleEnabled] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'off' | 'all' | 'one'>('off');
  const [positionMillis, setPositionMillis] = useState<number>(0);
  const [durationMillis, setDurationMillis] = useState<number>(0);

  // Monotonic request id: newest action wins
  const lastActionIdRef = useRef(0);

  // Throttle position updates to avoid excessive re-renders
  const lastPositionUpdateRef = useRef<number>(0);
  const POSITION_UPDATE_THROTTLE_MS = 500; // 500ms - UI handles smooth interpolation

  const _stopAndUnloadCurrent = async () => {
    if (soundRef.current) {
      try { await (soundRef.current as any).stopAsync(); } catch (e) {}
      try { await (soundRef.current as any).unloadAsync(); } catch (e) {}
      soundRef.current = null;
    }
  };

  const togglePlay = async (song?: any) => {
    if (__DEV__) console.log('togglePlay called:', { songId: song?.id ?? null, isPlaying });
    // If a specific song is requested and it's different, start it
    if (song && (currentSong as any)?.id !== song.id) {
      await play(song);
      return;
    }

    // If UI currently thinks we're playing, user intends to pause
    if (isPlaying) {
      // optimistic UI
      setIsPlaying(false);
      try {
        if (__DEV__) console.log('togglePlay -> calling pause()');
        await pause();
        if (__DEV__) console.log('togglePlay -> pause() resolved');
      } catch (e) {
        console.warn('togglePlay (pause) error', e);
        // restore state if pause failed
        setIsPlaying(true);
      }
      return;
    }

    // Otherwise user intends to play: if we have an existing sound try to resume
    if (soundRef.current) {
      try {
        const status = await (soundRef.current as any).getStatusAsync();
        if (__DEV__) console.log('togglePlay resume: sound status', { isLoaded: status.isLoaded, isPlaying: status.isPlaying, positionMillis: status.positionMillis });
        if (status.isLoaded) {
          await (soundRef.current as any).playAsync();
          setIsPlaying(true);
          return;
        }
      } catch (e) {
        console.warn('togglePlay (resume) getStatus/play error', e);
      }
    }

    // No usable instance: start playing the currentSong (if any)
    if (currentSong) {
      await play(currentSong as any);
    }
  };

  const play = async (song: any, newPlaylist?: Song[]) => {
    const actionId = ++lastActionIdRef.current;
    // mark loading (do not reject new requests, latest actionId controls correctness)
    isLoadingRef.current = true;

    if (newPlaylist) {
      setPlaylist(newPlaylist);
    }

    // Optimistic UI: reflect user's intent immediately
    setCurrentSong((prev: any) => ({ ...(prev ?? {}), ...song }));
    setIsPlaying(true);

    try {
      // Ensure any existing sound is stopped/unloaded before creating a new one
      await _stopAndUnloadCurrent();

      const uri = song.uri || (song.url ? { uri: song.url } : null);
      if (!uri) {
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
      const created = await Audio.Sound.createAsync(uri, { shouldPlay: true });
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
          // We use a functional update or a ref to get the latest repeatMode
          // But since this is a callback, it might have stale closure.
          // Let's use a ref for repeatMode and playlist if needed, or just call a method that handles it.
          handleSongFinished();
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

  // Use refs for values needed in callbacks to avoid stale closures
  const repeatModeRef = useRef(repeatMode);
  useEffect(() => { repeatModeRef.current = repeatMode; }, [repeatMode]);
  
  const playlistRef = useRef(playlist);
  useEffect(() => { playlistRef.current = playlist; }, [playlist]);

  const currentSongRef = useRef(currentSong);
  useEffect(() => { currentSongRef.current = currentSong; }, [currentSong]);

  const handleSongFinished = () => {
    if (repeatModeRef.current === 'one') {
      if (soundRef.current) {
        soundRef.current.setPositionAsync(0).then(() => soundRef.current?.playAsync());
        setIsPlaying(true);
      }
    } else {
      next();
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
    const currentPlaylist = playlistRef.current;
    const song = currentSongRef.current;
    if (!song || currentPlaylist.length === 0) return;

    let nextSong: Song;
    if (shuffleEnabled) {
      const randomIndex = Math.floor(Math.random() * currentPlaylist.length);
      nextSong = currentPlaylist[randomIndex];
    } else {
      const idx = currentPlaylist.findIndex((s) => s.id === song.id);
      if (idx === currentPlaylist.length - 1) {
        if (repeatModeRef.current === 'all') {
          nextSong = currentPlaylist[0];
        } else {
          // End of playlist
          await stop();
          return;
        }
      } else {
        nextSong = currentPlaylist[idx + 1];
      }
    }
    if (nextSong) await play(nextSong);
  };

  const prev = async () => {
    const currentPlaylist = playlistRef.current;
    const song = currentSongRef.current;
    if (!song || currentPlaylist.length === 0) return;

    // If we're more than 3 seconds into the song, just restart it
    if (positionMillis > 3000) {
      await seek(0);
      return;
    }

    let prevSong: Song;
    const idx = currentPlaylist.findIndex((s) => s.id === song.id);
    if (idx <= 0) {
      if (repeatModeRef.current === 'all') {
        prevSong = currentPlaylist[currentPlaylist.length - 1];
      } else {
        // Start of playlist, just restart first song
        await seek(0);
        return;
      }
    } else {
      prevSong = currentPlaylist[idx - 1];
    }
    if (prevSong) await play(prevSong);
  };

  const toggleShuffle = () => setShuffleEnabled(!shuffleEnabled);

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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
      }
    };
  }, []);

  // Expose methods
  const value: PlaybackContextType = {
    currentSong,
    isPlaying,
    positionMillis,
    durationMillis,
    playlist,
    shuffleEnabled,
    repeatMode,
    play,
    pause,
    stop,
    next,
    prev,
    seek,
    togglePlay,
    toggleShuffle,
    setRepeatMode,
  };

  return <PlaybackContext.Provider value={value}>{children}</PlaybackContext.Provider>;
};

export default PlaybackContext;