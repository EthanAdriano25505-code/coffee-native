import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  useColorScheme,
  FlatList,
  ListRenderItem,
  Animated,
  Pressable,
  Easing,
  Platform,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing as ReanimatedEasing,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import HamburgerButton from '../components/HamburgerButton';

import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { usePlayback } from '../contexts/PlaybackContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../utils/supabase';
import SongCard from '../components/SongCard';
import { Feather } from '@expo/vector-icons';
import BannerIllustration from '../assets/BannerIllustration';
import BannerSlider from '../components/BannerSlider';
import SearchBar from '../components/SearchBar';
import RemoteImage from '../components/RemoteImage';
import { spacing, radii, sizes, elevation, getColors } from '../theme/designTokens';
import { tokens } from '../theme/designTokens';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import GlassDrawer from '../components/GlassDrawer';

const { width, height } = Dimensions.get('window');
const isLargeScreen = Math.max(width, height) >= 768;
const PLAYER_HEIGHT = isLargeScreen ? 88 : 72;

const SCREEN_WIDTH = width;
const BASE_PADDING = spacing.md;
const BANNER_HEIGHT = Math.round(SCREEN_WIDTH * (isLargeScreen ? 0.35 : 0.45));
const SLIDE_WIDTH = Math.round(SCREEN_WIDTH - BASE_PADDING * 2);

type HomeNavProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

type Song = {
  id: string | number;
  title: string;
  artist?: string | null;
  audio_url?: string | null;
  cover_url?: string | null;
  created_at?: string | null;
};

const DRAWER_WIDTH_PERCENT = 0.75;
const DRAWER_WIDTH = Math.round(SCREEN_WIDTH * DRAWER_WIDTH_PERCENT);
const BLUR_INTENSITY_IOS = 95;
const BLUR_INTENSITY_ANDROID = 40;

