import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { colors, radii, shadows } from '../../design/tokens';
import { Pause, Play } from 'lucide-react-native';

interface PlayButtonProps {
  size?: number;
  isPlaying: boolean;
  onToggle: () => void;
  accessibilityLabel?: string;
}

const PlayButton: React.FC<PlayButtonProps> = ({ size = 80, isPlaying, onToggle, accessibilityLabel }) => {
  const glowSize = size + 24;

  return (
    <Pressable accessibilityLabel={accessibilityLabel ?? (isPlaying ? 'Pause' : 'Play')} onPress={onToggle} style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.96 : 1 }] }] }>
      <View style={[styles.wrapper, { width: size, height: size, borderRadius: radii.round }]}>        
        {/* Pulsing glow when playing */}
        <MotiView
          from={{ opacity: 0.4, scale: 1 }}
          animate={{ opacity: isPlaying ? 0.6 : 0, scale: isPlaying ? 1.2 : 1 }}
          transition={{ type: 'timing', duration: 2000, loop: true }}
          style={[styles.glow, { width: glowSize, height: glowSize, borderRadius: radii.round }]}
        />
        <LinearGradient
          colors={[colors.primaryBlue, colors.accentBlue]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.button, { width: size, height: size, borderRadius: radii.round }]}
        >
          {isPlaying ? (
            <Pause color={'#FFFFFF'} size={size * 0.36} />
          ) : (
            <Play color={'#FFFFFF'} size={size * 0.36} />
          )}
        </LinearGradient>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    backgroundColor: colors.primaryBlue,
    opacity: 0.5,
    filter: undefined,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: shadows.primaryButton.shadowColor,
    shadowOpacity: shadows.primaryButton.shadowOpacity,
    shadowRadius: shadows.primaryButton.shadowRadius,
    shadowOffset: shadows.primaryButton.shadowOffset,
    elevation: shadows.primaryButton.elevation,
  },
});

export default PlayButton;
