import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Audio } from 'expo-av';

type Song = { id: string; title: string; artist: string; uri?: any };

type PlaybackContextType = {
  currentSong: Song | null;
  isPlaying: boolean;
  play: (song: Song) => Promise<void>;
  pause: () => Promise<void>;
  stop: () => Promise<void>;
  next: () => Promise<void>;
  prev: () => Promise<void>;
};

const PlaybackContext = createContext<PlaybackContextType | undefined>(undefined);

export const usePlayback = () => {
  const ctx = useContext(PlaybackContext);
  if (!ctx) throw new Error('usePlayback must be used within PlaybackProvider');
  return ctx;
};

export const PlaybackProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const soundRef = useRef<Audio.Sound | null>(null);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playlist, setPlaylist] = useState<Song[]>([]);

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
        soundRef.current = null;
      }
    };
  }, []);

  const loadAndPlay = async (song: Song) => {
    try {
      // unload previous
      if (soundRef.current) {
        try {
          await soundRef.current.unloadAsync();
        } catch (e) {}
        soundRef.current = null;
        setIsPlaying(false);
      }

      if (!song.uri) {
        // nothing to play
        setCurrentSong(song);
        return;
      }

      const { sound } = await Audio.Sound.createAsync(song.uri);
      soundRef.current = sound;
      setCurrentSong(song);
      await sound.playAsync();
      setIsPlaying(true);

      sound.setOnPlaybackStatusUpdate((status) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const s: any = status;
        if (s && s.isLoaded && s.didJustFinish) {
          setIsPlaying(false);
          sound.unloadAsync().catch(() => {});
          soundRef.current = null;
        }
      });
    } catch (err) {
      console.warn('playback error', err);
    }
  };

  const play = async (song: Song) => {
    await loadAndPlay(song);
  };

  const pause = async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.pauseAsync();
        setIsPlaying(false);
      } catch (e) {}
    }
  };

  const stop = async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      } catch (e) {}
      soundRef.current = null;
      setIsPlaying(false);
    }
  };

  const next = async () => {
    if (!currentSong || playlist.length === 0) return;
    const idx = playlist.findIndex((s) => s.id === currentSong.id);
    const nextSong = playlist[(idx + 1) % playlist.length];
    if (nextSong) await loadAndPlay(nextSong);
  };

  const prev = async () => {
    if (!currentSong || playlist.length === 0) return;
    const idx = playlist.findIndex((s) => s.id === currentSong.id);
    const prevSong = playlist[(idx - 1 + playlist.length) % playlist.length];
    if (prevSong) await loadAndPlay(prevSong);
  };

  return (
    <PlaybackContext.Provider value={{ currentSong, isPlaying, play, pause, stop, next, prev }}>
      {children}
    </PlaybackContext.Provider>
  );
};

export default PlaybackContext;
