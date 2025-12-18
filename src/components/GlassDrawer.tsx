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
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { getColors, spacing } from '../theme/designTokens';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (screen: string) => void;
  widthPercent?: number; // default 0.75 (75% width)
  blurIntensityIOS?: number; // intensity on iOS
  blurIntensityAndroid?: number; // intensity on Android fallback
  tint?: 'light' | 'dark' | 'default';
};

const GlassDrawer: React.FC<Props> = ({
  isOpen,
  onClose,
  onNavigate,
  widthPercent = 0.75,
  blurIntensityIOS = 90,
  blurIntensityAndroid = 30,
  tint = 'default',
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = getColors?.(!!isDark) ?? {
    text: isDark ? '#fff' : '#111',
    muted: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.5)',
  };

  const DRAWER_WIDTH = Math.round(SCREEN_WIDTH * widthPercent);

  // reanimated shared values
  const translateX = useSharedValue(-DRAWER_WIDTH); // start off-screen to the left
  const overlayOpacity = useSharedValue(0);
  const contentScale = useSharedValue(0.98);

  useEffect(() => {
    if (isOpen) {
      // open
      translateX.value = withSpring(0, {
        damping: 20,
        stiffness: 100,
        mass: 0.8,
      });
      overlayOpacity.value = withTiming(1, { duration: 300 });
      contentScale.value = withTiming(1, { duration: 300 });
    } else {
      // close
      translateX.value = withSpring(-DRAWER_WIDTH, {
        damping: 20,
        stiffness: 120,
        mass: 0.8,
      });
      overlayOpacity.value = withTiming(0, { duration: 220 });
      contentScale.value = withTiming(0.98, { duration: 220 });
    }
  }, [isOpen, DRAWER_WIDTH]);

  const drawerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  // subtle parallax effect for interior content (optional)
  const innerScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(contentScale.value, [0.98, 1], [0.995, 1], Extrapolate.CLAMP) }],
  }));

  const handleNavigate = (screen: string) => {
    // close then navigate via onNavigate (keep UI responsive)
    onClose();
    setTimeout(() => {
      onNavigate?.(screen);
    }, 260);
  };

  if (!isOpen && overlayOpacity.value === 0) {
    // completely closed — render nothing to avoid capturing touches
    return null;
  }

  const blurIntensity = Platform.OS === 'ios' ? blurIntensityIOS : blurIntensityAndroid;
  const blurTint = tint === 'default' ? (isDark ? 'dark' : 'light') : tint;

  const menuItems = [
    { id: 'home', label: 'Home', icon: 'home', screen: 'Home' },
    { id: 'profile', label: 'Profile', icon: 'user', screen: 'Profile' },
    { id: 'settings', label: 'Settings', icon: 'settings', screen: 'Settings' },
    { id: 'about', label: 'About', icon: 'info', screen: 'About' },
  ];

  return (
    <Animated.View
      style={[styles.container, { zIndex: 9999 }]}
      pointerEvents={isOpen ? 'box-none' : 'none'}
    >
      {/* Overlay: covers the entire screen to dim the background */}
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={onClose}
        pointerEvents={isOpen ? 'auto' : 'none'}
      >
        <Animated.View
          // give the overlay a zIndex lower than the drawer to make stacking explicit
          style={[
            styles.overlay,
            overlayStyle,
            { zIndex: 10000, backgroundColor: isDark ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0.45)' },
          ]}
        />
      </Pressable>

      {/* Drawer surface (ensure it sits above the overlay) */}
      <Animated.View
        style={[
          styles.drawer,
          drawerStyle,
          {
            width: DRAWER_WIDTH,
            left: 0,
            zIndex: 10001,
          },
        ]}
      >
        <BlurView intensity={blurIntensity} tint={blurTint} style={styles.blurContainer}>
          <LinearGradient
            colors={
              isDark
                ? ['rgba(25,25,25,0.78)', 'rgba(18,18,18,0.92)']
                : ['rgba(255,255,255,0.78)', 'rgba(245,245,245,0.92)']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.gradientOverlay}
          >
            <SafeAreaView edges={['top', 'left', 'bottom']} style={styles.safe}>
              <Animated.View style={[styles.innerContent, innerScaleStyle]}>
                {/* Header */}
                <View style={styles.header}>
                  <Text style={[styles.headerTitle, { color: colors.text }]}>Menu</Text>
                  <TouchableOpacity
                    onPress={onClose}
                    style={styles.closeButton}
                    accessibilityLabel="Close menu"
                    accessibilityRole="button"
                  >
                    <Feather name="x" size={22} color={colors.text} />
                  </TouchableOpacity>
                </View>

                {/* Items */}
                <View style={styles.menuItems}>
                  {menuItems.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => handleNavigate(item.screen)}
                      accessibilityLabel={item.label}
                      activeOpacity={0.8}
                      style={{ marginBottom: spacing.md }}
                    >
                      <LinearGradient
                        colors={
                          isDark
                            ? ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)']
                            : ['rgba(255,255,255,0.8)', 'rgba(255,255,255,0.4)']
                        }
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={[
                          styles.menuItemContainer,
                          {
                            borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.4)',
                            marginBottom: 0, // handled by wrapper
                          }
                        ]}
                      >
                        <View style={styles.menuItemContent}>
                          <View style={[styles.iconContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
                            <Feather name={item.icon as any} size={20} color={colors.text} />
                          </View>
                          <Text style={[styles.menuLabel, { color: colors.text }]}>{item.label}</Text>
                          <Feather name="chevron-right" size={20} color={colors.muted ?? 'rgba(0,0,0,0.4)'} />
                        </View>
                      </LinearGradient>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                  <Text style={[styles.footerText, { color: colors.muted }]}>Music App v1.0
by Saw K Za</Text>
                </View>
              </Animated.View>
            </SafeAreaView>
          </LinearGradient>
        </BlurView>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },

  // Drawer shell
  drawer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    // rounded "liquid" edges like iPhone sheets
    borderTopRightRadius: 28,
    backgroundColor: 'transparent',
  },

  // Keep blur container rounded so blur respects the corner radius
  blurContainer: {
    flex: 1,
    overflow: 'hidden',
    borderTopRightRadius: 28,
  },

  // gradient overlay stretches full height; we add padding in inner content
  gradientOverlay: {
    flex: 1,
  },

  safe: {
    flex: 1,
  },

  // Inner content gets more roomy padding and a soft parallax-friendly layout
  innerContent: {
    flex: 1,
    paddingHorizontal: spacing.md * 1.5,
    paddingTop: spacing.md * 1.5,
    paddingBottom: spacing.md,
    // ensure children don't paint outside rounded corners
    overflow: 'hidden',
  },

  // Header: larger title with frosted subtle text shadow for depth
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    marginBottom: spacing.sm,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 0.2,
    // subtle frosted glow/shadow
    textShadowColor: 'rgba(0,0,0,0.08)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  closeButton: {
    padding: spacing.sm,
    borderRadius: 14,
    // soft translucent hit target reminiscent of iOS controls
    backgroundColor: 'rgba(255,255,255,0.03)',
  },

  // Menu list area
  menuItems: {
    flex: 1,
    paddingTop: spacing.sm,
  },

  // Each item has a pill-like shape with a light glass surface and inner shadow
  menuItemContainer: {
    marginBottom: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    minHeight: 60,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  menuLabel: {
    fontSize: 17,
    fontWeight: '600',
    flex: 1,
    letterSpacing: 0.3,
  },
  footer: {
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    marginTop: spacing.lg,
  },
  footerText: {
    fontSize: 12,
    opacity: 0.6,
    letterSpacing: 0.5,
    fontWeight: '500',
  },
});

export default GlassDrawer;
