// src/components/SongCard.tsx
// Visual-only: Modern song card with rounded thumbnail and trailing action icon
import React from 'react';
import { Animated, Pressable, Text, View, Image, StyleSheet, useColorScheme } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getColors, radii, spacing, elevation } from '../theme/designTokens';
import { useTheme } from '../contexts/ThemeContext';

type Song = { id: string | number; title: string; artist?: string | null; cover_url?: string | null };

type Props = { 
  song: Song; 
  onPress: () => void; 
  index?: number;
  isActive?: boolean;
  onRightAction?: () => void;
  rightIconName?: keyof typeof Feather.glyphMap;
};

export default function SongCard({ song, onPress, index, isActive = false, onRightAction, rightIconName = "more-horizontal" }: Props) {
  const scale = React.useRef(new Animated.Value(1)).current;
  const [imageError, setImageError] = React.useState(false);
  const { isDarkMode: isDark } = useTheme();
  const colors = getColors(isDark);

  const onPressIn = () => Animated.spring(scale, { toValue: 0.98, useNativeDriver: true }).start();
  const onPressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();

  // Format index to be 2 digits (01, 02, etc.)
  const formattedIndex = index !== undefined ? String(index + 1).padStart(2, '0') : '';

  return (
    <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut} style={{ marginBottom: spacing.sm }}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <View
          style={[
            styles.container,
            { 
              backgroundColor: 'transparent', // Handled by LinearGradient or View below
            }
          ]}
        >
          {isActive && (
             <LinearGradient
                colors={isDark ? ['rgba(47, 128, 237, 0.15)', 'rgba(47, 128, 237, 0.02)'] : ['rgba(47, 128, 237, 0.1)', 'rgba(47, 128, 237, 0.01)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
             />
          )}

          {/* Active Indicator (Left Bar) */}
          {isActive && (
            <View style={{
              position: 'absolute',
              left: 0,
              top: 12,
              bottom: 12,
              width: 4,
              backgroundColor: '#2F80ED',
              borderTopRightRadius: 4,
              borderBottomRightRadius: 4,
              shadowColor: '#2F80ED',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.5,
              shadowRadius: 6,
              elevation: 4,
            }} />
          )}

          {/* Index Number / Playing Icon */}
          <View style={styles.indexContainer}>
            {isActive ? (
              <Ionicons name="stats-chart" size={16} color="#2F80ED" />
            ) : (
              <Text style={[styles.index, { color: isDark ? '#666' : '#999' }]}> 
                {formattedIndex}
              </Text>
            )}
          </View>

          {/* Album Art */}
          <View style={styles.artContainer}>
            <View style={[styles.artWrapper, isActive && styles.activeArtWrapper]}>
              {song.cover_url && !imageError ? (
                <Image 
                  source={{ uri: song.cover_url }} 
                  style={styles.art}
                  onError={() => setImageError(true)}
                />
              ) : (
                <View style={[styles.art, { backgroundColor: isDark ? '#333' : '#E0E0E0', justifyContent: 'center', alignItems: 'center' }]}>
                  <Ionicons name="musical-note" size={20} color={isDark ? '#555' : '#AAA'} />
                </View>
              )}
            </View>
          </View>

          {/* Meta: Title + Artist */}
          <View style={styles.meta}>
            <Text 
              numberOfLines={1} 
              style={[
                styles.title, 
                { color: isActive ? (isDark ? '#2F80ED' : '#2F80ED') : (isDark ? '#FFFFFF' : colors.text) }
              ]}
            >
              {song.title}
            </Text>
            <Text numberOfLines={1} style={[styles.artist, { color: colors.textSecondary }]}>
              {song.artist || 'Unknown Artist'}
            </Text>
          </View>

          {/* Right: Menu Icon (3 dots) or Custom Action */}
          {onRightAction ? (
            <Pressable onPress={onRightAction} style={styles.menuButton} hitSlop={8}>
              <Feather name={rightIconName} size={20} color={isDark ? '#666' : '#999'} />
            </Pressable>
          ) : (
            <View style={styles.menuButton}>
                <Feather name={rightIconName} size={20} color={isDark ? '#666' : '#999'} />
            </View>
          )}
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  activeContainer: {
    // Removed shadow for cleaner look
  },
  indexContainer: {
    width: 24,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  index: {
    fontSize: 14,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
  },
  artContainer: {
    marginRight: 14,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
    elevation: 3,
  },
  activeArtContainer: {
  },
  artWrapper: {
    width: 48,
    height: 48,
    borderRadius: 8,
    overflow: 'hidden',
  },
  activeArtWrapper: {
    // No yellow border
  },
  art: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    backgroundColor: '#222',
  },
  meta: {
    flex: 1,
    justifyContent: 'center',
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 3,
    letterSpacing: 0.1,
  },
  artist: {
    fontSize: 13,
    fontWeight: '400',
  },
  menuButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.8,
  },
});