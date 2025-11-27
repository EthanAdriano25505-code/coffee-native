import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  Platform,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import { usePlayback } from '../contexts/PlaybackContext';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

// Glass UI Components
import AppBackground from '../components/AppBackground';
import GlassCard from '../components/GlassCard';
import PlayButton from '../components/PlayButton';
import Waveform from '../components/Waveform';

// Design tokens
import {
  colors,
  spacing,
  radii,
  typography,
  touchTargetMinSize,
  shadows,
} from '../utils/tokens';

const { width, height } = Dimensions.get('window');

type PlayerScreenNavProp = NativeStackNavigationProp<RootStackParamList, 'Player'>;

interface PlayerScreenProps {
  route: RouteProp<RootStackParamList, 'Player'>;
}

/**
 * PlayerScreen - Full player with liquid glass UI design
 * Features gradient background, glass cards, animated play button, and waveform visualization
 */
export default function PlayerScreen({ route }: PlayerScreenProps) {
  const paramSong = route.params?.song;
  const navigation = useNavigation<PlayerScreenNavProp>();
  const insets = useSafeAreaInsets();
  const { currentSong, isPlaying, positionMillis, durationMillis, play, next, prev, seek, togglePlay } = usePlayback();

  // Repeat mode state: 'off' | 'all' | 'one'
  const [repeatMode, setRepeatMode] = useState<'off' | 'all' | 'one'>('off');
  // Shuffle state
  const [shuffleEnabled, setShuffleEnabled] = useState(false);
  // Like state (for UI demo)
  const [isLiked, setIsLiked] = useState(false);

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
    }, [paramSong?.id, currentSong?.id, paramSong, currentSong, play])
  );

  const song = currentSong ?? paramSong;

  // Local slider state for smooth UI (labels and final thumb sync)
  const [localPos, setLocalPos] = useState<number>(positionMillis ?? 0);

  // Fast refs & RAFs for smooth updates without re-rendering on every drag
  const sliderRef = useRef<any>(null);
  const seekingRef = useRef<boolean>(false);
  const localPosRef = useRef<number>(positionMillis ?? 0);
  const rafRef = useRef<number | null>(null);
  const labelRafRef = useRef<number | null>(null);
  const lastContextPosRef = useRef<number>(positionMillis ?? 0);
  const lastLabelUpdateRef = useRef<number>(0);

  const RAF_INTERPOLATION_FACTOR = 0.25;
  const RAF_MIN_DIFF = 0.5;
  const LABEL_UPDATE_THROTTLE_MS = 50;

  useEffect(() => {
    lastContextPosRef.current = positionMillis ?? 0;

    if (!seekingRef.current) {
      startRafLoop();
    }

    if (!isPlaying && Math.abs(localPosRef.current - lastContextPosRef.current) < 1) {
      localPosRef.current = lastContextPosRef.current;
      setLocalPos(lastContextPosRef.current);
      cancelInterpolationRaf();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [positionMillis, isPlaying]);

  useEffect(() => {
    return () => {
      cancelAllRafs();
    };
  }, []);

  const cancelInterpolationRaf = () => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

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

  const startRafLoop = () => {
    cancelInterpolationRaf();

    if (seekingRef.current) return;

    const step = () => {
      if (seekingRef.current) {
        cancelInterpolationRaf();
        return;
      }

      const target = lastContextPosRef.current;
      const prevVal = localPosRef.current;
      const diff = target - prevVal;

      if (Math.abs(diff) <= RAF_MIN_DIFF) {
        localPosRef.current = target;
        const now = Date.now();
        if (now - lastLabelUpdateRef.current >= LABEL_UPDATE_THROTTLE_MS) {
          lastLabelUpdateRef.current = now;
          setLocalPos(target);
        } else {
          setTimeout(() => setLocalPos(target), LABEL_UPDATE_THROTTLE_MS);
        }
        cancelInterpolationRaf();
        return;
      }

      const nextVal = prevVal + diff * RAF_INTERPOLATION_FACTOR;
      localPosRef.current = nextVal;

      const now = Date.now();
      if (now - lastLabelUpdateRef.current >= LABEL_UPDATE_THROTTLE_MS) {
        lastLabelUpdateRef.current = now;
        setLocalPos(nextVal);
      }

      rafRef.current = requestAnimationFrame(step);
    };

    if (Math.abs(localPosRef.current - lastContextPosRef.current) > 0.5) {
      rafRef.current = requestAnimationFrame(step);
    }
  };

  const scheduleLabelUpdate = () => {
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

  const onValueChange = (v: number) => {
    if (!seekingRef.current) {
      seekingRef.current = true;
      cancelInterpolationRaf();
    }

    localPosRef.current = v;
    if (sliderRef.current && sliderRef.current.setNativeProps) {
      sliderRef.current.setNativeProps({ value: v });
    }

    scheduleLabelUpdate();
  };

  const onSlidingComplete = async (value: number) => {
    seekingRef.current = false;
    cancelLabelRaf();
    cancelInterpolationRaf();

    if (seek) {
      const finalValue = Math.round(value);
      await seek(finalValue);
      lastContextPosRef.current = finalValue;
      localPosRef.current = finalValue;
      if (sliderRef.current && sliderRef.current.setNativeProps) {
        sliderRef.current.setNativeProps({ value: finalValue });
      }
      setLocalPos(finalValue);
      startRafLoop();
    }
  };

  const cycleRepeatMode = () => {
    setRepeatMode((prev) => {
      if (prev === 'off') return 'all';
      if (prev === 'all') return 'one';
      return 'off';
    });
  };

  const getRepeatIcon = () => {
    switch (repeatMode) {
      case 'all':
        return '🔁';
      case 'one':
        return '🔂';
      default:
        return '🔁';
    }
  };

  // Calculate progress for waveform
  const progress = durationMillis ? localPos / durationMillis : 0;

  // Calculate cover size based on screen dimensions
  const COVER_SIZE = Math.min(width - spacing.xl * 2 - spacing.lg * 2, 320);

  return (
    <AppBackground>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.xxl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with back button */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Now Playing</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Artwork Card with Glass Effect */}
        <Animated.View entering={FadeInDown.duration(400).delay(100)}>
          <GlassCard style={[styles.artworkCard, { width: COVER_SIZE + spacing.lg * 2 }]}>
            {song?.cover_url ? (
              <Image
                source={{ uri: String(song.cover_url) }}
                style={[styles.artwork, { width: COVER_SIZE, height: COVER_SIZE }]}
                accessibilityLabel={`Album artwork for ${song.title}`}
              />
            ) : (
              <View style={[styles.artwork, styles.artworkPlaceholder, { width: COVER_SIZE, height: COVER_SIZE }]}>
                <Text style={styles.artworkPlaceholderText}>♪</Text>
              </View>
            )}
          </GlassCard>
        </Animated.View>

        {/* Song Info */}
        <Animated.View entering={FadeInDown.duration(400).delay(200)} style={styles.songInfo}>
          <Text style={styles.title} numberOfLines={1}>
            {song?.title || 'Unknown Title'}
          </Text>
          <Text style={styles.artist} numberOfLines={1}>
            {song?.artist || 'Unknown Artist'}
          </Text>
        </Animated.View>

        {/* Waveform Visualization */}
        <Animated.View entering={FadeInDown.duration(400).delay(300)} style={styles.waveformContainer}>
          <Waveform
            progress={progress}
            width={width - spacing.xl * 2}
            height={50}
          />
        </Animated.View>

        {/* Progress Bar */}
        <Animated.View entering={FadeInDown.duration(400).delay(350)} style={styles.progressSection}>
          <View style={styles.progressRow}>
            <Slider
              ref={sliderRef}
              style={styles.slider}
              minimumValue={0}
              maximumValue={durationMillis || 1}
              value={localPos}
              minimumTrackTintColor={colors.primaryBlue}
              maximumTrackTintColor={colors.progressTrack}
              thumbTintColor={colors.textWhite}
              onValueChange={onValueChange}
              onSlidingComplete={onSlidingComplete}
            />
          </View>
          <View style={styles.timeRow}>
            <Text style={styles.time}>{formatMillis(localPos)}</Text>
            <Text style={styles.time}>{formatMillis(durationMillis)}</Text>
          </View>
        </Animated.View>

        {/* Main Controls */}
        <Animated.View entering={FadeInUp.duration(400).delay(400)} style={styles.controlsContainer}>
          {/* Shuffle */}
          <TouchableOpacity
            onPress={() => setShuffleEnabled(!shuffleEnabled)}
            style={styles.controlButton}
            accessibilityLabel={shuffleEnabled ? 'Disable shuffle' : 'Enable shuffle'}
            accessibilityRole="button"
          >
            <Text style={[styles.controlIcon, shuffleEnabled && styles.controlIconActive]}>🔀</Text>
          </TouchableOpacity>

          {/* Previous */}
          <TouchableOpacity
            onPress={prev}
            style={styles.controlButton}
            accessibilityLabel="Previous track"
            accessibilityRole="button"
          >
            <Text style={styles.controlIconLarge}>⏮</Text>
          </TouchableOpacity>

          {/* Play/Pause */}
          <PlayButton
            isPlaying={isPlaying}
            onPress={togglePlay}
            size={72}
            accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
          />

          {/* Next */}
          <TouchableOpacity
            onPress={next}
            style={styles.controlButton}
            accessibilityLabel="Next track"
            accessibilityRole="button"
          >
            <Text style={styles.controlIconLarge}>⏭</Text>
          </TouchableOpacity>

          {/* Repeat */}
          <TouchableOpacity
            onPress={cycleRepeatMode}
            style={styles.controlButton}
            accessibilityLabel={`Repeat mode: ${repeatMode}`}
            accessibilityRole="button"
          >
            <Text style={[styles.controlIcon, repeatMode !== 'off' && styles.controlIconActive]}>
              {getRepeatIcon()}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Bottom Actions Row */}
        <Animated.View entering={FadeInUp.duration(400).delay(500)}>
          <GlassCard style={styles.actionsCard}>
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={styles.actionButton}
                accessibilityLabel="View queue"
                accessibilityRole="button"
              >
                <Text style={styles.actionIcon}>📃</Text>
                <Text style={styles.actionLabel}>Queue</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => setIsLiked(!isLiked)}
                accessibilityLabel={isLiked ? 'Unlike' : 'Like'}
                accessibilityRole="button"
              >
                <Text style={styles.actionIcon}>{isLiked ? '❤️' : '🤍'}</Text>
                <Text style={styles.actionLabel}>Like</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                accessibilityLabel="Download"
                accessibilityRole="button"
              >
                <Text style={styles.actionIcon}>⬇️</Text>
                <Text style={styles.actionLabel}>Download</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                accessibilityLabel="Comments"
                accessibilityRole="button"
              >
                <Text style={styles.actionIcon}>💬</Text>
                <Text style={styles.actionLabel}>Comments</Text>
              </TouchableOpacity>
            </View>
          </GlassCard>
        </Animated.View>
      </ScrollView>
    </AppBackground>
  );
}

