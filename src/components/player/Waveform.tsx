import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { colors } from '../../design/tokens';

interface WaveformProps {
  bars?: number; // default 40
  progressPercent: number; // 0..100
  isPlaying: boolean;
}

const Waveform: React.FC<WaveformProps> = ({ bars = 40, progressPercent, isPlaying }) => {
  const heights = useMemo(() => {
    const arr: number[] = [];
    for (let i = 0; i < bars; i++) {
      const t = i / bars;
      const h = Math.sin(t * Math.PI) * 1.0 + 0.2 * Math.sin(3 * t * Math.PI);
      arr.push(12 + Math.max(10, h * 36));
    }
    return arr;
  }, [bars]);

  const activeIndex = Math.round((progressPercent / 100) * bars);

  return (
    <View style={styles.container}>
      {heights.map((h, i) => {
        const past = i <= activeIndex;
        const baseColor = past ? colors.primaryBlue : colors.primaryBlue;
        const opacity = past ? 1 : 0.15;
        const animate = Math.abs(i - activeIndex) <= 2 && isPlaying;
        return (
          <MotiView
            key={`bar-${i}`}
            from={{ height: h }}
            animate={{ height: animate ? h * 1.1 : h }}
            transition={{ type: 'timing', duration: animate ? 280 : 0, loop: animate }}
            style={[styles.bar, { height: h, backgroundColor: baseColor, opacity }]}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 56,
  },
  bar: {
    width: 4,
    borderRadius: 2,
    marginHorizontal: 2,
  },
});

export default Waveform;