const HomeScreen: React.FC = () => {
  if (__DEV__) console.log('HomeScreen loaded: src/screens/HomeScreen.tsx');

  const hookNav = useNavigation<HomeNavProp>();
  const navigation = useNavigation<any>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = getColors(isDark);
  const insets = useSafeAreaInsets();

  const { currentSong: ctxSong, isPlaying: ctxPlaying, positionMillis, durationMillis, play, pause, next, prev, togglePlay } = usePlayback();

  const [songs, setSongs] = useState<Song[]>([]);
  const [currentSong, setCurrentSong] = useState<Song | null>((ctxSong as Song) ?? null);
  const [isPlaying, setIsPlaying] = useState<boolean>(!!ctxPlaying);
  const [activeFilter, setActiveFilter] = useState('All');

  // Drawer state (local)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => setCurrentSong((ctxSong as Song) ?? null), [ctxSong]);
  useEffect(() => setIsPlaying(!!ctxPlaying), [ctxPlaying]);

  useEffect(() => {
    if (__DEV__) console.log('player cover_url:', currentSong?.cover_url);
  }, [currentSong]);

  // mini-player progress animation
  const progressAnim = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    const progressPercent = durationMillis && durationMillis > 0 ? (positionMillis / durationMillis) * 100 : 0;
    Animated.timing(progressAnim, {
      toValue: progressPercent,
      duration: 300,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  }, [positionMillis, durationMillis, progressAnim]);

  const fetchSongs = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('songs')
        .select('id,title,artist,audio_url,cover_url,teaser_url,is_available,created_at,popularity')
        .order('created_at', { ascending: false })
        .limit(30);

      if (__DEV__) console.log('HomeScreen fetch result:', { data, error });

      if (error) {
        console.warn('fetchSongs error:', error);
        setSongs([]);
      } else {
        setSongs((data as Song[]) || []);
      }
    } catch (err) {
      console.warn('fetchSongs exception:', err);
      setSongs([]);
    }
  }, []);

  useEffect(() => {
    fetchSongs();
  }, [fetchSongs]);

  const handlePressSong = useCallback(async (song: Song) => {
    setCurrentSong(song);
    const uri = song.audio_url ? { uri: song.audio_url } : undefined;
    const payload = {
      id: song.id,
      title: song.title,
      artist: song.artist ?? undefined,
      cover_url: song.cover_url ?? undefined,
      uri,
    };
    await play(payload);
  }, [play]);

  const handlePlayPause = useCallback(async () => {
    if (isPlaying) await pause();
    else if (currentSong) {
      const uri = currentSong.audio_url ? { uri: currentSong.audio_url } : undefined;
      const payload = {
        id: currentSong.id,
        title: currentSong.title,
        artist: currentSong.artist ?? undefined,
        cover_url: currentSong.cover_url ?? undefined,
        uri,
      };
      await play(payload);
    }
  }, [isPlaying, pause, play, currentSong]);

  // Banners
  type BannerRow = { id: string | number; image_url?: string | null; title?: string | null; href?: string | null };
  const [banners, setBanners] = React.useState<BannerRow[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('banners')
          .select('id, image_url, title, href, created_at')
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) {
          console.warn('fetch banners error:', error);
        } else if (mounted && Array.isArray(data)) {
          setBanners(data as BannerRow[]);
        }
      } catch (err) {
        console.warn('fetch banners exception:', err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const bannerSlides = useMemo(() => {
    if (!banners || banners.length === 0) {
      return [
        {
          id: 'banner-1',
          component: (
            <View style={styles.bannerCard}>
              <BannerIllustration width={width - BASE_PADDING * 2} height={BANNER_HEIGHT - 24} />
            </View>
          ),
        },
        {
          id: 'banner-2',
          component: (
            <View style={styles.bannerCard}>
              <BannerIllustration width={width - BASE_PADDING * 2} height={BANNER_HEIGHT - 24} />
            </View>
          ),
        },
        {
          id: 'banner-3',
          component: (
            <View style={styles.bannerCard}>
              <BannerIllustration width={width - BASE_PADDING * 2} height={BANNER_HEIGHT - 24} />
            </View>
          ),
        },
      ];
    }

    return banners.map((b) => ({
      id: String(b.id),
      component: (
        <View style={{ borderRadius: 12, overflow: 'hidden', backgroundColor: '#f0f0f0' }}>
          <RemoteImage
            uri={b.image_url ?? null}
            width={SLIDE_WIDTH}
            height={BANNER_HEIGHT}
            placeholderText={b.title ?? 'Banner'}
            imageProps={{ resizeMode: 'cover' } as any}
          />
        </View>
      ),
    }));
  }, [banners]);

  const listHeaderElement = useMemo(() => {
    return (
      <View>
        <View style={[styles.bannerWrapper, { height: BANNER_HEIGHT }]}>
          <BannerSlider slides={bannerSlides} autoAdvanceMs={6000} height={BANNER_HEIGHT} />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: spacing.md, paddingBottom: spacing.md, paddingTop: spacing.xs }}
          style={{ flexGrow: 0 }}
        >
          {['All', 'Playlists', 'Albums', 'Downloaded'].map((filter) => {
            const isActive = activeFilter === filter;
            return (
              <TouchableOpacity
                key={filter}
                onPress={() => setActiveFilter(filter)}
                activeOpacity={0.7}
                style={{
                  marginRight: spacing.sm,
                  borderRadius: radii.round,
                  // Shadow for the "lifted" glass look
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: isDark ? 0.4 : 0.1,
                  shadowRadius: 8,
                  elevation: 4,
                  backgroundColor: 'transparent',
                }}
              >
                <BlurView
                  intensity={Platform.OS === 'ios' ? 80 : 40}
                  tint={isDark ? 'dark' : 'light'}
                  style={{
                    borderRadius: radii.round,
                    overflow: 'hidden',
                    borderWidth: 1,
                    borderColor: isActive
                      ? (isDark ? '#2F6DFD' : '#2F6DFD')
                      : (isDark ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.6)'),
                    backgroundColor: 'transparent',
                  }}
                >
                  <LinearGradient
                    colors={
                      isDark 
                        ? ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)'] 
                        : ['rgba(255,255,255,0.7)', 'rgba(255,255,255,0.3)']
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={{
                      paddingHorizontal: spacing.lg,
                      paddingVertical: 10,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text
                      style={{
                        color: isActive
                          ? '#2F6DFD'
                          : (isDark ? '#E6EEF8' : '#111'),
                        fontWeight: isActive ? '700' : '600',
                        fontSize: 14,
                      }}
                    >
                      {filter}
                    </Text>
                  </LinearGradient>
                </BlurView>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.sectionHeaderCompact}>
          <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>Song List</Text>
          <TouchableOpacity onPress={() => hookNav.navigate('FullSongs')}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }, [bannerSlides, isDark, hookNav, activeFilter]);

  const onCardPress = useCallback((song: Song) => {
    const payload = {
      id: song.id,
      title: song.title,
      artist: song.artist ?? undefined,
      cover_url: song.cover_url ?? undefined,
      uri: song.audio_url ? { uri: song.audio_url } : undefined,
    };
    play(payload);
    navigation.navigate('Player', { song });
  }, [play, navigation]);

  const renderSongItem: ListRenderItem<Song> = useCallback(({ item }) => (
    <View style={{ paddingHorizontal: spacing.sm }}>
      <SongCard song={item} onPress={() => onCardPress(item)} />
    </View>
  ), [onCardPress]);

  const listFooter = songs.length > 0 ? <View style={{ height: PLAYER_HEIGHT + (insets.bottom ?? 0) + 12 }} /> : null;

  const openDrawer = useCallback(() => setIsDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);

  const handleDrawerNavigate = useCallback((screen: string) => {
    // close then navigate
    setIsDrawerOpen(false);
    setTimeout(() => {
      try {
        (hookNav ?? navigation)?.navigate(screen as any);
      } catch (err) {
        if (__DEV__) console.warn('Navigation from drawer failed', err);
      }
    }, 260);
  }, [hookNav, navigation]);

  // (drawer animations removed) simple state-driven overlay handled by GlassDrawer

  // menu items (placeholder)
  const menuItems = [
    { id: 'home', label: 'Home', icon: 'home', screen: 'Home' },
    { id: 'profile', label: 'Profile', icon: 'user', screen: 'Profile' },
    { id: 'settings', label: 'Settings', icon: 'settings', screen: 'Settings' },
    { id: 'about', label: 'About', icon: 'info', screen: 'About' },
  ];

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background }, isDark && styles.safeDark, { position: 'relative' }]}
      edges={['left', 'right', 'bottom']}
    >
      {/* Header */}
      <View style={[styles.header, isDark && styles.headerDark, { paddingTop: insets.top + 3 }]}>
        <Text style={[styles.headerTitle, isDark && styles.headerTitleDark]}>Music</Text>
        <View style={styles.headerActions}>
          <SearchBar
            onPress={() => {
              if (__DEV__) console.log('Search tapped');
            }}
            placeholder="Search songs, artists..."
          />

          {/* Hamburger opens our Animated glass drawer (no reanimated dependency) */}
          <HamburgerButton
            onPress={() => {
              // open with animation
              openDrawer();
            }}
            color={isDark ? '#fff' : '#111'}
          />

          
        </View>
      </View>

      <FlatList
        data={songs}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderSongItem}
        ListHeaderComponent={listHeaderElement}
        ListEmptyComponent={null}
        ListFooterComponent={listFooter}
        contentContainerStyle={{ backgroundColor: isDark ? '#000' : '#f7f7f8' }}
        ItemSeparatorComponent={() => <View style={styles.rowSeparator} />}
        showsVerticalScrollIndicator={false}
        initialNumToRender={8}
        windowSize={9}
        removeClippedSubviews={true}
      />

      {/* Mini-player */}
      {currentSong ? (
        <Pressable
          onPress={() => {
            (hookNav ?? navigation)?.navigate('Player' as any, { song: currentSong });
          }}
          style={[styles.playerBar, { height: PLAYER_HEIGHT, bottom: (insets.bottom ?? 0) + 6 }]}
          pointerEvents="box-none"
        >
          <View style={[styles.playerInner, isDark && styles.playerInnerDark]}>
            <View style={styles.playerLeft}>
              <RemoteImage
                uri={currentSong?.cover_url ?? null}
                width={48}
                height={48}
                style={styles.playerArtImage}
                placeholderText="Art"
              />

              <View style={styles.playerMeta}>
                <Text style={styles.playerTitle} numberOfLines={1}>{currentSong?.title ?? ''}</Text>
                <Text style={styles.playerArtist}>{currentSong?.artist ?? ''}</Text>

                <View style={styles.progressContainer}>
                  <Animated.View
                    style={[
                      styles.progressFill,
                      {
                        width: progressAnim.interpolate({
                          inputRange: [0, 100],
                          outputRange: ['0%', '100%'],
                          extrapolate: 'clamp',
                        }),
                      },
                    ]}
                  />
                </View>
              </View>
            </View>

            <View style={styles.playerControls}>
              <TouchableOpacity onPress={() => prev()} style={styles.controlBtn} accessibilityLabel="Previous">
                <Feather name="skip-back" size={20} color="#fff" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setIsPlaying((p) => !p);
                  togglePlay();
                }}
                style={styles.playFab}
                accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
              >
                <Feather name={isPlaying ? 'pause' : 'play'} size={24} color="#111" />
              </TouchableOpacity>

              <TouchableOpacity onPress={() => next()} style={styles.controlBtn} accessibilityLabel="Next">
                <Feather name="skip-forward" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      ) : null}

      {/* Animated glass drawer (implemented inline so we avoid reanimated/worklets) */}
      {/*
        Behavior:
        - Drawer slides in from left covering ~75% width
        - Backdrop dims and is pressable to dismiss
        - Drawer interior uses BlurView + LinearGradient for premium glass look
      */}
      <GlassDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onNavigate={(screen) => {
          // Only allow safe, parameterless routes from the drawer
          const safeRoutes = ['Home', 'Profile', 'Settings', 'About'];
          if (safeRoutes.includes(screen)) {
            setIsDrawerOpen(false);
            try {
              (hookNav ?? navigation).navigate(screen as any);
            } catch (e) {
              if (__DEV__) console.warn('Drawer navigation failed', e);
            }
          } else {
            if (__DEV__) console.warn('Attempted unsafe drawer navigation to:', screen);
          }
        }}
      />
    </SafeAreaView>
  );
};

