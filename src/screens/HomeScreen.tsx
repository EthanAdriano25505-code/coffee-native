import React, { useEffect, useState, useCallback } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { usePlayback } from '../contexts/PlaybackContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../utils/supabase';
import SongCard from '../components/SongCard';
import { Feather } from '@expo/vector-icons'; // Visual-only: Feather icons for modern UI
import BannerIllustration from '../assets/BannerIllustration'; // Visual-only: SVG illustration for banner
import BannerSlider from '../components/BannerSlider'; // Visual-only: Auto-advancing banner slider
import SearchBar from '../components/SearchBar'; // Visual-only: Expanded search bar
import RemoteImage from '../components/RemoteImage'; // standardized remote image wrapper
import GlassDrawer from '../components/GlassDrawer'; // Liquid glass drawer for navigation menu
import { spacing, radii, sizes, elevation, getColors } from '../theme/designTokens'; // Visual-only: Design tokens
import { tokens } from '../theme/designTokens';

const { width, height } = Dimensions.get('window');
const isLargeScreen = Math.max(width, height) >= 768;
const BANNER_HEIGHT = Math.round(width * (isLargeScreen ? 0.35 : 0.45));
const PLAYER_HEIGHT = isLargeScreen ? 88 : 72;
const BASE_PADDING = spacing.md; // Use design token

type HomeNavProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

type Song = {
  id: string | number;
  title: string;
  artist?: string | null;
  audio_url?: string | null;
  cover_url?: string | null;
  created_at?: string | null;
};

