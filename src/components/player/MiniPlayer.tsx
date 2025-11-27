import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radii, spacing } from '../../design/tokens';
import PlayButton from './PlayButton';
import { Forward } from 'lucide-react-native';

interface MiniPlayerProps {
  title: string;
  artist?: string | null;
  artworkUrl?: string | null;
  progress: number; // 0..100
  isPlaying: boolean;
  onToggle: () => void;
  onNext?: () => void;
}

const MiniPlayer: React.FC<MiniPlayerProps> = ({ title, artist, artworkUrl, progress, isPlaying, onToggle, onNext }) => {
  return (
    <View style={styles.wrapper}>
      <BlurView intensity={24} tint="dark" style={StyleSheet.absoluteFill} />
      <LinearGradient
        colors={["rgba(17,24,39,0.7)", "rgba(17,24,39,0.8)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: radii.card24 }]} />

      {/* Progress strip */}
      <LinearGradient
        colors={[colors.primaryBlue, colors.accentBlue]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.progressStrip, { width: `${progress}%` }]}
      />

      <View style={styles.content}>
        <Image source={{ uri: artworkUrl ?? undefined }} style={styles.thumb} />
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.artist}>{artist ?? ''}</Text>
        </View>
        <PlayButton size={52} isPlaying={isPlaying} onToggle={onToggle} />
        <Pressable accessibilityLabel="Next" onPress={onNext} style={({ pressed }) => [styles.iconBtn, { transform: [{ scale: pressed ? 0.96 : 1 }] }]}>
          <Forward color={'#FFFFFF'} size={24} />
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: radii.card24,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.x12,
    padding: spacing.x16,
  },
  progressStrip: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: 3,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginRight: spacing.x12,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  artist: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  iconBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginLeft: spacing.x8,
  },
});

export default MiniPlayer;
