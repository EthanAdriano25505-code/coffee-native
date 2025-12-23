/**
 * PlayerScreen
 * Full-screen music player with animations using react-native-reanimated.
 * Provides play/pause toggle, progress tracking, and track info display.
 * 
 * TODO: Wire to Supabase audio data
 * - Load track metadata from Supabase
 * - Stream audio via Supabase storage
 * - Sync playback progress to UI
 */
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, Image, StyleSheet, Dimensions, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { usePlayback } from '../contexts/PlaybackContext';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/types';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing, radii, durations, springConfig, hitSlop, iconSizes } from '../utils/tokens';
import PlayButton from '../components/PlayButton';
import Waveform from '../components/Waveform';

const { width } = Dimensions.get('window');

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

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

  // Animated values for cover image and controls
  const coverScale = useSharedValue(1);
  const controlsOpacity = useSharedValue(1);

  // Animate cover when song changes
  useEffect(() => {
    coverScale.value = withSpring(1, springConfig.bouncy);
    controlsOpacity.value = withTiming(1, { duration: durations.normal });
  }, [song?.id, coverScale, controlsOpacity]);

  const animatedCoverStyle = useAnimatedStyle(() => ({
    transform: [{ scale: coverScale.value }],
  }));

  // Control button press animations
  const prevScale = useSharedValue(1);
  const nextScale = useSharedValue(1);

  const handlePrevPressIn = () => {
    prevScale.value = withSpring(0.9, springConfig.snappy);
  };
  const handlePrevPressOut = () => {
    prevScale.value = withSpring(1, springConfig.snappy);
  };
  const handleNextPressIn = () => {
    nextScale.value = withSpring(0.9, springConfig.snappy);
  };
  const handleNextPressOut = () => {
    nextScale.value = withSpring(1, springConfig.snappy);
  };

  const animatedPrevStyle = useAnimatedStyle(() => ({
    transform: [{ scale: prevScale.value }],
  }));
  const animatedNextStyle = useAnimatedStyle(() => ({
    transform: [{ scale: nextScale.value }],
  }));

  return (
    <View style={styles.container}>
      {/* Album artwork with animated scale */}
      <Animated.View style={animatedCoverStyle}>
        <Image 
          source={song?.cover_url ? { uri: String(song.cover_url) } : undefined} 
          style={styles.cover} 
        />
      </Animated.View>

      {/* Track info */}
      <Text style={styles.title}>{song?.title}</Text>
      <Text style={styles.artist}>{song?.artist}</Text>

      {/* Waveform visualization */}
      <View style={styles.waveformContainer}>
        <Waveform 
          isAnimating={isPlaying} 
          barCount={7}
          maxHeight={32}
          minHeight={8}
        />
      </View>

      {/* Playback controls */}
      <View style={styles.controls}>
        <AnimatedPressable 
          onPress={prev}
          onPressIn={handlePrevPressIn}
          onPressOut={handlePrevPressOut}
          hitSlop={hitSlop}
          style={[styles.controlButton, animatedPrevStyle]}
          accessibilityLabel="Previous track"
          accessibilityRole="button"
        >
          <Ionicons name="play-skip-back" size={iconSizes.lg} color={colors.text} />
        </AnimatedPressable>

        <PlayButton 
          isPlaying={isPlaying} 
          onToggle={togglePlay}
          size={64}
        />

        <AnimatedPressable 
          onPress={next}
          onPressIn={handleNextPressIn}
          onPressOut={handleNextPressOut}
          hitSlop={hitSlop}
          style={[styles.controlButton, animatedNextStyle]}
          accessibilityLabel="Next track"
          accessibilityRole="button"
        >
          <Ionicons name="play-skip-forward" size={iconSizes.lg} color={colors.text} />
        </AnimatedPressable>
      </View>

      {/* Progress slider */}
      <View style={styles.progressRow}>
        <Text style={styles.time}>{formatMillis(seekingRef.current ? localPosRef.current : positionMillis)}</Text>
        <Slider
          ref={sliderRef}
          style={styles.slider}
          minimumValue={0}
          maximumValue={durationMillis || 0}
          value={localPos}
          minimumTrackTintColor={colors.primary}
          maximumTrackTintColor={colors.trackBackground}
          thumbTintColor={colors.primary}
          onValueChange={onValueChange}
          onSlidingComplete={onSlidingComplete}
        />
        <Text style={styles.time}>{formatMillis(durationMillis)}</Text>
      </View>

      {/* Extra controls (repeat, shuffle) */}
      <View style={styles.extraRow}>
        <Pressable 
          style={styles.smallBtn} 
          hitSlop={hitSlop}
          accessibilityLabel="Repeat"
          accessibilityRole="button"
        >
          <Ionicons name="repeat" size={iconSizes.md} color={colors.textSecondary} />
        </Pressable>
        <Pressable 
          style={styles.smallBtn} 
          hitSlop={hitSlop}
          accessibilityLabel="Shuffle"
          accessibilityRole="button"
        >
          <Ionicons name="shuffle" size={iconSizes.md} color={colors.textSecondary} />
        </Pressable>
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
  container: { 
    flex: 1, 
    alignItems: 'center', 
    padding: spacing.xl, 
    backgroundColor: colors.background,
  },
  cover: { 
    width: COVER, 
    height: COVER, 
    borderRadius: radii.md, 
    backgroundColor: colors.surface,
  },
  title: { 
    marginTop: spacing.lg, 
    fontSize: 20, 
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  artist: { 
    color: colors.textSecondary, 
    marginTop: spacing.sm,
    fontSize: 14,
    textAlign: 'center',
  },
  waveformContainer: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    height: 40,
    justifyContent: 'center',
  },
  controls: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginTop: spacing.lg,
    gap: spacing.xl,
  },
  controlButton: { 
    padding: spacing.md,
  },
  progressRow: { 
    width: '100%', 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginTop: spacing.lg,
  },
  slider: {
    flex: 1,
    marginHorizontal: spacing.sm,
  },
  time: { 
    width: 44, 
    textAlign: 'center', 
    color: colors.textSecondary, 
    fontSize: 12,
  },
  extraRow: { 
    flexDirection: 'row', 
    marginTop: spacing.xl, 
    alignItems: 'center',
    gap: spacing.lg,
  },
  smallBtn: { 
    padding: spacing.md, 
    backgroundColor: colors.surface, 
    borderRadius: radii.sm,
  },
});