const HomeScreen: React.FC = () => {
  console.log('HomeScreen loaded: src/screens/HomeScreen.tsx');
  
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
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false); // Glass drawer state

  useEffect(() => setCurrentSong((ctxSong as Song) ?? null), [ctxSong]);
  useEffect(() => setIsPlaying(!!ctxPlaying), [ctxPlaying]);

  // Log whenever currentSong changes (so we can see the cover_url in Metro)
  useEffect(() => {
    console.log('player cover_url:', currentSong?.cover_url);
  }, [currentSong]);

  // Animated progress ref for mini-player
  const progressAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const progressPercent = durationMillis && durationMillis > 0 ? (positionMillis / durationMillis) * 100 : 0;
    Animated.timing(progressAnim, {
      toValue: progressPercent,
      duration: 300, // small smoothing
      useNativeDriver: false, // width can't use native driver
    }).start();
  }, [positionMillis, durationMillis, progressAnim]);

  const fetchSongs = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('songs')
        .select('id,title,artist,audio_url,cover_url,teaser_url,is_available,created_at,popularity')
        .order('created_at', { ascending: false })
        .limit(30);
      
      console.log('HomeScreen fetch result:', { data, error });

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

  const handlePressSong = async (song: Song) => {
    // update local UI immediately so the list shows the selected song
    setCurrentSong(song);

    // prepare uri (use audio if available, otherwise undefined)
    const uri = song.audio_url ? { uri: song.audio_url } : undefined;

    // IMPORTANT: include cover_url so PlaybackContext.currentSong keeps artwork
    const payload = {
      id: song.id,
      title: song.title,
      artist: song.artist ?? undefined,
      cover_url: song.cover_url ?? undefined,
      uri,
    };
    await play(payload);
  };

  const handlePlayPause = async () => {
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
  };

  const ListHeader = () => {
    // Visual-only: Memoize banner slides to prevent re-creation during audio playback
    // This prevents banner slider glitches when positionMillis updates cause re-renders
    const bannerSlides = React.useMemo(() => [
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
      // When Supabase banner data is available, fetch and map here
    ], []); // Empty dependency array since banners are static

    return (
      <View>
        {/* Banner - Visual-only: Auto-advancing BannerSlider every 5 seconds */}
        <View style={[styles.bannerWrapper, { height: BANNER_HEIGHT }]}>
          <BannerSlider slides={bannerSlides} autoAdvanceMs={5000} height={BANNER_HEIGHT} />
        </View>

        {/* New Albums row */}
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

        {/* Song List header */}
        <View style={styles.sectionHeaderCompact}>
          <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>Song List</Text>
          <TouchableOpacity onPress={() => hookNav.navigate('FullSongs')}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const onCardPress = (song: Song) => {
    // start playback quickly (do not await so navigation feels instant)
    const payload = {
      id: song.id,
      title: song.title,
      artist: song.artist ?? undefined,
      cover_url: song.cover_url ?? undefined,
      uri: song.audio_url ? { uri: song.audio_url } : undefined,
    };
    play(payload);

    // navigate to Player screen and pass song as param
    navigation.navigate('Player', { song });
  };

  const renderSongItem: ListRenderItem<Song> = ({ item }) => <SongCard song={item} onPress={() => onCardPress(item)} />;

  // Use a footer spacer to reserve space for the player only when items exist.
  const listFooter = songs.length > 0 ? <View style={{ height: PLAYER_HEIGHT + (insets.bottom ?? 0) + 12 }} /> : null;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }, isDark && styles.safeDark, { position: 'relative' }]} edges={['left', 'right', 'bottom']}>
      {/* Top app header - Visual-only: Header positioned close to status bar to match screenshot */}
      <View style={[styles.header, isDark && styles.headerDark, { paddingTop: insets.top + 3 }]}>
        <Text style={[styles.headerTitle, isDark && styles.headerTitleDark]}>Music</Text>
        <View style={styles.headerActions}>
          {/* Visual-only: Expanded SearchBar component */}
          <SearchBar
            onPress={() => {
              // TODO: Attach existing search handler when available
              console.log('Search tapped');
            }}
            placeholder="Search songs, artists..."
          />
          
          {/* Visual-only: Menu icon opens glass drawer */}
          <TouchableOpacity
            style={styles.iconButton}
            accessibilityLabel="Open menu"
            accessibilityHint="Open navigation menu"
            onPress={() => setIsDrawerOpen(true)}
          >
            <Feather name="menu" size={22} color={isDark ? '#fff' : '#111'} />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={songs}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderSongItem}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={null}
        ListFooterComponent={listFooter}
        contentContainerStyle={{ backgroundColor: isDark ? '#000' : '#f7f7f8' }}
        ItemSeparatorComponent={() => <View style={styles.rowSeparator} />}
        showsVerticalScrollIndicator={false}
      />

      {/* Mini-player - Visual-only: FAB-style circular play button with progress bar */}
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

                {/* Visual-only: Progress bar above controls */}
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

            {/* Visual-only: Mini-player controls with Feather icons and circular FAB play button */}
            <View style={styles.playerControls}>
              <TouchableOpacity
                onPress={() => prev()}
                style={styles.controlBtn}
                accessibilityLabel="Previous"
              >
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

              <TouchableOpacity
                onPress={() => next()}
                style={styles.controlBtn}
                accessibilityLabel="Next"
              >
                <Feather name="skip-forward" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      ) : null}

      {/* Glass drawer - liquid glassmorphism navigation menu */}
      <GlassDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onNavigate={(screen) => {
          console.log('Navigate to:', screen);
          // TODO: Implement navigation to Profile, Settings, About screens
          // For now, navigate to FullSongs as fallback
          hookNav.navigate('FullSongs');
        }}
      />
    </SafeAreaView>
  );
};

const CARD = 108;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  safeDark: { backgroundColor: '#000' },

  // Visual-only: Modern header positioned close to status bar
  header: {
    paddingTop: 6, // small top offset to avoid notch while matching screenshot
    paddingBottom: 3, // reduced from 10 for tighter spacing
    paddingHorizontal: BASE_PADDING,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    gap: spacing.sm, // reduced from spacing.md for tighter layout
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

  // Visual-only: Banner with tighter spacing
  bannerWrapper: { 
    marginHorizontal: BASE_PADDING, 
    marginTop: spacing.md, // tighter top margin
    marginBottom: spacing.xs, // reduced from spacing.sm
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
  marginTop: 2,         // tiny top gap so SongList header is very close
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

  // Visual-only: Modern album cards with tighter spacing
  albumRow: {
  flexDirection: 'row',
  marginTop: spacing.sm,
  marginBottom: 0,      // removed bottom gap so SongList moves up
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

  // Visual-only: Mini-player bar anchored to bottom with modern FAB
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
  
  // Visual-only: FAB-style circular play button with Feather icons
  playerControls: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  controlBtn: { 
    padding: spacing.sm,
    minWidth: sizes.touchTarget,
    minHeight: sizes.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playFab: { 
    backgroundColor: '#ffd166', // accent color
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
    backgroundColor: '#2f6dfd', // primary color
    borderRadius: 2, 
    width: '0%',
  },
});

export default HomeScreen;