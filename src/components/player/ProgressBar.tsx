import React, { useMemo, useState } from 'react';
import { View, StyleSheet, PanResponder } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../design/tokens';

interface ProgressBarProps {
  progress: number; // 0..100
  buffered?: number; // 0..100
  onSeek?: (percent: number) => void;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress, buffered = 0, onSeek }) => {
  const [dragX, setDragX] = useState<number | null>(null);

  const pan = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: (_, g) => setDragX(g.x0),
    onPanResponderMove: (_, g) => setDragX(g.moveX),
    onPanResponderRelease: (_, g) => {
      setDragX(null);
      if (!onSeek) return;
      onSeek(Math.max(0, Math.min(100, (g.moveX - (g.x0 - (progress / 100))) )));
    },
  }), [progress, onSeek]);

  return (
    <View style={styles.container} {...pan.panHandlers}>
      {/* Background */}
      <View style={styles.bg} />
      {/* Buffered */}
      <View style={[styles.buffered, { width: `${buffered}%` }]} />
      {/* Progress gradient */}
      <LinearGradient
        colors={[colors.primaryBlue, colors.accentBlue]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.progress, { width: `${progress}%` }]}
      />
      {/* Thumb */}
      <View style={[styles.thumb, { left: `${progress}%` }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: 'rgba(10,161,255,0.10)',
  },
  bg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  buffered: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(10,161,255,0.20)',
  },
  progress: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
  },
  thumb: {
    position: 'absolute',
    top: -3,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(47,128,237,0.4)',
    shadowColor: colors.primaryBlue,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
});

export default ProgressBar;
