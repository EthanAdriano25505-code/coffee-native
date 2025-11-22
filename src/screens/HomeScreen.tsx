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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation';
import { usePlayback } from '../contexts/PlaybackContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../utils/supabase';
import SongCard from '../components/SongCard';
import SearchBar from '../components/SearchBar';
import GlassDrawer from '../components/GlassDrawer';
import CenterMiniPill from '../components/CenterMiniPill';
import MiniPlayerOverlay from '../components/MiniPlayerOverlay';
import { glass } from '../theme/designTokens';

const { width, height } = Dimensions.get('window');
const isLargeScreen = Math.max(width, height) >= 768;
const BANNER_HEIGHT = Math.round(width * (isLargeScreen ? 0.35 : 0.45));
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
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  useEffect(() => setCurrentSong((ctxSong as Song) ?? null), [ctxSong]);
  useEffect(() => setIsPlaying(!!ctxPlaying), [ctxPlaying]);

  // Log whenever currentSong changes (so we can see the cover_url in Metro)
  useEffect(() => {
    console.log('player cover_url:', currentSong?.cover_url);
  }, [currentSong]);

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

      {/* Center Mini Pills */}
      <CenterMiniPill
        items={[
          { id: 'all', label: 'All' },
          { id: 'playlists', label: 'Playlists' },
          { id: 'albums', label: 'Albums' },
          { id: 'downloaded', label: 'Downloaded' },
        ]}
      />

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
  const listFooter = songs.length > 0 ? <View style={{ height: glass.miniPlayerHeight + (insets.bottom ?? 0) + 12 }} /> : null;

  return (
    <SafeAreaView style={[styles.safe, isDark && styles.safeDark, { position: 'relative' }]}>
      {/* Glass Drawer */}
      <GlassDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />

      {/* Top app header with menu and search */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setIsDrawerOpen(true)} style={styles.menuButton}>
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <SearchBar placeholder="Search music..." />
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

      {/* Mini Player Overlay */}
      {currentSong ? (
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
          onNext={next}
          onPrev={prev}
        />
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
    gap: 12,
    backgroundColor: '#fff',
  },
  menuButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  menuIcon: {
    fontSize: 24,
    fontWeight: '600',
  },

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
});

export default HomeScreen;