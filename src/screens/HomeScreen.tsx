import React, { useEffect, useState, useCallback } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  useColorScheme,
  FlatList,
  ListRenderItem,
  Animated,
  Image,
  Pressable,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation';
import { usePlayback } from '../contexts/PlaybackContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../utils/supabase';
import SongCard from '../components/SongCard';
import { Feather } from '@expo/vector-icons'; // Visual-only: Feather icons for modern UI
import BannerIllustration from '../assets/BannerIllustration'; // Visual-only: SVG illustration for banner

const { width, height } = Dimensions.get('window');
const isLargeScreen = Math.max(width, height) >= 768;
const BANNER_HEIGHT = Math.round(width * (isLargeScreen ? 0.35 : 0.45));
const PLAYER_HEIGHT = isLargeScreen ? 88 : 72;
const BASE_PADDING = 16;

// Visual-only: Design tokens for consistent modern UI
const CARD_RADIUS = 14;
const MINI_PLAYER_RADIUS = 18;
const FAB_SIZE = 56;
const SPACING_SM = 8;
const SPACING_MD = 12;
const SPACING_LG = 16;
const PRIMARY_COLOR = '#2f6dfd';
const ACCENT_COLOR = '#ffd166';

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
  const insets = useSafeAreaInsets();

  const { currentSong: ctxSong, isPlaying: ctxPlaying, positionMillis, durationMillis, play, pause, next, prev, togglePlay } = usePlayback();
  
  const [songs, setSongs] = useState<Song[]>([]);
  const [currentSong, setCurrentSong] = useState<Song | null>((ctxSong as Song) ?? null);
  const [isPlaying, setIsPlaying] = useState<boolean>(!!ctxPlaying);

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

  const ListHeader = () => (
    <View>
      {/* Banner - Visual-only: Replaced placeholder with SVG illustration */}
      <View style={[styles.bannerWrapper, { height: BANNER_HEIGHT }]}>
        <View style={styles.bannerCard}>
          <BannerIllustration width={width - BASE_PADDING * 2} height={BANNER_HEIGHT - 24} />
        </View>
      </View>

      {/* New Albums row */}
      <View style={styles.sectionHeaderCompact}>
        <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>New Albums</Text>
        <TouchableOpacity onPress={() => hookNav.navigate('FullSongs')}>
          <Text style={styles.seeAll}>See all</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.albumRow}>
        <View style={styles.albumCard}>
          <View style={[styles.albumThumb, isDark && styles.albumThumbDark]}>
            <Text style={styles.albumThumbText}>Album</Text>
          </View>
          <Text style={[styles.albumTitle, isDark && styles.albumTitleDark]}>Free songs</Text>
          <Text style={styles.albumArtist}> </Text>
        </View>

        <View style={styles.albumCard}>
          <View style={[styles.albumThumb, isDark && styles.albumThumbDark]}>
            <Text style={styles.albumThumbText}>Album</Text>
          </View>
          <Text style={[styles.albumTitle, isDark && styles.albumTitleDark]}>Teasers</Text>
          <Text style={styles.albumArtist}> </Text>
        </View>

        <View style={styles.albumCard}>
          <View style={[styles.albumThumb, isDark && styles.albumThumbDark]}>
            <Text style={styles.albumThumbText}>Album</Text>
          </View>
          <Text style={[styles.albumTitle, isDark && styles.albumTitleDark]}>Playlists</Text>
          <Text style={styles.albumArtist}> </Text>
        </View>
      </View>

      {/* Song List header */}
      <View style={[styles.sectionHeaderCompact, { marginTop: 6 }]}>
        <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>Song List</Text>
        <TouchableOpacity onPress={() => hookNav.navigate('FullSongs')}>
          <Text style={styles.seeAll}>See all</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

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
    <SafeAreaView style={[styles.safe, isDark && styles.safeDark, { position: 'relative' }]}>
      {/* Top app header - Visual-only: Modern header with Feather icons and search chip */}
      <View style={[styles.header, isDark && styles.headerDark]}>
        <Text style={[styles.headerTitle, isDark && styles.headerTitleDark]}>Music</Text>
        <View style={styles.headerActions}>
          {/* Visual-only: Search chip */}
          <TouchableOpacity 
            style={[styles.searchChip, isDark && styles.searchChipDark]}
            accessibilityLabel="Search"
            onPress={() => {
              // TODO: Attach existing search handler when available
              console.log('Search tapped');
            }}
          >
            <Feather name="search" size={16} color={isDark ? '#aaa' : '#666'} />
            <Text style={[styles.searchChipText, isDark && styles.searchChipTextDark]}>Search</Text>
          </TouchableOpacity>
          
          {/* Visual-only: Feather icons replace emojis */}
          <TouchableOpacity 
            style={styles.iconButton} 
            accessibilityLabel="Settings"
            onPress={() => {
              // TODO: Attach existing settings handler when available
              console.log('Settings tapped');
            }}
          >
            <Feather name="settings" size={22} color={isDark ? '#fff' : '#111'} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.profileButton, isDark && styles.profileButtonDark]}
            accessibilityLabel="Profile"
            onPress={() => {
              // TODO: Attach existing profile handler when available
              console.log('Profile tapped');
            }}
          >
            <Text style={[styles.profileInitials, isDark && styles.profileInitialsDark]}>JD</Text>
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
              {currentSong?.cover_url ? (
                <Image source={{ uri: currentSong.cover_url }} style={styles.playerArtImage} resizeMode="cover" />
              ) : (
                <View style={styles.playerArt}><Text style={styles.playerArtText}>Art</Text></View>
              )}

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
                onPress={(e) => { e?.stopPropagation?.(); prev(); }} 
                style={styles.controlBtn}
                accessibilityLabel="Previous"
              >
                <Feather name="skip-back" size={20} color="#fff" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={(e) => {
                  e?.stopPropagation?.();
                  setIsPlaying((p) => !p);
                  togglePlay();
                }}
                style={styles.playFab}
                accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
              >
                <Feather name={isPlaying ? 'pause' : 'play'} size={24} color="#111" />
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={(e) => { e?.stopPropagation?.(); next(); }} 
                style={styles.controlBtn}
                accessibilityLabel="Next"
              >
                <Feather name="skip-forward" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      ) : null}
    </SafeAreaView>
  );
};

