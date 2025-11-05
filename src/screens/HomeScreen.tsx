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

const { width, height } = Dimensions.get('window');
const isLargeScreen = Math.max(width, height) >= 768;
const BANNER_HEIGHT = Math.round(width * (isLargeScreen ? 0.35 : 0.45));
const PLAYER_HEIGHT = isLargeScreen ? 88 : 72;
const BASE_PADDING = 16;

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
      {/* Banner */}
      <View style={[styles.bannerWrapper, { height: BANNER_HEIGHT }]}>
        <View style={styles.bannerPlaceholder}><Text style={styles.bannerText}>Banner Placeholder</Text></View>
      </View>

      {/* New Albums row */}
      <View style={styles.sectionHeaderCompact}>
        <Text style={styles.sectionTitle}>New Albums</Text>
        <TouchableOpacity onPress={() => hookNav.navigate('FullSongs')}>
          <Text style={styles.seeAll}>See all</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.albumRow}>
        <View style={styles.albumCard}>
          <View style={styles.albumThumb}><Text style={styles.albumThumbText}>Album</Text></View>
          <Text style={styles.albumTitle}>Free songs</Text>
          <Text style={styles.albumArtist}> </Text>
        </View>

        <View style={styles.albumCard}>
          <View style={styles.albumThumb}><Text style={styles.albumThumbText}>Album</Text></View>
          <Text style={styles.albumTitle}>Teasers</Text>
          <Text style={styles.albumArtist}> </Text>
        </View>

        <View style={styles.albumCard}>
          <View style={styles.albumThumb}><Text style={styles.albumThumbText}>Album</Text></View>
          <Text style={styles.albumTitle}>Playlists</Text>
          <Text style={styles.albumArtist}> </Text>
        </View>
      </View>

      {/* Song List header */}
      <View style={[styles.sectionHeaderCompact, { marginTop: 6 }]}>
        <Text style={styles.sectionTitle}>Song List</Text>
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
      {/* Top app header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Music</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconButton}><Text style={styles.iconText}>⚙️</Text></TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}><Text style={styles.iconText}>🔍</Text></TouchableOpacity>
          <TouchableOpacity style={styles.profileButton}><Text style={styles.profileInitials}>JD</Text></TouchableOpacity>
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

      {/* Player anchored to bottom (tappable area navigates to Player) */}
      {currentSong ? (
        <Pressable
          onPress={() => {
            (hookNav ?? navigation)?.navigate('Player' as any, { song: currentSong });
          }}
          style={[styles.playerBar, { height: PLAYER_HEIGHT, bottom: (insets.bottom ?? 0) + 6 }]}
          pointerEvents="box-none"
        >
          {/* playerInner remains interactive — child touchables will handle their own presses */}
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

                {/* progress bar (existing styles) */}
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

            {/* keep player controls functional; tapping these should not navigate */}
            <View style={styles.playerControls}>
              <TouchableOpacity onPress={(e) => { e?.stopPropagation?.(); prev(); }} style={styles.controlBtn}>
                <Text style={styles.controlText}>⏮</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={(e) => {
                  e?.stopPropagation?.();
                  // optimistic UI toggle
                  setIsPlaying((p) => !p);
                  // call context toggle quickly (do not await)
                  togglePlay();
                }}
                style={[styles.controlBtn, styles.playControl]}
              >
                <Text style={styles.controlText}>{isPlaying ? '⏸' : '▶️'}</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={(e) => { e?.stopPropagation?.(); next(); }} style={styles.controlBtn}>
                <Text style={styles.controlText}>⏭</Text>
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

  header: {
    paddingTop: 12,
    paddingBottom: 10,
    paddingHorizontal: BASE_PADDING,
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
  },
  headerTitle: { fontSize: isLargeScreen ? 30 : 24, fontWeight: '800', letterSpacing: 0.5 },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  iconButton: { paddingHorizontal: 8, paddingVertical: 6, marginLeft: 8 },
  iconText: { fontSize: 18 },
  profileButton: { marginLeft: 10, width: 32, height: 32, borderRadius: 16, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  profileInitials: { fontSize: 12, fontWeight: '700', color: '#111' },

  bannerWrapper: { marginHorizontal: BASE_PADDING, marginTop: 8, marginBottom: 12 },
  bannerPlaceholder: { flex: 1, borderRadius: 14, backgroundColor: '#e9e7e5', alignItems: 'center', justifyContent: 'center' },
  bannerText: { color: '#666', fontSize: isLargeScreen ? 18 : 16 },

  sectionHeaderCompact: { marginHorizontal: BASE_PADDING, marginTop: 6, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: isLargeScreen ? 20 : 18, fontWeight: '700' },
  seeAll: { color: '#999', fontSize: 13 },

  albumRow: {
    flexDirection: 'row',
    marginTop: 10,
    marginBottom: 6,
    paddingHorizontal: BASE_PADDING,
    justifyContent: 'space-between',
  },
  albumCard: { width: (width - BASE_PADDING * 2 - 16) / 3, },
  albumThumb: { height: CARD, borderRadius: 14, backgroundColor: '#e6eaff', alignItems: 'center', justifyContent: 'center' },
  albumThumbText: { color: '#667', fontWeight: '700' },
  albumTitle: { marginTop: 10, fontWeight: '700' },
  albumArtist: { color: '#777', marginTop: 2 },

  topSongList: { marginTop: 6, marginHorizontal: BASE_PADDING },
  songRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: BASE_PADDING, paddingVertical: 14, backgroundColor: '#fff',
  },
  rowSeparator: { height: 10, backgroundColor: '#f7f7f8' },

  // image for list thumbnail
  songThumbImage: { width: 48, height: 48, borderRadius: 10, backgroundColor: '#f3e6ff', marginRight: 12 },

  songMeta: { flex: 1 },
  songTitle: { fontSize: 16, fontWeight: '700' },
  songArtist: { fontSize: 13, color: '#666', marginTop: 4 },
  playLink: { color: '#2f6dfd', fontWeight: '700' },

  playerBar: { position: 'absolute', left: 0, right: 0, paddingHorizontal: BASE_PADDING, zIndex: 20 },
  playerInner: { height: PLAYER_HEIGHT - 8, backgroundColor: '#111', borderRadius: 18, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, elevation: 6 },
  playerInnerDark: { backgroundColor: '#121212' },
  playerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },

  // player image
  playerArt: { width: 48, height: 48, borderRadius: 8, backgroundColor: '#2a2a2a', alignItems: 'center', justifyContent: 'center' },
  playerArtText: { color: '#6b6b6b' },
  playerArtImage: { width: 48, height: 48, borderRadius: 8, backgroundColor: '#2a2a2a' },

  playerMeta: { marginLeft: 12, flex: 1 },
  playerTitle: { color: '#fff', fontSize: 14, fontWeight: '800' },
  playerArtist: { color: '#ccc', fontSize: 12, marginTop: 2 },
  playerControls: { flexDirection: 'row', alignItems: 'center' },
  controlBtn: { paddingHorizontal: 8 },
  playControl: { backgroundColor: '#fff', borderRadius: 24, padding: 8, marginHorizontal: 6 },
  controlText: { fontSize: 18, color: '#111' },
  progressContainer: { height: 4, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 2, overflow: 'hidden', marginTop: 8, alignSelf: 'stretch', },
  progressFill: { height: '100%', backgroundColor: '#2f6dfd', borderRadius: 2, width: '0%', },
});

export default HomeScreen;