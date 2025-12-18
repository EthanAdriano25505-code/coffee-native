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
  ImageBackground,
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
import MiniPlayer from '../components/MiniPlayer';

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

const CATEGORIES = [
  { name: 'DJ', image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&q=80', featured: true },
  { name: 'Pop', image: 'https://images.unsplash.com/photo-1514525253440-b393452e8d26?w=800&q=80' },
  { name: 'Rock', image: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=800&q=80' },
  { name: 'Hip Hop', image: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800&q=80' },
  { name: 'R&B', image: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=800&q=80' },
  { name: 'Country', image: 'https://images.unsplash.com/photo-1530259042678-cfa97d67edeb?w=800&q=80' },
  { name: 'Jazz', image: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=800&q=80' },
  { name: 'Classical', image: 'https://images.unsplash.com/photo-1507838153414-b4b713384ebd?w=800&q=80' },
  { name: 'Lo-fi', image: 'https://images.unsplash.com/photo-1494232410401-ad00d5433cfa?w=800&q=80' },
  { name: 'Electronic', image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&q=80' },
  { name: 'Workout', image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80' },
  { name: 'Chill', image: 'https://images.unsplash.com/photo-1499415479124-43c32433a620?w=800&q=80' },
  { name: 'Soul', image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&q=80' },
  { name: 'Blues', image: 'https://images.unsplash.com/photo-1525441273400-056e9c7517b3?w=800&q=80' },
  { name: 'Metal', image: 'https://images.unsplash.com/photo-1528645238318-22cc5cc019a7?w=800&q=80' },
  { name: 'Indie', image: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=800&q=80' },
];

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

        {/* Categories / Albums Row (Restored) */}
        <View style={{ paddingHorizontal: spacing.md, marginBottom: spacing.lg, marginTop: spacing.sm }}>
           <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: isDark ? '#FFF' : '#111' }}>Categories</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Search')}>
                <Text style={{ fontSize: 13, color: '#999' }}>See all</Text>
              </TouchableOpacity>
           </View>
           <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -spacing.md }} contentContainerStyle={{ paddingHorizontal: spacing.md }}>
              {CATEGORIES.map((item, idx) => {
                 return (
                   <TouchableOpacity 
                    key={idx} 
                    activeOpacity={0.9}
                    style={{ marginRight: spacing.md, width: 160, height: 100, borderRadius: radii.normal, overflow: 'hidden', elevation: 5, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8 }}
                    onPress={() => navigation.navigate('CategorySongs', { filter: item.name, title: item.name })}
                   >
                      <ImageBackground
                        source={{ uri: item.image }}
                        style={{ width: '100%', height: '100%', justifyContent: 'flex-end' }}
                        imageStyle={{ borderRadius: radii.normal }}
                      >
                        <LinearGradient
                          colors={['transparent', 'rgba(0,0,0,0.2)', 'rgba(0,0,0,0.8)']}
                          locations={[0, 0.5, 1]}
                          style={{ padding: spacing.sm, height: '100%', justifyContent: 'flex-end' }}
                        >
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '800', textShadowColor: 'rgba(0, 0, 0, 0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 }}>{item.name}</Text>
                            <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' }}>
                              <Feather name="music" size={10} color="rgba(255,255,255,0.8)" />
                            </View>
                          </View>
                        </LinearGradient>
                      </ImageBackground>
                   </TouchableOpacity>
                 );
              })}
           </ScrollView>
        </View>

        <View style={styles.sectionHeaderCompact}>
          <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark, { fontSize: 28, textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: '800' }]}>Song List</Text>
          <TouchableOpacity onPress={() => hookNav.navigate('FullSongs')}>
            <Feather name="more-horizontal" size={24} color={isDark ? '#FFF' : '#111'} />
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

  const renderSongItem: ListRenderItem<Song> = useCallback(({ item, index }) => (
    <View style={{ paddingHorizontal: spacing.sm }}>
      <SongCard 
        song={item} 
        onPress={() => onCardPress(item)} 
        index={index}
        isActive={currentSong?.id === item.id}
      />
    </View>
  ), [onCardPress, currentSong]);

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
    <LinearGradient
      colors={isDark ? ['#121212', '#1c1c1e', '#2c2c2e'] : ['#FFFFFF', '#F9FAFB', '#F3F4F6']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      {/* Background Glow Blobs */}
      {isDark && (
        <>
          <View style={[styles.glowBlob, { top: '10%', left: '-10%', backgroundColor: 'rgba(47, 128, 237, 0.15)', width: 300, height: 300 }]} />
          <View style={[styles.glowBlob, { top: '40%', right: '-20%', backgroundColor: 'rgba(255, 215, 0, 0.08)', width: 400, height: 400 }]} />
          <View style={[styles.glowBlob, { bottom: '10%', left: '20%', backgroundColor: 'rgba(47, 128, 237, 0.1)', width: 350, height: 350 }]} />
        </>
      )}
    <SafeAreaView
      style={[styles.safe, { backgroundColor: 'transparent' }, { position: 'relative' }]}
      edges={['left', 'right', 'bottom']}
    >
      {/* Header */}
      <View style={[styles.header, isDark && styles.headerDark, { paddingTop: insets.top + 3 }]}>
        <Text style={[styles.headerTitle, isDark && styles.headerTitleDark]}>Music</Text>
        <View style={styles.headerActions}>
          <SearchBar
            onPress={() => navigation.navigate('Search')}
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
        style={{ flex: 1 }}
        contentContainerStyle={{ backgroundColor: 'transparent', paddingBottom: 20 }}
        ItemSeparatorComponent={() => <View style={styles.rowSeparator} />}
        showsVerticalScrollIndicator={false}
        initialNumToRender={8}
        windowSize={9}
        removeClippedSubviews={true}
      />

      {/* Mini-player */}
      {currentSong ? (
        <View
          style={[styles.playerBar, { bottom: (insets.bottom ?? 0), paddingHorizontal: 0 }]}
          pointerEvents="box-none"
        >
          <MiniPlayer
            song={currentSong}
            isPlaying={isPlaying}
            progress={durationMillis ? positionMillis / durationMillis : 0}
            onPress={() => {
              (hookNav ?? navigation)?.navigate('Player' as any, { song: currentSong });
            }}
            onPlayPause={() => {
              setIsPlaying((p) => !p);
              togglePlay();
            }}
            onNext={() => next()}
          />
        </View>
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
        onNavigate={(screen: string) => {
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
    </LinearGradient>
  );
};

const CARD = 108;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  safeDark: { backgroundColor: 'transparent' },

  glowBlob: {
    position: 'absolute',
    borderRadius: 1000,
    opacity: 0.6,
    // Use blur if possible, but since we are in a safe path, we'll just use opacity and large radius
    // If expo-blur is available, we could use it, but absolute positioned views with large radius work too
  },

  header: {
    paddingTop: 6,
    paddingBottom: 3,
    paddingHorizontal: BASE_PADDING,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
    gap: spacing.sm,
  },
  headerDark: { backgroundColor: 'transparent' },
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