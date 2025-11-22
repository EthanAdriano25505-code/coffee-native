import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable, useColorScheme } from 'react-native';
import GlassView from './GlassView';
import RemoteImage from './RemoteImage';
import { spacing, radii, glass, getColors } from '../theme/designTokens';

type Song = {
  id: string | number;
  title: string;
  artist?: string | null;
  cover_url?: string | null;
};

type Props = {
  song: Song;
  isPlaying: boolean;
  progressPercent?: number;
  onPress?: () => void;
  onPlayPause?: () => void;
  onNext?: () => void;
  onPrev?: () => void;
};

export default function MiniPlayerOverlay({
  song,
  isPlaying,
  progressPercent = 0,
  onPress,
  onPlayPause,
  onNext,
  onPrev,
}: Props) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = getColors(isDark);

  return (
    <Pressable onPress={onPress} style={styles.container}>
      <GlassView
        intensity={isDark ? glass.intensityAndroid : glass.intensityIOS}
        tint={isDark ? 'dark' : 'light'}
        style={styles.glassContainer}
      >
        <View style={styles.content}>
          <View style={styles.leftSection}>
            <RemoteImage
              uri={song.cover_url}
              width={56}
              height={56}
              style={styles.artwork}
              placeholderText="♪"
            />
            <View style={styles.metadata}>
              <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
                {song.title}
              </Text>
              <Text style={[styles.artist, { color: colors.textSecondary }]} numberOfLines={1}>
                {song.artist || 'Unknown Artist'}
              </Text>
              {/* Progress bar */}
              <View style={[styles.progressContainer, { backgroundColor: colors.border }]}>
                <View
                  style={[
                    styles.progressBar,
                    { width: `${Math.min(progressPercent, 100)}%`, backgroundColor: colors.primary },
                  ]}
                />
              </View>
            </View>
          </View>

          <View style={styles.controls}>
            <TouchableOpacity
              onPress={(e) => {
                e?.stopPropagation?.();
                onPrev?.();
              }}
              style={styles.controlButton}
            >
              <Text style={styles.controlIcon}>⏮</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={(e) => {
                e?.stopPropagation?.();
                onPlayPause?.();
              }}
              style={[styles.controlButton, styles.playButton, { backgroundColor: colors.accent }]}
            >
              <Text style={[styles.controlIcon, { color: isDark ? '#000' : '#111' }]}>
                {isPlaying ? '⏸' : '▶️'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={(e) => {
                e?.stopPropagation?.();
                onNext?.();
              }}
              style={styles.controlButton}
            >
              <Text style={styles.controlIcon}>⏭</Text>
            </TouchableOpacity>
          </View>
        </View>
      </GlassView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: 20,
    height: glass.miniPlayerHeight,
    zIndex: 100,
  },
  glassContainer: {
    flex: 1,
    borderRadius: radii.medium,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  leftSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  artwork: {
    borderRadius: radii.small,
    marginRight: spacing.sm,
  },
  metadata: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  artist: {
    fontSize: 13,
    marginBottom: 6,
  },
  progressContainer: {
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  controlButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    borderRadius: radii.round,
  },
  controlIcon: {
    fontSize: 18,
  },
});