function formatMillis(ms: number | null | undefined): string {
  if (!ms) return '0:00';
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: spacing.xl,
  },
  backButton: {
    width: touchTargetMinSize,
    height: touchTargetMinSize,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: colors.textPrimary,
  },
  headerTitle: {
    ...typography.subtitle,
    color: colors.textSecondary,
  },
  headerSpacer: {
    width: touchTargetMinSize,
  },
  artworkCard: {
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  artwork: {
    borderRadius: radii.lg,
    backgroundColor: colors.glassBackground,
  },
  artworkPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  artworkPlaceholderText: {
    fontSize: 64,
    color: colors.textMuted,
  },
  songInfo: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    width: '100%',
  },
  title: {
    ...typography.title,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  artist: {
    ...typography.subtitle,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  waveformContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  progressSection: {
    width: '100%',
    marginBottom: spacing.xl,
  },
  progressRow: {
    width: '100%',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
  },
  time: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: spacing.xxl,
    paddingHorizontal: spacing.md,
  },
  controlButton: {
    width: touchTargetMinSize,
    height: touchTargetMinSize,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlIcon: {
    fontSize: 22,
    color: colors.controlInactive,
  },
  controlIconLarge: {
    fontSize: 28,
    color: colors.textPrimary,
  },
  controlIconActive: {
    color: colors.primaryBlue,
  },
  actionsCard: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    width: width - spacing.xl * 2,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: touchTargetMinSize,
    minHeight: touchTargetMinSize,
    paddingVertical: spacing.sm,
  },
  actionIcon: {
    fontSize: 22,
    marginBottom: spacing.xs,
  },
  actionLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});