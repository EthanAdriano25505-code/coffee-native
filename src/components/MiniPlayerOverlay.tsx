import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  Animated,
  useColorScheme,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import GlassView from './GlassView';
import RemoteImage from './RemoteImage';
import { spacing, radii, sizes, getColors, glass } from '../theme/designTokens';

type MiniPlayerOverlayProps = {
  song: {
    id: string | number;
    title: string;
    artist?: string | null;
    cover_url?: string | null;
  } | null;
  isPlaying: boolean;
  progressPercent: number; // 0-100
  onPress: () => void;
  onPlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
};

/**
 * MiniPlayerOverlay: Floating glass mini-player with blur background
 * 
 * Renders a mini-player overlay with glass/blur effects, anchored above
 * the bottom safe area with play controls and progress indicator.
 */
const MiniPlayerOverlay: React.FC<MiniPlayerOverlayProps> = ({
  song,
  isPlaying,
  progressPercent,
  onPress,
  onPlayPause,
  onNext,
  onPrev,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = getColors(isDark);
  const insets = useSafeAreaInsets();

  if (!song) {
    return null;
  }

  const blurIntensity = Platform.OS === 'ios' ? glass.intensityIOS : glass.intensityAndroid;

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.container,
        {
          bottom: (insets.bottom ?? 0) + 6,
        },
      ]}
    >
      <GlassView
        intensity={blurIntensity}
        tint={isDark ? 'dark' : 'light'}
        style={[
          styles.glassContainer,
          {
            backgroundColor: isDark
              ? 'rgba(18, 18, 18, 0.85)'
              : 'rgba(255, 255, 255, 0.85)',
          },
        ]}
      >
        <View style={styles.content}>
          <View style={styles.leftSection}>
            <RemoteImage
              uri={song.cover_url ?? null}
              width={48}
              height={48}
              style={styles.artwork}
              placeholderText="Art"
            />

            <View style={styles.metadata}>
              <Text
                style={[styles.title, { color: colors.text }]}
                numberOfLines={1}
              >
                {song.title}
              </Text>
              <Text
                style={[styles.artist, { color: colors.textSecondary }]}
                numberOfLines={1}
              >
                {song.artist || 'Unknown Artist'}
              </Text>

              {/* Progress bar */}
              <View style={styles.progressContainer}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${progressPercent}%`,
                      backgroundColor: colors.primary,
                    },
                  ]}
                />
              </View>
            </View>
          </View>

          <View style={styles.controls}>
            <TouchableOpacity
              onPress={onPrev}
              style={styles.controlButton}
              accessibilityLabel="Previous"
              accessibilityRole="button"
            >
              <Feather
                name="skip-back"
                size={20}
                color={colors.text}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onPlayPause}
              style={[
                styles.playButton,
                {
                  backgroundColor: colors.accent,
                },
              ]}
              accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
              accessibilityRole="button"
            >
              <Feather
                name={isPlaying ? 'pause' : 'play'}
                size={24}
                color="#111"
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onNext}
              style={styles.controlButton}
              accessibilityLabel="Next"
              accessibilityRole="button"
            >
              <Feather
                name="skip-forward"
                size={20}
                color={colors.text}
              />
            </TouchableOpacity>
          </View>
        </View>
      </GlassView>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: spacing.md,
    zIndex: 20,
  },
  glassContainer: {
    borderRadius: radii.normal,
    overflow: 'hidden',
    // Enhanced shadow for floating effect
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    // Glass border
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: glass.miniPlayerHeight - 8,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  artwork: {
    width: 48,
    height: 48,
    borderRadius: spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  metadata: {
    marginLeft: spacing.md,
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  artist: {
    fontSize: 12,
    marginTop: 2,
  },
  progressContainer: {
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 1.5,
    marginTop: spacing.xs,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 1.5,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  controlButton: {
    padding: spacing.sm,
    minWidth: sizes.touchTarget,
    minHeight: sizes.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    width: sizes.fabMini,
    height: sizes.fabMini,
    borderRadius: sizes.fabMini / 2,
    alignItems: 'center',
    justifyContent: 'center',
    // Subtle shadow for depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
});

export default MiniPlayerOverlay;
