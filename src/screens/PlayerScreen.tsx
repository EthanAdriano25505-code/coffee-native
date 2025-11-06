import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import Slider from '@react-native-community/slider';
import { usePlayback } from '../contexts/PlaybackContext';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/types';
import { useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');

export default function PlayerScreen({ route }: { route: RouteProp<RootStackParamList, 'Player'> }) {
  const paramSong = route.params?.song;
  const { currentSong, isPlaying, positionMillis, durationMillis, play, pause, next, prev, seek, togglePlay } = usePlayback();

  // Ensure playback started if navigated with a param and it's different
  useFocusEffect(
    useCallback(() => {
      if (paramSong && currentSong?.id !== paramSong.id) {
        const payload = {
          id: paramSong.id,
          title: paramSong.title,
          artist: paramSong.artist ?? undefined,
          cover_url: paramSong.cover_url ?? undefined,
          uri: paramSong.audio_url ? { uri: paramSong.audio_url } : undefined,
        };
        // fire-and-forget; PlaybackContext is race-protected
        play(payload);
      }
    }, [paramSong?.id, currentSong?.id])
  );

  const song = currentSong ?? paramSong;

  // Local slider state for smooth UI (labels and final thumb sync)
  const [seeking, setSeeking] = useState(false);
  const [localPos, setLocalPos] = useState<number>(positionMillis ?? 0);

  // Fast refs & RAFs for smooth updates without re-rendering on every drag
  const sliderRef = useRef<any>(null); // slider native ref — used with setNativeProps
  const seekingRef = useRef<boolean>(false); // track active drag without re-rendering
  const localPosRef = useRef<number>(positionMillis ?? 0); // fast current value
  const rafRef = useRef<number | null>(null); // interpolation RAF for non-seeking playback
  const labelRafRef = useRef<number | null>(null); // RAF used to throttle label updates during drag
  const lastContextPosRef = useRef<number>(positionMillis ?? 0);
  const lastLabelUpdateRef = useRef<number>(0);

  const RAF_INTERPOLATION_FACTOR = 0.25; // smoothing factor: closer to 1 = faster follow
  const RAF_MIN_DIFF = 0.5; // px/ms threshold to stop raf
  const LABEL_UPDATE_THROTTLE_MS = 50; // 20fps label update (tunable)

  // When context position updates, update the ref (throttled from PlaybackContext)
  useEffect(() => {
    lastContextPosRef.current = positionMillis ?? 0;

    // If not seeking, start the smooth RAF loop
    if (!seekingRef.current) {
      startRafLoop();
    }

    // If paused and close to target, snap immediately
    if (!isPlaying && Math.abs(localPosRef.current - lastContextPosRef.current) < 1) {
      localPosRef.current = lastContextPosRef.current;
      // ensure UI labels reflect exact value
      setLocalPos(lastContextPosRef.current);
      cancelInterpolationRaf();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [positionMillis, isPlaying]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      cancelAllRafs();
    };
  }, []);

  // Cancel only the interpolation RAF
  const cancelInterpolationRaf = () => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  // Cancel label RAF used during dragging
  const cancelLabelRaf = () => {
    if (labelRafRef.current != null) {
      cancelAnimationFrame(labelRafRef.current);
      labelRafRef.current = null;
    }
  };

  const cancelAllRafs = () => {
    cancelInterpolationRaf();
    cancelLabelRaf();
  };

  // Interpolation RAF: smoothly chase lastContextPosRef when not seeking.
  // We update localPosRef every frame but throttle setLocalPos() to LABEL_UPDATE_THROTTLE_MS.
  const startRafLoop = () => {
    cancelInterpolationRaf();

    // avoid starting while user is interacting
    if (seekingRef.current) return;

    const step = () => {
      // If user started seeking, stop interpolation loop
      if (seekingRef.current) {
        cancelInterpolationRaf();
        return;
      }

      const target = lastContextPosRef.current;
      const prev = localPosRef.current;
      const diff = target - prev;

      if (Math.abs(diff) <= RAF_MIN_DIFF) {
        // close enough; snap and stop
        localPosRef.current = target;
        // ensure labels show exact value
        const now = Date.now();
        if (now - lastLabelUpdateRef.current >= LABEL_UPDATE_THROTTLE_MS) {
          lastLabelUpdateRef.current = now;
          setLocalPos(target);
        } else {
          // if we can't update label now, still schedule a small timeout to ensure eventual sync
          setTimeout(() => setLocalPos(target), LABEL_UPDATE_THROTTLE_MS);
        }
        cancelInterpolationRaf();
        return;
      }

      // Interpolate towards target for smooth 60fps movement
      const next = prev + diff * RAF_INTERPOLATION_FACTOR;
      localPosRef.current = next;

      const now = Date.now();
      if (now - lastLabelUpdateRef.current >= LABEL_UPDATE_THROTTLE_MS) {
        lastLabelUpdateRef.current = now;
        setLocalPos(next);
      }

      rafRef.current = requestAnimationFrame(step);
    };

    // Only start if there's meaningful difference
    if (Math.abs(localPosRef.current - lastContextPosRef.current) > 0.5) {
      rafRef.current = requestAnimationFrame(step);
    }
  };

  // Lightweight label update scheduler during dragging:
  const scheduleLabelUpdate = () => {
    // Only one scheduled frame at a time
    if (labelRafRef.current) return;
    labelRafRef.current = requestAnimationFrame(() => {
      labelRafRef.current = null;
      const now = Date.now();
      if (now - lastLabelUpdateRef.current >= LABEL_UPDATE_THROTTLE_MS) {
        lastLabelUpdateRef.current = now;
        setLocalPos(localPosRef.current);
      }
    });
  };

  // Slider handlers
  const onValueChange = (v: number) => {
    // When user starts dragging, mark seeking (once) to stop interpolation.
    if (!seekingRef.current) {
      seekingRef.current = true;
      setSeeking(true); // keep existing seeking state semantics for other hooks
      // cancel interpolation RAF immediately so native updates are authoritative
      cancelInterpolationRaf();
    }

    // Update fast ref and move native thumb instantly via setNativeProps
    localPosRef.current = v;
    if (sliderRef.current && sliderRef.current.setNativeProps) {
      // (A) Use setNativeProps to avoid re-rendering on every drag move.
      sliderRef.current.setNativeProps({ value: v });
    }

    // Throttle label updates — schedule an RAF that will update React state at most ~20fps
    scheduleLabelUpdate();
  };

  const onSlidingComplete = async (value: number) => {
    // User released the thumb
    seekingRef.current = false;
    setSeeking(false);
    // Ensure any pending label RAF is canceled (we will set final state explicitly)
    cancelLabelRaf();

    // cancel interpolation and let after-seek logic restart it
    cancelInterpolationRaf();

    // perform seek and sync state -> keep optimistic UI elsewhere intact
    if (seek) {
      const finalValue = Math.round(value);
      await seek(finalValue);
      // After seek, update refs and ensure UI labels and native thumb reflect final value.
      lastContextPosRef.current = finalValue;
      localPosRef.current = finalValue;
      // (D) Ensure native thumb snaps to final value
      if (sliderRef.current && sliderRef.current.setNativeProps) {
        sliderRef.current.setNativeProps({ value: finalValue });
      }
      // Update React state once so labels/text/misc re-render (throttled one-off)
      setLocalPos(finalValue);
      // restart interpolation to follow context if needed
      startRafLoop();
    }
  };

  useEffect(() => {
    if (seekingRef.current) {
      // while seeking, cancel the interpolation RAF so the thumb exactly follows finger
      cancelInterpolationRaf();
    } else {
      // when user stops seeking, ensure we follow context
      startRafLoop();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seeking]);

  return (
    <View style={styles.container}>
      <Image source={song?.cover_url ? { uri: String(song.cover_url) } : undefined} style={styles.cover} />
      <Text style={styles.title}>{song?.title}</Text>
      <Text style={styles.artist}>{song?.artist}</Text>

      <View style={styles.controls}>
        <TouchableOpacity onPress={prev}><Text style={styles.control}>⏮</Text></TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            // optimistic UI handled in context; call togglePlay without awaiting
            togglePlay();
          }}
          style={styles.playButton}
        >
          <Text style={styles.playText}>{isPlaying ? '⏸' : '▶'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={next}><Text style={styles.control}>⏭</Text></TouchableOpacity>
      </View>

      <View style={styles.progressRow}>
        <Text style={styles.time}>{formatMillis(seekingRef.current ? localPosRef.current : positionMillis)}</Text>
        <Slider
          ref={sliderRef}
          style={{ flex: 1 }}
          minimumValue={0}
          maximumValue={durationMillis || 0}
          value={localPos} // React-driven, but during drag we move native thumb directly for instant feedback
          minimumTrackTintColor="#2f6dfd"
          maximumTrackTintColor="#ddd"
          thumbTintColor="#2f6dfd"
          onValueChange={onValueChange}
          onSlidingComplete={onSlidingComplete}
        />
        <Text style={styles.time}>{formatMillis(durationMillis)}</Text>
      </View>

      <View style={styles.extraRow}>
        <TouchableOpacity style={styles.smallBtn}><Text>🔁</Text></TouchableOpacity>
        <TouchableOpacity style={styles.smallBtn}><Text>🔀</Text></TouchableOpacity>
      </View>
    </View>
  );
}

function formatMillis(ms: number | null | undefined): string {
  if (!ms) return '0:00';
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

const COVER = Math.min(width - 48, 420);
const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', padding: 20, backgroundColor: '#fff' },
  cover: { width: COVER, height: COVER, borderRadius: 12, backgroundColor: '#eee' },
  title: { marginTop: 18, fontSize: 20, fontWeight: '800' },
  artist: { color: '#666', marginTop: 6 },
  controls: { flexDirection: 'row', alignItems: 'center', marginTop: 18 },
  control: { fontSize: 22, paddingHorizontal: 12 },
  playButton: { marginHorizontal: 10, backgroundColor: '#2f6dfd', padding: 12, borderRadius: 30 },
  playText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  progressRow: { width: '100%', flexDirection: 'row', alignItems: 'center', marginTop: 18 },
  time: { width: 44, textAlign: 'center', color: '#666', fontSize: 12 },
  extraRow: { flexDirection: 'row', marginTop: 20, alignItems: 'center' },
  smallBtn: { padding: 10, marginHorizontal: 8, backgroundColor: '#f3f3f3', borderRadius: 8 },
});