import React, { useCallback, useMemo, useState } from 'react';
import { Dimensions, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { RouteProp } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { usePlayback } from '../contexts/PlaybackContext';
import AppBackground from '../components/common/AppBackground';
import GlassCard from '../components/common/GlassCard';
import PlayButton from '../components/player/PlayButton';
import Waveform from '../components/player/Waveform';
import ProgressBar from '../components/player/ProgressBar';
import MiniPlayer from '../components/player/MiniPlayer';
import { colors, spacing, radii, typography } from '../design/tokens';
import { Search, Shuffle, SkipBack, SkipForward, Repeat, Heart, List, Download, MessageCircle } from 'lucide-react-native';
import type { RootStackParamList } from '../navigation/types';

const { width } = Dimensions.get('window');

type RepeatMode = 'off' | 'all' | 'one';

export default function PlayerScreen({ route }: { route: RouteProp<RootStackParamList, 'Player'> }) {
  const navSong: any = route.params?.song;
  const { currentSong, isPlaying, positionMillis, durationMillis, play, next, prev, seek, togglePlay } = usePlayback();

  // Ensure the clicked song is loaded and playing (no dummy data)
  useFocusEffect(
    useCallback(() => {
      if (navSong && currentSong?.id !== navSong.id) {
        play({
          id: navSong.id,
          title: navSong.title,
          artist: navSong.artist ?? null,
          cover_url: navSong.artworkUrl ?? navSong.cover_url ?? null,
          uri: navSong.streamUrl ? { uri: navSong.streamUrl } : navSong.uri,
        } as any);
      }
    }, [navSong?.id, currentSong?.id])
  );

  const song = useMemo(() => currentSong ?? navSong, [currentSong, navSong]);

  // Controls local state
  const [shuffle, setShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('off');
  const [liked, setLiked] = useState(false);

  const progressPercent = durationMillis ? Math.min(100, Math.max(0, (positionMillis / durationMillis) * 100)) : 0;

  const onRepeatCycle = () => {
    setRepeatMode((m) => (m === 'off' ? 'all' : m === 'all' ? 'one' : 'off'));
  };

  const formattedLeft = formatMillis(positionMillis);
  const formattedRight = formatMillis(durationMillis);

  return (
    <AppBackground>
      <View style={styles.screen}>
        {/* Header card */}
        <GlassCard radius={radii.card24} intensity={24} style={styles.headerCard}>
          <View style={styles.headerRow}>
            <Text style={styles.nowPlaying}>Now Playing</Text>
            <Pressable accessibilityLabel="Search" style={({ pressed }) => [styles.iconGlass, { transform: [{ scale: pressed ? 0.96 : 1 }] }]}>
              <Search color={colors.textPrimary} size={18} />
            </Pressable>
          </View>
        </GlassCard>

        {/* Album banner card */}
        <GlassCard radius={radii.card28} intensity={26} style={styles.albumCard}>
          <View style={styles.albumInner}>
            {/* Subtle radial accent behind artwork */}
            <View style={styles.accentGlow} />
            <Image source={song?.cover_url ? { uri: String(song.cover_url) } : undefined} style={styles.albumArt} />
          </View>
        </GlassCard>

        {/* Main player card */}
        <GlassCard radius={radii.card24} intensity={24} style={styles.mainCard} borderOpacity={0.25}>
          <View style={{ gap: spacing.x16 }}>
            <View>
              <Text style={styles.title}>{song?.title ?? ''}</Text>
              <Text style={styles.artist}>{song?.artist ?? ''}</Text>
            </View>

            <Waveform bars={40} progressPercent={progressPercent} isPlaying={!!isPlaying} />

            <View style={{ gap: spacing.x8 }}>
              <ProgressBar progress={progressPercent} buffered={Math.min(100, progressPercent + 10)} onSeek={(p) => {
                if (!durationMillis) return;
                const target = Math.round((p / 100) * durationMillis);
                seek(target);
              }} />
              <View style={styles.timeRow}>
                <Text style={styles.time}>{formattedLeft}</Text>
                <Text style={styles.time}>{formattedRight}</Text>
              </View>
            </View>

            {/* Controls row */}
            <View style={styles.controlsRow}>
              <Pressable accessibilityLabel="Toggle shuffle" onPress={() => setShuffle((s) => !s)} style={({ pressed }) => [styles.ctrlBtn, { transform: [{ scale: pressed ? 0.96 : 1 }], opacity: shuffle ? 1 : 0.9 }]}>
                <Shuffle color={colors.textPrimary} size={22} />
              </Pressable>

              <Pressable accessibilityLabel="Previous" onPress={prev} style={({ pressed }) => [styles.ctrlBtn, { transform: [{ scale: pressed ? 0.96 : 1 }] }]}>
                <SkipBack color={colors.textPrimary} size={22} />
              </Pressable>

              <PlayButton size={80} isPlaying={!!isPlaying} onToggle={() => togglePlay(song as any)} accessibilityLabel={isPlaying ? 'Pause' : 'Play'} />

              <Pressable accessibilityLabel="Next" onPress={next} style={({ pressed }) => [styles.ctrlBtn, { transform: [{ scale: pressed ? 0.96 : 1 }] }]}>
                <SkipForward color={colors.textPrimary} size={22} />
              </Pressable>

              <Pressable accessibilityLabel={`Repeat ${repeatMode}`} onPress={onRepeatCycle} style={({ pressed }) => [styles.ctrlBtn, { transform: [{ scale: pressed ? 0.96 : 1 }] }] }>
                <View>
                  <Repeat color={colors.textPrimary} size={22} />
                  {repeatMode === 'one' && <View style={styles.repeatBadge}><Text style={styles.repeatBadgeText}>1</Text></View>}
                </View>
              </Pressable>
            </View>

            {/* Bottom actions */}
            <View style={styles.actionsRow}>
              <Pressable accessibilityLabel="Queue" style={({ pressed }) => [styles.actionBtn, { transform: [{ scale: pressed ? 0.96 : 1 }] }]}>
                <List color={colors.textPrimary} size={18} />
              </Pressable>
              <Pressable accessibilityLabel="Like" onPress={() => setLiked((l) => !l)} style={({ pressed }) => [styles.actionBtn, { transform: [{ scale: pressed ? 0.96 : 1 }] }]}>
                <Heart color={liked ? colors.primaryBlue : colors.textPrimary} fill={liked ? colors.primaryBlue : 'none'} size={18} />
              </Pressable>
              <Pressable accessibilityLabel="Download" style={({ pressed }) => [styles.actionBtn, { transform: [{ scale: pressed ? 0.96 : 1 }] }]}>
                <Download color={colors.textPrimary} size={18} />
              </Pressable>
              <Pressable accessibilityLabel="Comments" style={({ pressed }) => [styles.actionBtn, { transform: [{ scale: pressed ? 0.96 : 1 }] }]}>
                <MessageCircle color={colors.textPrimary} size={18} />
              </Pressable>
            </View>
          </View>
        </GlassCard>

        {/* Mini player at bottom */}
        {song && (
          <View style={styles.miniContainer}>
            <MiniPlayer
              title={song.title}
              artist={song.artist}
              artworkUrl={song.cover_url ?? undefined}
              progress={progressPercent}
              isPlaying={!!isPlaying}
              onToggle={() => togglePlay(song as any)}
              onNext={next}
            />
          </View>
        )}
      </View>
    </AppBackground>
  );
}

function formatMillis(ms?: number | null): string {
  if (!ms || ms <= 0) return '0:00';
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

const COVER = Math.min(width - 48, 420);

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: spacing.x16,
    gap: spacing.x16,
  },
  headerCard: {
    padding: spacing.x16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nowPlaying: {
    ...typography.title,
    fontSize: 18,
  },
  iconGlass: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  albumCard: {
    padding: spacing.x16,
  },
  albumInner: {
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  accentGlow: {
    position: 'absolute',
    left: '25%',
    top: '55%',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: colors.primaryBlue,
    opacity: 0.18,
    filter: undefined,
  },
  albumArt: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  mainCard: {
    padding: spacing.x16,
  },
  title: {
    ...typography.title,
    fontSize: 22,
  },
  artist: {
    ...typography.artist,
    marginTop: 4,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  time: {
    ...typography.time,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.x8,
  },
  ctrlBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  repeatBadge: {
    position: 'absolute',
    right: 4,
    top: 4,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 2,
    borderRadius: 8,
    backgroundColor: colors.primaryBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  repeatBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.x8,
  },
  actionBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniContainer: {
    marginTop: spacing.x16,
  },
});