const CARD = 108;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  safeDark: { backgroundColor: '#000' },

  // Visual-only: Modern header with search chip and Feather icons
  header: {
    paddingTop: SPACING_MD,
    paddingBottom: 10,
    paddingHorizontal: BASE_PADDING,
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
  },
  headerDark: { backgroundColor: '#121212' },
  headerTitle: { 
    fontSize: isLargeScreen ? 30 : 24, 
    fontWeight: '800', 
    letterSpacing: 0.5,
    color: '#111',
  },
  headerTitleDark: { color: '#fff' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: SPACING_SM },
  
  // Visual-only: Search chip with rounded background
  searchChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f3f5',
    paddingHorizontal: SPACING_MD,
    paddingVertical: SPACING_SM,
    borderRadius: 20,
    gap: 6,
  },
  searchChipDark: { backgroundColor: '#1a1a1a' },
  searchChipText: { fontSize: 14, color: '#666' },
  searchChipTextDark: { color: '#aaa' },
  
  iconButton: { 
    padding: SPACING_SM,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Visual-only: Circular avatar with proper contrast
  profileButton: { 
    width: 32, 
    height: 32, 
    borderRadius: 16, 
    backgroundColor: '#e6eeff',
    alignItems: 'center', 
    justifyContent: 'center',
  },
  profileButtonDark: { backgroundColor: '#1a1a2e' },
  profileInitials: { fontSize: 12, fontWeight: '700', color: '#2f6dfd' },
  profileInitialsDark: { color: '#7f9fff' },

  // Visual-only: Banner with SVG illustration in rounded card
  bannerWrapper: { 
    marginHorizontal: BASE_PADDING, 
    marginTop: SPACING_SM, 
    marginBottom: SPACING_MD,
  },
  bannerCard: { 
    flex: 1, 
    borderRadius: CARD_RADIUS, 
    backgroundColor: '#fff',
    alignItems: 'center', 
    justifyContent: 'center',
    padding: SPACING_MD,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },

  sectionHeaderCompact: { 
    marginHorizontal: BASE_PADDING, 
    marginTop: 6, 
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

  // Visual-only: Modern album cards with consistent rounded style and shadow
  albumRow: {
    flexDirection: 'row',
    marginTop: 10,
    marginBottom: 6,
    paddingHorizontal: BASE_PADDING,
    justifyContent: 'space-between',
  },
  albumCard: { width: (width - BASE_PADDING * 2 - 16) / 3 },
  albumThumb: { 
    height: CARD, 
    borderRadius: CARD_RADIUS, 
    backgroundColor: '#e6eaff',
    alignItems: 'center', 
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
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

  rowSeparator: { height: 10, backgroundColor: '#f7f7f8' },

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
    borderRadius: MINI_PLAYER_RADIUS, 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: SPACING_MD, 
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
    borderRadius: SPACING_SM, 
    backgroundColor: '#2a2a2a', 
    alignItems: 'center', 
    justifyContent: 'center',
  },
  playerArtText: { color: '#6b6b6b' },
  playerArtImage: { 
    width: 48, 
    height: 48, 
    borderRadius: SPACING_SM, 
    backgroundColor: '#2a2a2a',
  },

  playerMeta: { marginLeft: SPACING_MD, flex: 1 },
  playerTitle: { color: '#fff', fontSize: 14, fontWeight: '800' },
  playerArtist: { color: '#ccc', fontSize: 12, marginTop: 2 },
  
  // Visual-only: FAB-style circular play button with Feather icons
  playerControls: { flexDirection: 'row', alignItems: 'center', gap: SPACING_SM },
  controlBtn: { 
    padding: SPACING_SM,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playFab: { 
    backgroundColor: ACCENT_COLOR,
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    alignItems: 'center', 
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  
  progressContainer: { 
    height: 4, 
    backgroundColor: 'rgba(255,255,255,0.12)', 
    borderRadius: 2, 
    overflow: 'hidden', 
    marginTop: SPACING_SM, 
    alignSelf: 'stretch',
  },
  progressFill: { 
    height: '100%', 
    backgroundColor: PRIMARY_COLOR, 
    borderRadius: 2, 
    width: '0%',
  },
});

export default HomeScreen;