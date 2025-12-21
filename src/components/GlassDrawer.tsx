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
import { Feather, Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { getColors, spacing } from '../theme/designTokens';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';

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
  const { isDarkMode: isDark } = useTheme();
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

  const blurIntensity = Platform.OS === 'ios' ? blurIntensityIOS : blurIntensityAndroid;
  const blurTint = tint === 'default' ? (isDark ? 'dark' : 'light') : tint;

  // Premium animation
  const premiumPulse = useSharedValue(1);
  const premiumGlow = useSharedValue(0);

  useEffect(() => {
    if (isOpen) {
      premiumPulse.value = withRepeat(
        withTiming(1.02, { duration: 1500 }),
        -1,
        true
      );
      premiumGlow.value = withRepeat(
        withTiming(1, { duration: 2000 }),
        -1,
        true
      );
    }
  }, [isOpen]);

  const premiumAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: premiumPulse.value }],
    shadowOpacity: interpolate(premiumGlow.value, [0, 1], [0.3, 0.8]),
  }));

  const menuItems = [
    { id: 'home', label: 'Home', icon: 'home', screen: 'Home' },
    { id: 'profile', label: 'Profile', icon: 'user', screen: 'Profile' },
    { id: 'settings', label: 'Settings', icon: 'settings', screen: 'Settings' },
    { id: 'premium', label: 'Premium', icon: 'diamond', screen: 'Premium', isPremium: true },
    { id: 'about', label: 'About', icon: 'info', screen: 'About' },
  ];

  if (!isOpen && overlayOpacity.value === 0) {
    // completely closed — render nothing to avoid capturing touches
    return null;
  }

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
                ? ['rgba(15, 23, 42, 0.92)', 'rgba(0, 0, 0, 0.98)']
                : ['rgba(255, 255, 255, 0.85)', 'rgba(245, 245, 245, 0.95)']
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
                  {menuItems.map((item: any) => {
                    const isPremium = item.isPremium;
                    
                    if (isPremium) {
                      return (
                        <Animated.View key={item.id} style={[premiumAnimatedStyle, { marginBottom: spacing.sm, width: '85%' }]}>
                          <TouchableOpacity
                            onPress={() => handleNavigate(item.screen)}
                            activeOpacity={0.9}
                            style={{ borderRadius: 999, overflow: 'hidden' }}
                          >
                            <LinearGradient
                              colors={['#2F80ED', '#0AA1FF']}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 1 }}
                              style={{
                                borderRadius: 999,
                                padding: 1, // Border width
                                shadowColor: '#2F80ED',
                                shadowOffset: { width: 0, height: 0 },
                                shadowOpacity: 0.5,
                                shadowRadius: 10,
                                elevation: 8,
                              }}
                            >
                              <LinearGradient
                                colors={['rgba(47, 128, 237, 0.9)', 'rgba(10, 161, 255, 0.8)']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={[styles.menuItemContent, { backgroundColor: 'transparent', justifyContent: 'center', borderRadius: 999 }]}
                              >
                                <View style={[styles.iconContainer, { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12 }]}> 
                                  <Ionicons name="diamond" size={16} color="#fff" />
                                </View>
                                <Text style={[styles.menuLabel, { color: '#fff', fontWeight: '800', letterSpacing: 0.5 }]}>PREMIUM</Text>
                                <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}>
                                  <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>PRO</Text>
                                </View>
                              </LinearGradient>
                            </LinearGradient>
                          </TouchableOpacity>
                        </Animated.View>
                      );
                    }

                    return (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => handleNavigate(item.screen)}
                      accessibilityLabel={item.label}
                      activeOpacity={0.8}
                      style={{ marginBottom: spacing.sm, width: '85%' }}
                    >
                      <BlurView
                        intensity={Platform.OS === 'ios' ? 60 : 30}
                        tint={isDark ? 'dark' : 'light'}
                        style={{
                          borderRadius: 999, // Pill shape
                          overflow: 'hidden',
                          borderWidth: 1,
                          borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                        }}
                      >
                        <LinearGradient
                          colors={
                            isDark
                              ? ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']
                              : ['rgba(255,255,255,0.8)', 'rgba(255,255,255,0.5)']
                          }
                          start={{ x: 0, y: 0 }}
                          end={{ x: 0, y: 1 }}
                          style={styles.menuItemContent}
                        >
                          <View style={[styles.iconContainer, { backgroundColor: 'transparent' }]}>
                            <Feather name={item.icon as any} size={18} color={colors.text} />
                          </View>
                          <Text style={[styles.menuLabel, { color: colors.text }]}>{item.label}</Text>
                          <Feather name="chevron-right" size={16} color={colors.muted ?? 'rgba(0,0,0,0.4)'} />
                        </LinearGradient>
                      </BlurView>
                    </TouchableOpacity>
                  );
                  })}
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
    // Removed, handled inline for BlurView wrapper
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12, // Smaller padding for pill look
    paddingHorizontal: 16,
    minHeight: 48, // Smaller height
  },
  iconContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuLabel: {
    fontSize: 15, // Smaller font
    fontWeight: '600',
    flex: 1,
    letterSpacing: 0.2,
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
