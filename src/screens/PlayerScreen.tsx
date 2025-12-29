import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
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
  withRepeat,
  withSequence,
  Easing,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { usePlayback } from '../contexts/PlaybackContext';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useNavigation } from '@react-navigation/native';
import { DownloadService, DownloadedSong } from '../services/DownloadService';

// Glass UI Components
import AppBackground from '../components/AppBackground';
import GlassCard from '../components/GlassCard';
import PlayButton from '../components/PlayButton';
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
 * Features gradient background, glass cards, and animated play button
 */
export default function PlayerScreen({ route }: PlayerScreenProps) {
  const paramSong = route.params?.song;
  const navigation = useNavigation<PlayerScreenNavProp>();
  const insets = useSafeAreaInsets();
  const { 
    currentSong, 
    isPlaying, 
    positionMillis, 
    durationMillis, 
    play, 
    next, 
    prev, 
    seek, 
    togglePlay,
    shuffleEnabled,
    toggleShuffle,
    repeatMode,
    setRepeatMode
  } = usePlayback();

  // Like state (for UI demo)
  const [isLiked, setIsLiked] = useState(false);
  // Download state
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloaded, setIsDownloaded] = useState(false);

  const song = currentSong ?? paramSong;

  // Check if current song is downloaded
  useEffect(() => {
    if (song?.id) {
      DownloadService.isDownloaded(song.id).then(setIsDownloaded);
    }
  }, [song?.id]);

  const handleDownload = useCallback(async () => {
    if (!song || isDownloaded || isDownloading) return;

    setIsDownloading(true);
    setDownloadProgress(0);

    // Simulate download progress
    const interval = setInterval(() => {
      setDownloadProgress((prev) => {
        if (prev >= 1) {
          clearInterval(interval);
          return 1;
        }
        return prev + 0.1;
      });
    }, 300);

    // Wait for simulation to finish
    await new Promise((resolve) => setTimeout(resolve, 3500));

    const downloadedSong: DownloadedSong = {
      id: song.id,
      title: song.title,
      artist: song.artist ?? undefined,
      cover_url: song.cover_url ?? undefined,
      audio_url: song.audio_url ?? undefined,
      downloaded_at: new Date().toISOString(),
    };

    await DownloadService.saveSong(downloadedSong);
    setIsDownloading(false);
    setIsDownloaded(true);
    setDownloadProgress(0);
  }, [song, isDownloaded, isDownloading]);

  if (!song) {
    return (
      <AppBackground style={{ paddingTop: insets.top, justifyContent: 'center', alignItems: 'center', flex: 1 }}>
        <GlassCard style={{ padding: spacing.lg, alignItems: 'center' }}>
          <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: '600', marginBottom: spacing.sm }}>
            No song playing
          </Text>
          <Text style={{ color: colors.textSecondary, marginBottom: spacing.md }}>
            Select a song from the home screen to play.
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Home')}
            style={{
              backgroundColor: colors.primaryBlue,
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.sm,
              borderRadius: radii.round,
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '600' }}>Go Home</Text>
          </TouchableOpacity>
        </GlassCard>
      </AppBackground>
    );
  }

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

  // Floating animation for artwork
  const floatY = useSharedValue(0);

  useEffect(() => {
    floatY.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 2500, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 2500, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );
  }, []);

  const animatedArtworkStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }));

  const onValueChange = useCallback((v: number) => {
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
  }, [durationMillis, progressShared]);

  const onSlidingComplete = useCallback(async (value: number) => {
    setIsSeeking(false);
    if (seek) {
      await seek(value);
    }
    // ensure shared value syncs to final position
    if (durationMillis && durationMillis > 0) {
      progressShared.value = (value || 0) / durationMillis;
    }
    setDisplayPos(value);
  }, [seek, durationMillis, progressShared]);

  const cycleRepeatMode = useCallback(() => {
    if (repeatMode === 'off') setRepeatMode('all');
    else if (repeatMode === 'all') setRepeatMode('one');
    else setRepeatMode('off');
  }, [repeatMode, setRepeatMode]);

  const handleTogglePlay = useCallback(async () => {
    try {
      if (__DEV__) console.log('PlayerScreen: PlayButton pressed, calling togglePlay()');
      await togglePlay();
      if (__DEV__) console.log('PlayerScreen: togglePlay() returned');
    } catch (e) {
      console.warn('PlayerScreen: togglePlay() error', e);
    }
  }, [togglePlay]);

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

  // Memoized computed values to avoid recalculation on every render
  const sliderMax = useMemo(() => durationMillis || 1, [durationMillis]);
  const progressProp = useMemo(() => (durationMillis ? displayPos / durationMillis : 0), [displayPos, durationMillis]);
  const contentWidth = useMemo(() => width - spacing.xl * 2, [width, spacing.xl]);
  // Calculate cover size based on screen dimensions (memoized)
  const COVER_SIZE = useMemo(() => Math.min(contentWidth, 350), [contentWidth]);

  return (
    <AppBackground>
      {/* Ambient Background Blur */}
      {song?.cover_url && (
        <Image
          source={{ uri: String(song.cover_url) }}
          style={[StyleSheet.absoluteFillObject, { opacity: 0.15 }]}
          blurRadius={80}
        />
      )}
      
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
            <Ionicons name="chevron-down" size={28} color={colors.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>NOW PLAYING</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Artwork - Clean shadow style without glass card wrapper */}
        <Animated.View entering={FadeInDown.duration(400).delay(100)} style={[styles.artworkContainer, animatedArtworkStyle]}>
          <View style={[styles.artworkShadow, { width: COVER_SIZE, height: COVER_SIZE }]}>
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
          </View>
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

        {/* Waveform removed: tightened spacing */}

        {/* Progress Bar */}
        <Animated.View entering={FadeInDown.duration(400).delay(350)} style={styles.progressSection}>
          <View style={styles.progressRow}>
              <ProgressBar 
                progress={progressProp}
                durationMillis={durationMillis}
                isPlaying={isPlaying && !isSeeking}
                width={contentWidth}
                progressShared={progressShared}
              />
              <Slider
                ref={sliderRef}
                style={styles.sliderOverlay}
                minimumValue={0}
                maximumValue={sliderMax}
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
            onPress={toggleShuffle}
            style={styles.controlButton}
            accessibilityLabel={shuffleEnabled ? 'Disable shuffle' : 'Enable shuffle'}
            accessibilityRole="button"
          >
            <Ionicons name="shuffle" size={28} color={shuffleEnabled ? colors.primaryBlue : '#FFFFFF'} />
          </TouchableOpacity>

          {/* Previous */}
          <TouchableOpacity
            onPress={prev}
            style={styles.controlButton}
            accessibilityLabel="Previous track"
            accessibilityRole="button"
          >
            <Ionicons name="play-skip-back" size={32} color={'#FFFFFF'} />
          </TouchableOpacity>

          {/* Play/Pause */}
          <PlayButton
            isPlaying={isPlaying}
            onPress={handleTogglePlay}
            size={80}
            accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
          />

          {/* Next */}
          <TouchableOpacity
            onPress={next}
            style={styles.controlButton}
            accessibilityLabel="Next track"
            accessibilityRole="button"
          >
            <Ionicons name="play-skip-forward" size={32} color={'#FFFFFF'} />
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
              color={repeatMode !== 'off' ? colors.primaryBlue : '#FFFFFF'} 
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

        {/* Bottom Actions Row - Clean floating style */}
        <Animated.View entering={FadeInUp.duration(400).delay(500)} style={styles.actionsContainer}>
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.actionButton}
              accessibilityLabel="View queue"
              accessibilityRole="button"
            >
              <Ionicons name="list" size={26} color={colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setIsLiked(!isLiked)}
              accessibilityLabel={isLiked ? 'Unlike' : 'Like'}
              accessibilityRole="button"
            >
              <Ionicons name={isLiked ? 'heart' : 'heart-outline'} size={26} color={isLiked ? '#FF3B30' : colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleDownload}
              accessibilityLabel={isDownloaded ? "Downloaded" : "Download"}
              accessibilityRole="button"
              disabled={isDownloading || isDownloaded}
            >
              {isDownloading ? (
                <View style={styles.downloadProgressContainer}>
                  <View style={[styles.downloadProgressBar, { height: `${downloadProgress * 100}%` }]} />
                  <Ionicons name="download" size={26} color={colors.primaryBlue} />
                </View>
              ) : (
                <Ionicons 
                  name={isDownloaded ? "checkmark-circle" : "download-outline"} 
                  size={26} 
                  color={isDownloaded ? colors.primaryBlue : colors.textSecondary} 
                />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              accessibilityLabel="Comments"
              accessibilityRole="button"
            >
              <Ionicons name="chatbubble-outline" size={26} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
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
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: colors.textSecondary,
    opacity: 0.8,
  },
  headerSpacer: {
    width: touchTargetMinSize,
  },
  artworkContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    marginTop: spacing.sm,
    // Add subtle bounce/float effect if desired later
  },
  artworkShadow: {
    shadowColor: colors.primaryBlue, // Colored shadow for more pop
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.35,
    shadowRadius: 35,
    elevation: 24,
    borderRadius: radii.xxl,
    backgroundColor: '#fff',
  },
  artwork: {
    borderRadius: radii.xxl,
    backgroundColor: colors.glassBackground,
  },
  artworkPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
  },
  artworkPlaceholderText: {
    fontSize: 64,
    color: colors.textMuted,
  },
  songInfo: {
    alignItems: 'center',
    marginBottom: spacing.xxl, // More space below info
    paddingHorizontal: spacing.xl,
    width: '100%',
  },
  title: {
    fontSize: 28, // Larger title
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.8,
  },
  artist: {
    fontSize: 18,
    fontWeight: '600', // Slightly bolder
    color: colors.primaryBlue, // Accent color for artist
    textAlign: 'center',
    opacity: 0.9,
  },
  progressSection: {
    width: '100%',
    marginBottom: spacing.lg,
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
    paddingHorizontal: spacing.lg, // Increased padding
  },
  controlButton: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.2)', // Glassy background
  },
  controlIcon: {
    fontSize: 22,
    color: '#FFFFFF',
  },
  controlIconLarge: {
    fontSize: 28,
    color: colors.textPrimary,
  },
  controlIconActive: {
    color: colors.primaryBlue,
  },
  actionsContainer: {
    width: '100%',
    paddingHorizontal: spacing.xl,
    marginTop: spacing.sm,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between', // Spread out more
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.5)', // Subtle circle background
  },
  actionIcon: {
    fontSize: 22,
    marginBottom: spacing.xs,
  },
  actionLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  downloadProgressContainer: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  downloadProgressBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(47, 128, 237, 0.2)',
    borderRadius: 4,
  },
});