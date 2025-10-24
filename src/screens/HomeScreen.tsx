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
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation';
import { usePlayback } from '../contexts/PlaybackContext';
import { supabase } from '../utils/supabase'; // adjust path if needed

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
};

const HomeScreen: React.FC = () => {
  const hookNav = useNavigation<HomeNavProp>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

  const { currentSong: ctxSong, isPlaying: ctxPlaying, play, pause, next, prev } = usePlayback();

  const [songs, setSongs] = useState<Song[]>([]);
  const [currentSong, setCurrentSong] = useState<Song | null>((ctxSong as Song) ?? null);
  const [isPlaying, setIsPlaying] = useState<boolean>(!!ctxPlaying);

  useEffect(() => setCurrentSong((ctxSong as Song) ?? null), [ctxSong]);
  useEffect(() => setIsPlaying(!!ctxPlaying), [ctxPlaying]);

  const fetchTopSongs = useCallback(async () => {
    try {
      const selectCols = 'id,title,artist,audio_url,created_at';
      const { data, error } = await supabase
        .from('songs')
        .select(selectCols)
        .order('created_at', { ascending: false })
        .limit(8);

      if (error) {
        console.warn('fetchTopSongs error:', error);
        setSongs([]);
      } else {
        setSongs((data as Song[]) || []);
      }
    } catch (err) {
      console.warn('fetchTopSongs exception:', err);
      setSongs([]);
    }
  }, []);

  useEffect(() => {
    fetchTopSongs();
  }, [fetchTopSongs]);

  const handlePressSong = async (song: Song) => {
    setCurrentSong(song);
    const uri = song.audio_url ? { uri: song.audio_url } : require('../assets/sample-teaser.mp3');
    await play({ id: song.id, title: song.title, artist: song.artist, uri } as any);
  };

  const handlePlayPause = async () => {
    if (isPlaying) await pause();
    else if (currentSong) {
      const uri = currentSong.audio_url ? { uri: currentSong.audio_url } : require('../assets/sample-teaser.mp3');
      await play({ id: currentSong.id, title: currentSong.title, artist: currentSong.artist, uri } as any);
    }
  };

  const renderSongItem: ListRenderItem<Song> = ({ item }) => (
    <TouchableOpacity onPress={() => handlePressSong(item)} style={styles.topSongRow}>
      <View style={styles.songThumbPlaceholder}><Text style={styles.placeholderText}>Img</Text></View>
      <View style={styles.songMeta}>
        <Text style={styles.songTitle}>{item.title}</Text>
        <Text style={styles.songArtist}>{item.artist}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.safe, isDark && styles.safeDark, { position: 'relative', flex: 1 }]}>
      {/* Main content - reserve space at bottom so player doesn't overlap */}
      <View style={[styles.container, isDark && styles.containerDark, { paddingBottom: PLAYER_HEIGHT + (insets.bottom ?? 0) }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Music</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconButton}><Text style={styles.iconText}>⚙️</Text></TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}><Text style={styles.iconText}>🔍</Text></TouchableOpacity>
            <TouchableOpacity style={styles.profileButton}><Text style={styles.profileInitials}>JD</Text></TouchableOpacity>
          </View>
        </View>

        <View style={[styles.bannerWrapper, { height: BANNER_HEIGHT }]}>
          <View style={styles.bannerPlaceholder}><Text style={styles.bannerText}>Banner</Text></View>
        </View>

        <View style={styles.menuRow}>
          <TouchableOpacity style={styles.menuButton} onPress={() => hookNav.navigate('FullSongs')}><Text style={styles.menuButtonText}>Free</Text></TouchableOpacity>
          <TouchableOpacity style={styles.menuButton}><Text style={styles.menuButtonText}>Teasers</Text></TouchableOpacity>
          <TouchableOpacity style={styles.menuButton}><Text style={styles.menuButtonText}>Playlist</Text></TouchableOpacity>
          <View style={{ flex: 1 }} />
          <TouchableOpacity><Text style={styles.seeAll}>See all</Text></TouchableOpacity>
        </View>

        <View style={styles.sectionHeaderCompact}>
          <Text style={styles.sectionTitle}>Top songs</Text>
          <TouchableOpacity onPress={() => hookNav.navigate('FullSongs')}><Text style={styles.seeAll}>See all</Text></TouchableOpacity>
        </View>

        <View style={styles.topSongList}>
          <FlatList
            data={songs}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderSongItem}
            // allow scrolling so the list uses the available space instead of expanding the layout
            ListEmptyComponent={null}
            contentContainerStyle={undefined}
          />
        </View>
      </View>

      {/* Player anchored to SafeAreaView bottom */}
      <View style={[styles.playerBar, { height: PLAYER_HEIGHT, bottom: (insets.bottom ?? 0) }]} pointerEvents="box-none">
        <View style={[styles.playerInner, isDark && styles.playerInnerDark]}>
          <View style={styles.playerLeft}>
            <View style={styles.playerThumbPlaceholder}><Text style={styles.placeholderText}>Art</Text></View>
            <View style={styles.playerMeta}>
              <Text style={styles.playerTitle} numberOfLines={1}>{currentSong?.title ?? ''}</Text>
              <Text style={styles.playerArtist}>{currentSong?.artist ?? ''}</Text>
            </View>
          </View>
          <View style={styles.playerControls}>
            <TouchableOpacity onPress={prev} style={styles.controlBtn}><Text style={styles.controlText}>⏮</Text></TouchableOpacity>
            <TouchableOpacity onPress={handlePlayPause} style={[styles.controlBtn, styles.playControl]}><Text style={styles.controlText}>{isPlaying ? '⏸' : '▶️'}</Text></TouchableOpacity>
            <TouchableOpacity onPress={next} style={styles.controlBtn}><Text style={styles.controlText}>⏭</Text></TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  safeDark: { backgroundColor: '#000' },
  container: { flex: 1, backgroundColor: '#f7f7f8' },
  containerDark: { backgroundColor: '#000' },
  header: {
    paddingTop: 27,
    paddingBottom: 12,
    paddingHorizontal: BASE_PADDING,
    height: 76,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
  },
  headerTitle: { fontSize: isLargeScreen ? 32 : 24, fontWeight: '800', letterSpacing: 0.5 },
  bannerWrapper: { marginHorizontal: BASE_PADDING, marginTop: 8, marginBottom: 9 },
  bannerPlaceholder: { flex: 1, borderRadius: 14, backgroundColor: '#e9e7e5', alignItems: 'center', justifyContent: 'center' },
  bannerText: { color: '#666', fontSize: isLargeScreen ? 18 : 16 },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  iconButton: { paddingHorizontal: 8, paddingVertical: 6, marginLeft: 8 },
  iconText: { fontSize: 18 },
  profileButton: { marginLeft: 10, width: 36, height: 36, borderRadius: 18, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  profileInitials: { fontSize: 13, fontWeight: '700', color: '#111' },

  menuRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: BASE_PADDING, marginBottom: 2 },
  menuButton: { backgroundColor: '#e6eaff', borderRadius: 20, paddingVertical: 6, paddingHorizontal: 20, marginRight: 9 },
  menuButtonText: { color: '#334', fontWeight: '800', fontSize: 14 },

  sectionHeaderCompact: { marginHorizontal: BASE_PADDING, marginTop: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: isLargeScreen ? 20 : 16, fontWeight: '700', paddingTop: 6 },
  seeAll: { color: '#999', fontSize: 13 },
  topSongList: { marginTop: 6, marginHorizontal: BASE_PADDING },
  topSongRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, backgroundColor: '#fff', borderRadius: 10, padding: 10 },
  songThumbPlaceholder: { width: 48, height: 48, borderRadius: 8, backgroundColor: '#f3e6ff', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  songMeta: { flex: 1 },
  songTitle: { fontSize: 15, fontWeight: '700' },
  songArtist: { fontSize: 13, color: '#666', marginTop: 4 },

  playerBar: { position: 'absolute', left: 0, right: 0, paddingHorizontal: BASE_PADDING, zIndex: 20 },
  playerInner: { height: PLAYER_HEIGHT - 8, backgroundColor: '#111', borderRadius: 18, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, elevation: 6 },
  playerInnerDark: { backgroundColor: '#121212' },
  playerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  playerThumbPlaceholder: { width: 48, height: 48, borderRadius: 8, backgroundColor: '#2a2a2a', alignItems: 'center', justifyContent: 'center' },
  playerMeta: { marginLeft: 12, flex: 1 },
  playerTitle: { color: '#fff', fontSize: 14, fontWeight: '800' },
  playerArtist: { color: '#ccc', fontSize: 12, marginTop: 2 },
  playerControls: { flexDirection: 'row', alignItems: 'center' },
  controlBtn: { paddingHorizontal: 8 },
  playControl: { backgroundColor: '#fff', borderRadius: 24, padding: 8, marginHorizontal: 6 },
  controlText: { fontSize: 18 },
  placeholderText: { color: '#6b6b6b' },
});

export default HomeScreen;