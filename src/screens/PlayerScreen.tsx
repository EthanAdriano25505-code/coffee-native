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
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  FadeInUp,
  useSharedValue,
  withTiming,
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
import ProgressBar from '../components/ProgressBar';

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

  // Use a shared value to drive progress visuals without forcing React re-renders
  const progressShared = useSharedValue(0);
  const [displayPos, setDisplayPos] = useState<number>(positionMillis ?? 0);
  const [isSeeking, setIsSeeking] = useState(false);
  const sliderRef = useRef<any>(null);
  const lastUpdateRef = useRef<number>(0);

  // Sync shared value from playback context when not seeking
  useEffect(() => {
    if (!durationMillis) return;
    if (!isSeeking) {
      const pos = positionMillis ?? 0;
      const pct = durationMillis ? pos / durationMillis : 0;
      // cancel any existing animation
      try { progressShared.value && (progressShared.value = pct); } catch (e) {}

      // If currently playing, animate the shared value on the UI thread to the end
      if (isPlaying && durationMillis && durationMillis > 0) {
        const remaining = Math.max(0, (durationMillis ?? 0) - pos);
        // set immediate sync then animate to 1 over remaining time
        progressShared.value = pct;
        progressShared.value = withTiming(1, { duration: remaining > 0 ? remaining : 200 });
      } else {
        // not playing: gently snap to the exact position
        progressShared.value = withTiming(pct, { duration: 200 });
      }

      // reflect occasional UI label updates
      setDisplayPos(pos);
      // also update native slider value (infrequent) to keep control in sync
      try {
        if (sliderRef.current && sliderRef.current.setNativeProps) {
          sliderRef.current.setNativeProps({ value: positionMillis ?? 0 });
        }
      } catch (e) {}
    }
  }, [positionMillis, durationMillis, isSeeking, progressShared]);

  const onValueChange = (v: number) => {
    setIsSeeking(true);
    // drive shared value (0..1) for smooth visuals without rerender
    if (durationMillis && durationMillis > 0) {
      progressShared.value = v / durationMillis;
    }
    // throttle label updates (avoid heavy re-renders)
    const now = Date.now();
    if (now - lastUpdateRef.current > 100) {
      setDisplayPos(v);
      lastUpdateRef.current = now;
    }
  };

  const onSlidingComplete = async (value: number) => {
    setIsSeeking(false);
    if (seek) {
      await seek(value);
    }
    // ensure shared value syncs to final position
    if (durationMillis && durationMillis > 0) {
      progressShared.value = (value || 0) / durationMillis;
    }
    setDisplayPos(value);
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
  const progress = durationMillis ? displayPos / durationMillis : 0;

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
            <Ionicons name="chevron-down" size={32} color={colors.textPrimary} />
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
                <Ionicons name="musical-note" size={80} color={colors.textMuted} />
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
            progress={0}
            progressValue={progressShared}
            width={width - spacing.xl * 2}
            height={50}
            isPlaying={isPlaying}
          />
        </Animated.View>

        {/* Progress Bar */}
        <Animated.View entering={FadeInDown.duration(400).delay(350)} style={styles.progressSection}>
          <View style={styles.progressRow}>
              <ProgressBar 
                progress={durationMillis ? (displayPos) / durationMillis : 0}
                durationMillis={durationMillis}
                isPlaying={isPlaying && !isSeeking}
                width={width - spacing.xl * 2}
                progressShared={progressShared}
              />
              <Slider
                ref={sliderRef}
                style={styles.sliderOverlay}
                minimumValue={0}
                maximumValue={durationMillis || 1}
                // leave slider uncontrolled to avoid rerenders; native thumb moves by itself
                minimumTrackTintColor="transparent"
                maximumTrackTintColor="transparent"
                thumbTintColor="transparent"
                onValueChange={onValueChange}
                onSlidingComplete={onSlidingComplete}
              />
            </View>
          <View style={styles.timeRow}>
            <Text style={styles.time}>{formatMillis(displayPos)}</Text>
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
            <Ionicons name="shuffle" size={28} color={shuffleEnabled ? colors.primaryBlue : colors.controlInactive} />
          </TouchableOpacity>

          {/* Previous */}
          <TouchableOpacity
            onPress={prev}
            style={styles.controlButton}
            accessibilityLabel="Previous track"
            accessibilityRole="button"
          >
            <Ionicons name="play-skip-back" size={32} color={colors.textPrimary} />
          </TouchableOpacity>

          {/* Play/Pause */}
          <PlayButton
            isPlaying={isPlaying}
            onPress={async () => {
              try {
                if (__DEV__) console.log('PlayerScreen: PlayButton pressed, calling togglePlay()');
                await togglePlay();
                if (__DEV__) console.log('PlayerScreen: togglePlay() returned');
              } catch (e) {
                console.warn('PlayerScreen: togglePlay() error', e);
              }
            }}
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
            <Ionicons name="play-skip-forward" size={32} color={colors.textPrimary} />
          </TouchableOpacity>

          {/* Repeat */}
          <TouchableOpacity
            onPress={cycleRepeatMode}
            style={styles.controlButton}
            accessibilityLabel={`Repeat mode: ${repeatMode}`}
            accessibilityRole="button"
          >
            <Ionicons 
              name="repeat" 
              size={28} 
              color={repeatMode !== 'off' ? colors.primaryBlue : colors.controlInactive} 
            />
            {repeatMode === 'one' && (
              <View style={{ 
                position: 'absolute', 
                top: '50%', 
                left: '50%', 
                marginTop: -6,
                marginLeft: -4,
              }}>
                <Text style={{ fontSize: 10, fontWeight: 'bold', color: colors.primaryBlue }}>1</Text>
              </View>
            )}
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
                <Ionicons name="list" size={24} color={colors.textPrimary} style={{ marginBottom: spacing.xs }} />
                <Text style={styles.actionLabel}>Queue</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => setIsLiked(!isLiked)}
                accessibilityLabel={isLiked ? 'Unlike' : 'Like'}
                accessibilityRole="button"
              >
                <Ionicons name={isLiked ? 'heart' : 'heart-outline'} size={24} color={isLiked ? '#FF3B30' : colors.textPrimary} style={{ marginBottom: spacing.xs }} />
                <Text style={styles.actionLabel}>Like</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                accessibilityLabel="Download"
                accessibilityRole="button"
              >
                <Ionicons name="download-outline" size={24} color={colors.textPrimary} style={{ marginBottom: spacing.xs }} />
                <Text style={styles.actionLabel}>Download</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                accessibilityLabel="Comments"
                accessibilityRole="button"
              >
                <Ionicons name="chatbubble-outline" size={24} color={colors.textPrimary} style={{ marginBottom: spacing.xs }} />
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
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderOverlay: {
    position: 'absolute',
    width: '100%',
    height: 40,
    zIndex: 10,
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