const CARD = 108;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  safeDark: { backgroundColor: '#000' },

  header: {
    paddingTop: 6,
    paddingBottom: 3,
    paddingHorizontal: BASE_PADDING,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    gap: spacing.sm,
  },
  headerDark: { backgroundColor: '#121212' },
  headerTitle: {
    fontSize: isLargeScreen ? 30 : 24,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: '#111',
  },
  headerTitleDark: { color: '#fff' },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
    justifyContent: 'flex-end',
  },

  iconButton: {
    padding: spacing.sm,
    minWidth: sizes.touchTarget,
    minHeight: sizes.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },

  profileButton: { marginLeft: 10, width: 32, height: 32, borderRadius: 16, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  profileInitials: { fontSize: 12, fontWeight: '700', color: '#111' },

  bannerWrapper: {
    marginHorizontal: BASE_PADDING,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  bannerCard: {
    flex: 1,
    borderRadius: radii.normal,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    ...elevation.low,
  },

  sectionHeaderCompact: {
    marginHorizontal: BASE_PADDING,
    marginTop: 2,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: isLargeScreen ? 20 : 18,
    fontWeight: '700',
    color: '#111',
  },
  sectionTitleDark: { color: '#fff' },
  seeAll: { color: '#999', fontSize: 13 },

  albumRow: {
    flexDirection: 'row',
    marginTop: spacing.sm,
    marginBottom: 0,
    paddingHorizontal: BASE_PADDING,
    justifyContent: 'space-between',
  },
  albumCard: { width: (width - BASE_PADDING * 2 - 16) / 3 },
  albumThumb: {
    height: CARD,
    borderRadius: radii.normal,
    backgroundColor: '#e6eaff',
    alignItems: 'center',
    justifyContent: 'center',
    ...elevation.medium,
  },
  albumThumbDark: { backgroundColor: '#1a1a2e' },
  albumThumbText: { color: '#667', fontWeight: '700' },
  albumTitle: {
    marginTop: 10,
    fontWeight: '700',
    color: '#111',
  },
  albumTitleDark: { color: '#fff' },
  albumArtist: { color: '#777', marginTop: 2 },

  rowSeparator: { height: 7, backgroundColor: 'transparent' },

  playerBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: BASE_PADDING,
    zIndex: 20,
  },
  playerInner: {
    height: PLAYER_HEIGHT - 8,
    backgroundColor: '#111',
    borderRadius: tokens.radii.normal,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  playerInnerDark: { backgroundColor: '#121212' },
  playerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },

  playerArt: {
    width: 48,
    height: 48,
    borderRadius: spacing.sm,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerArtText: { color: '#6b6b6b' },
  playerArtImage: {
    width: 48,
    height: 48,
    borderRadius: spacing.sm,
    backgroundColor: '#2a2a2a',
  },

  playerMeta: { marginLeft: spacing.md, flex: 1 },
  playerTitle: { color: '#fff', fontSize: 14, fontWeight: '800' },
  playerArtist: { color: '#ccc', fontSize: 12, marginTop: 2 },

  playerControls: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  controlBtn: {
    padding: spacing.sm,
    minWidth: sizes.touchTarget,
    minHeight: sizes.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playFab: {
    backgroundColor: '#ffd166',
    width: sizes.fabMini,
    height: sizes.fabMini,
    borderRadius: sizes.fabMini / 2,
    alignItems: 'center',
    justifyContent: 'center',
    ...elevation.medium,
  },

  progressContainer: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: spacing.sm,
    alignSelf: 'stretch',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2f6dfd',
    borderRadius: 2,
    width: '0%',
  },

  /* Drawer styles */
  overlay: {
    ...StyleSheet.absoluteFillObject,
    // opacity animated inline
  },
  drawerContainer: {
  position: 'absolute',
  left: 0,
  top: 0,
  bottom: 0,               // <--- add this line
  overflow: 'hidden',
  shadowColor: '#000',
  shadowOffset: { width: 4, height: 0 },
  shadowRadius: 18,
  elevation: 28,
},
  blur: {
    flex: 1,
    height,
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
  },
  drawerSafe: {
    flex: 1,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    marginBottom: spacing.sm,
  },
  drawerTitle: {
    fontSize: 24,
    fontWeight: '800',
  },
  drawerCloseBtn: {
    padding: spacing.sm,
    borderRadius: 16,
  },
  menuList: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 56,
  },
  menuIcon: {
    marginRight: spacing.md,
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  drawerFooter: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
  },
  glassEdge: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: -1,
    width: 1,
    borderRightWidth: 1,
    opacity: 0.9,
  },
});

export default HomeScreen;