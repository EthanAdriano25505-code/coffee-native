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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import HamburgerButton from '../components/HamburgerButton';

import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { usePlayback } from '../contexts/PlaybackContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../utils/supabase';
import SongCard from '../components/SongCard';
import CenterMiniPill from '../components/CenterMiniPill';
import MiniPlayerOverlay from '../components/MiniPlayerOverlay';
import { Feather } from '@expo/vector-icons';
import BannerIllustration from '../assets/BannerIllustration';
import BannerSlider from '../components/BannerSlider';
import SearchBar from '../components/SearchBar';
import RemoteImage from '../components/RemoteImage';
import { spacing, radii, sizes, elevation, getColors } from '../theme/designTokens';
import { tokens } from '../theme/designTokens';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

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
const BLUR_INTENSITY_IOS = 90;
const BLUR_INTENSITY_ANDROID = 30;

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
  const [activeFilter, setActiveFilter] = useState<string>('all');

  // Drawer state (local, animated with React Native Animated — no reanimated)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const drawerTranslateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

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

  const pillFilterItems = [
    { id: 'all', label: 'All' },
    { id: 'playlists', label: 'Playlists' },
    { id: 'liked', label: 'Liked Songs' },
    { id: 'downloaded', label: 'Downloaded' },
    { id: 'recent', label: 'Recent' },
  ];

  const handleFilterSelect = useCallback((filterId: string) => {
    setActiveFilter(filterId);
    // Here you could add logic to filter songs based on the selected filter
    if (__DEV__) console.log('Filter selected:', filterId);
  }, []);

  const listHeaderElement = useMemo(() => {
    return (
      <View>
        <View style={[styles.bannerWrapper, { height: BANNER_HEIGHT }]}>
          <BannerSlider slides={bannerSlides} autoAdvanceMs={6000} height={BANNER_HEIGHT} />
        </View>

        {/* Glass pill filter bar */}
        <CenterMiniPill
          items={pillFilterItems}
          activeId={activeFilter}
          onSelect={handleFilterSelect}
          style={{ marginVertical: spacing.sm }}
        />

        <View style={styles.sectionHeaderCompact}>
          <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>New Albums</Text>
          <TouchableOpacity onPress={() => hookNav.navigate('FullSongs')}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.albumRow}>
          <TouchableOpacity
            style={styles.albumCard}
            accessible
            accessibilityRole="button"
            onPress={() => hookNav.navigate('FullSongs')}
            activeOpacity={0.8}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <RemoteImage
              uri={null}
              width={CARD}
              height={CARD}
              style={isDark ? StyleSheet.flatten([styles.albumThumb, styles.albumThumbDark]) : styles.albumThumb}
              placeholderText="Album"
            />
            <Text style={[styles.albumTitle, isDark && styles.albumTitleDark]}>Free songs</Text>
            <Text style={styles.albumArtist}> </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.albumCard}
            accessible
            accessibilityRole="button"
            onPress={() => hookNav.navigate('FullSongs')}
            activeOpacity={0.8}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <RemoteImage
              uri={null}
              width={CARD}
              height={CARD}
              style={isDark ? StyleSheet.flatten([styles.albumThumb, styles.albumThumbDark]) : styles.albumThumb}
              placeholderText="Album"
            />
            <Text style={[styles.albumTitle, isDark && styles.albumTitleDark]}>Teasers</Text>
            <Text style={styles.albumArtist}> </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.albumCard}
            accessible
            accessibilityRole="button"
            onPress={() => hookNav.navigate('FullSongs')}
            activeOpacity={0.8}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <RemoteImage
              uri={null}
              width={CARD}
              height={CARD}
              style={isDark ? StyleSheet.flatten([styles.albumThumb, styles.albumThumbDark]) : styles.albumThumb}
              placeholderText="Album"
            />
            <Text style={[styles.albumTitle, isDark && styles.albumTitleDark]}>Playlists</Text>
            <Text style={styles.albumArtist}> </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHeaderCompact}>
          <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>Song List</Text>
          <TouchableOpacity onPress={() => hookNav.navigate('FullSongs')}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }, [bannerSlides, isDark, hookNav, activeFilter, handleFilterSelect]);

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

  const renderSongItem: ListRenderItem<Song> = useCallback(({ item }) => <SongCard song={item} onPress={() => onCardPress(item)} />, [onCardPress]);

  const listFooter = songs.length > 0 ? <View style={{ height: PLAYER_HEIGHT + (insets.bottom ?? 0) + 12 }} /> : null;

  // Drawer open / close animations (React Native Animated)
  const openDrawer = useCallback(() => {
    setIsDrawerOpen(true);
    Animated.parallel([
      Animated.timing(drawerTranslateX, {
        toValue: 0,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 320,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, [drawerTranslateX, overlayOpacity]);

  const closeDrawer = useCallback(() => {
    Animated.parallel([
      Animated.timing(drawerTranslateX, {
        toValue: -DRAWER_WIDTH,
        duration: 340,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 260,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(() => {
      // ensure fully closed after animation
      setIsDrawerOpen(false);
    });
  }, [drawerTranslateX, overlayOpacity]);

  const handleDrawerNavigate = useCallback((screen: string) => {
    // close then navigate
    closeDrawer();
    setTimeout(() => {
      try {
        (hookNav ?? navigation)?.navigate(screen as any);
      } catch (err) {
        if (__DEV__) console.warn('Navigation from drawer failed', err);
      }
    }, 300);
  }, [closeDrawer, hookNav, navigation]);

  // overlay animated styles
  const overlayStyle = {
    opacity: overlayOpacity,
    backgroundColor: isDark ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0.45)',
  };

  const drawerAnimatedStyle = {
    transform: [{ translateX: drawerTranslateX }],
  };

  // menu items (placeholder)
  const menuItems = [
    { id: 'home', label: 'Home', icon: 'home', screen: 'Home' },
    { id: 'profile', label: 'Profile', icon: 'user', screen: 'MusicDetail' },
    { id: 'settings', label: 'Settings', icon: 'settings', screen: 'FullSongs' },
    { id: 'about', label: 'About', icon: 'info', screen: 'Player' },
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

      {/* Glass Mini-player Overlay */}
      <MiniPlayerOverlay
        song={currentSong}
        isPlaying={isPlaying}
        progressPercent={durationMillis && durationMillis > 0 ? (positionMillis / durationMillis) * 100 : 0}
        onPress={() => {
          (hookNav ?? navigation)?.navigate('Player' as any, { song: currentSong });
        }}
        onPlayPause={() => {
          setIsPlaying((p) => !p);
          togglePlay();
        }}
        onNext={() => next()}
        onPrev={() => prev()}
      />

      {/* Animated glass drawer (implemented inline so we avoid reanimated/worklets) */}
      {/*
        Behavior:
        - Drawer slides in from left covering ~75% width
        - Backdrop dims and is pressable to dismiss
        - Drawer interior uses BlurView + LinearGradient for premium glass look
      */}
      {isDrawerOpen ? (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          {/* Backdrop */}
          <TouchableWithoutFeedback onPress={closeDrawer}>
            <Animated.View style={[styles.overlay, overlayStyle]} />
          </TouchableWithoutFeedback>

          {/* Drawer container */}
          <Animated.View
            style={[
              styles.drawerContainer,
              drawerAnimatedStyle,
              { width: DRAWER_WIDTH, top : 0,bottom : 0, backgroundColor: 'transparent' },
            ]}
            pointerEvents="box-none"
          >
            
            <BlurView
              intensity={Platform.OS === 'ios' ? BLUR_INTENSITY_IOS : BLUR_INTENSITY_ANDROID}
              tint={isDark ? 'dark' : 'light'}
              style={styles.blur}
            >
              <LinearGradient
                colors={
                  isDark
                    ? ['rgba(20,20,20,0.82)', 'rgba(12,12,12,0.95)']
                    : ['rgba(255,255,255,0.82)', 'rgba(245,245,245,0.95)']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.gradient}
              >
                <SafeAreaView edges={['top', 'left', 'bottom']} style={styles.drawerSafe}>
                  <View style={styles.drawerHeader}>
                    <Text style={[styles.drawerTitle, { color: colors.text }]}>Menu</Text>
                    <TouchableOpacity onPress={closeDrawer} style={styles.drawerCloseBtn} accessibilityRole="button" accessibilityLabel="Close menu">
                      <Feather name="x" size={22} color={colors.text} />
                    </TouchableOpacity>
                  </View>

<View style={styles.menuList}>
  {menuItems.map((it) => (
    <Pressable
      key={it.id}
      onPress={() => handleDrawerNavigate(it.screen)}
      android_ripple={{ color: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.06)' }}
      style={({ pressed }) => [
        styles.menuItem,
        {
          backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
          borderColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
          opacity: pressed ? 0.4 : 1,
          transform: pressed ? [{ scale: 0.995 }] : [{ scale: 1 }],
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={it.label}
    >
      <Feather name={it.icon as any} size={20} color={colors.text} style={styles.menuIcon} />
      <Text style={[styles.menuLabel, { color: colors.text }]}>{it.label}</Text>
      <Feather name="chevron-right" size={18} color={colors.muted ?? 'rgba(0,0,0,0.4)'} />
    </Pressable>
  ))}

  {/* spacer to separate menu from footer and ensure footer sits at the bottom */}
  <View style={{ height: spacing.md }} />
</View>
                  <View style={styles.drawerFooter}>
                    <Text style={[styles.footerText, { color: colors.muted }]}>Music App v1.0 {"\n"}by Saw K Za</Text>
                  </View>
                </SafeAreaView>
              </LinearGradient>
            </BlurView>

            {/* glass edge */}
            <View pointerEvents="none" style={[styles.glassEdge, { borderRightColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]} />
          </Animated.View>
        </View>
      ) : null}
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
    marginBottom: spacing.xs,
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

  rowSeparator: { height: 0, backgroundColor: '#f7f7f8' },

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