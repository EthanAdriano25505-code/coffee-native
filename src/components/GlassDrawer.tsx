import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Dimensions, useColorScheme } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import GlassView from './GlassView';
import { spacing, radii, getColors } from '../theme/designTokens';

const { width } = Dimensions.get('window');
const DRAWER_WIDTH = width * 0.75;

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export default function GlassDrawer({ isOpen, onClose }: Props) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = getColors(isDark);

  const translateX = useSharedValue(-DRAWER_WIDTH);

  useEffect(() => {
    translateX.value = withSpring(isOpen ? 0 : -DRAWER_WIDTH, {
      damping: 20,
      stiffness: 90,
    });
  }, [isOpen, translateX]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  if (!isOpen) return null;

  return (
    <Modal transparent visible={isOpen} onRequestClose={onClose} animationType="none">
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />
        <Animated.View style={[styles.drawer, { width: DRAWER_WIDTH }, animatedStyle]}>
          <GlassView intensity={isDark ? 60 : 90} tint={isDark ? 'dark' : 'light'} style={styles.glassContainer}>
            <LinearGradient
              colors={isDark ? ['rgba(0,0,0,0.8)', 'rgba(26,26,26,0.9)'] : ['rgba(255,255,255,0.9)', 'rgba(245,245,245,0.95)']}
              style={styles.gradient}
            >
              <View style={styles.header}>
                <Text style={[styles.headerText, { color: colors.text }]}>Menu</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Text style={[styles.closeText, { color: colors.text }]}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.menu}>
                <TouchableOpacity style={styles.menuItem}>
                  <Text style={[styles.menuText, { color: colors.text }]}>🏠 Home</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem}>
                  <Text style={[styles.menuText, { color: colors.text }]}>🎵 Library</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem}>
                  <Text style={[styles.menuText, { color: colors.text }]}>⭐ Favorites</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem}>
                  <Text style={[styles.menuText, { color: colors.text }]}>📥 Downloads</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem}>
                  <Text style={[styles.menuText, { color: colors.text }]}>⚙️ Settings</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </GlassView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  drawer: {
    height: '100%',
    position: 'absolute',
    left: 0,
    top: 0,
  },
  glassContainer: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  headerText: {
    fontSize: 28,
    fontWeight: '800',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: radii.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 24,
    fontWeight: '600',
  },
  menu: {
    gap: spacing.sm,
  },
  menuItem: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.normal,
  },
  menuText: {
    fontSize: 18,
    fontWeight: '600',
  },
});
