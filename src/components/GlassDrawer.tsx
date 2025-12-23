import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  useColorScheme,
  Pressable,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { getColors, spacing } from '../theme/designTokens';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const DRAWER_WIDTH_PERCENT = 0.6; // 60% of screen width
const DRAWER_WIDTH = SCREEN_WIDTH * DRAWER_WIDTH_PERCENT;

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (screen: string) => void;
};

// Single-surface glass drawer with liquid glassmorphism effect
const GlassDrawer: React.FC<Props> = ({ isOpen, onClose, onNavigate }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = getColors(isDark);
  
  // Animated values for smooth transitions
  const translateX = useSharedValue(DRAWER_WIDTH); // Start off-screen (right side)
  const overlayOpacity = useSharedValue(0);

  useEffect(() => {
    if (isOpen) {
      // Slide in from right with spring animation
      translateX.value = withSpring(0, {
        damping: 20,
        stiffness: 90,
        mass: 0.8,
      });
      overlayOpacity.value = withTiming(1, { duration: 300 });
    } else {
      // Slide out to right
      translateX.value = withSpring(DRAWER_WIDTH, {
        damping: 20,
        stiffness: 90,
        mass: 0.8,
      });
      overlayOpacity.value = withTiming(0, { duration: 250 });
    }
  }, [isOpen]);

  // Animated styles
  const drawerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const overlayAnimatedStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const handleNavigate = (screen: string) => {
    onClose();
    setTimeout(() => {
      onNavigate?.(screen);
    }, 250); // Delay navigation until drawer closes
  };

  if (!isOpen && overlayOpacity.value === 0) {
    return null; // Don't render when fully closed
  }

  // Blur intensity: strong on iOS, clamped on Android
  const blurIntensity = Platform.OS === 'ios' ? 80 : 30;

  const menuItems = [
    { id: 'profile', label: 'Profile', icon: 'user', screen: 'Profile' },
    { id: 'settings', label: 'Settings', icon: 'settings', screen: 'Settings' },
    { id: 'about', label: 'About', icon: 'info', screen: 'About' },
  ];

  return (
    <Animated.View style={[styles.container, { pointerEvents: isOpen ? 'auto' : 'none' }]}>
      {/* Dark overlay backdrop */}
      <Pressable 
        style={StyleSheet.absoluteFill}
        onPress={onClose}
      >
        <Animated.View
          style={[
            styles.overlay,
            overlayAnimatedStyle,
            { backgroundColor: isDark ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.5)' },
          ]}
        />
      </Pressable>

      {/* Glass drawer - single surface */}
      <Animated.View
        style={[
          styles.drawer,
          drawerAnimatedStyle,
          {
            width: DRAWER_WIDTH,
            shadowColor: isDark ? '#000' : '#000',
            shadowOpacity: isDark ? 0.5 : 0.3,
          },
        ]}
      >
        {/* Single BlurView for liquid glass effect */}
        <BlurView
          intensity={blurIntensity}
          tint={isDark ? 'dark' : 'light'}
          style={styles.blurContainer}
        >
          {/* Subtle gradient overlay for depth (single layer) */}
          <LinearGradient
            colors={
              isDark
                ? ['rgba(30, 30, 30, 0.85)', 'rgba(20, 20, 20, 0.95)']
                : ['rgba(255, 255, 255, 0.85)', 'rgba(245, 245, 245, 0.95)']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.gradientOverlay}
          >
            {/* Drawer content */}
            <View style={styles.content}>
              {/* Header */}
              <View style={styles.header}>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Menu</Text>
                <TouchableOpacity
                  onPress={onClose}
                  style={styles.closeButton}
                  accessibilityLabel="Close menu"
                  accessibilityRole="button"
                >
                  <Feather name="x" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              {/* Menu items */}
              <View style={styles.menuItems}>
                {menuItems.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.menuItem,
                      {
                        backgroundColor: isDark
                          ? 'rgba(255, 255, 255, 0.05)'
                          : 'rgba(0, 0, 0, 0.03)',
                        borderColor: isDark
                          ? 'rgba(255, 255, 255, 0.1)'
                          : 'rgba(0, 0, 0, 0.05)',
                      },
                    ]}
                    onPress={() => handleNavigate(item.screen)}
                    accessibilityLabel={item.label}
                    accessibilityRole="button"
                    activeOpacity={0.7}
                  >
                    <Feather
                      name={item.icon as any}
                      size={22}
                      color={colors.text}
                      style={styles.menuIcon}
                    />
                    <Text style={[styles.menuLabel, { color: colors.text }]}>
                      {item.label}
                    </Text>
                    <Feather
                      name="chevron-right"
                      size={20}
                      color={colors.muted}
                    />
                  </TouchableOpacity>
                ))}
              </View>

              {/* Footer */}
              <View style={styles.footer}>
                <Text style={[styles.footerText, { color: colors.muted }]}>
                  Music App v1.0
                </Text>
              </View>
            </View>
          </LinearGradient>
        </BlurView>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  drawer: {
    position: 'absolute',
    right: 0,
    top: 0,
    height: SCREEN_HEIGHT,
    shadowOffset: { width: -4, height: 0 },
    shadowRadius: 16,
    elevation: 24,
    overflow: 'hidden',
  },
  blurContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  gradientOverlay: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 60 : 40, // Account for status bar
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  closeButton: {
    padding: spacing.sm,
    borderRadius: 20,
  },
  menuItems: {
    flex: 1,
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 56,
  },
  menuIcon: {
    marginRight: spacing.md,
  },
  menuLabel: {
    fontSize: 17,
    fontWeight: '500',
    flex: 1,
    letterSpacing: 0.3,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  footerText: {
    fontSize: 13,
    fontWeight: '400',
  },
});

export default GlassDrawer;
