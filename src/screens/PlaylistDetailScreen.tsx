import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  Alert,
  Modal,
  Image,
  ListRenderItem,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { getColors, spacing, radii } from '../theme/designTokens';
import { supabase } from '../utils/supabase';
import SongCard from '../components/SongCard';
import { RootStackParamList } from '../navigation/types';
import { usePlayback } from '../contexts/PlaybackContext';

type PlaylistDetailRouteProp = RouteProp<RootStackParamList, 'PlaylistDetail'>;

type Song = {
  id: string | number;
  title: string;
  artist?: string | null;
  cover_url?: string | null;
  audio_url?: string | null;
  uri?: { uri: string };
  is_purchased?: boolean;
  is_teaser?: boolean;
  is_available?: boolean;
  created_at?: string;
  popularity?: number;
  teaser_url?: string | null;
};

// Mock songs data (fallback)
const MOCK_SONGS: Song[] = [
  { id: '1', title: 'Ocean Eyes', artist: 'Billie Eilish', cover_url: 'https://via.placeholder.com/150', is_purchased: true },
  { id: '2', title: 'Blinding Lights', artist: 'The Weeknd', cover_url: 'https://via.placeholder.com/150', is_purchased: true },
  { id: '3', title: 'Levitating', artist: 'Dua Lipa', cover_url: 'https://via.placeholder.com/150', is_teaser: true },
  { id: '4', title: 'Peaches', artist: 'Justin Bieber', cover_url: 'https://via.placeholder.com/150', is_teaser: true },
  { id: '5', title: 'Save Your Tears', artist: 'The Weeknd', cover_url: 'https://via.placeholder.com/150' },
];

export default function PlaylistDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<PlaylistDetailRouteProp>();
  const { playlistId, title, type } = route.params;
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = getColors(isDark);
  const { play } = usePlayback();
  const [songs, setSongs] = useState<Song[]>([]);
  const [availableSongs, setAvailableSongs] = useState<Song[]>([]);
  const [isAddModalVisible, setAddModalVisible] = useState(false);

  useEffect(() => {
    fetchSongs();
    fetchAvailableSongs();
  }, [playlistId, type]);

  const fetchAvailableSongs = async () => {
    try {
      const { data, error } = await supabase
        .from('songs')
        .select('id,title,artist,audio_url,cover_url,teaser_url,is_available,created_at,popularity')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.warn('fetchAvailableSongs error:', error);
      } else {
        setAvailableSongs(data || []);
      }
    } catch (err) {
      console.warn('fetchAvailableSongs exception:', err);
    }
  };

  const fetchSongs = async () => {
    // TODO: Fetch real data from Supabase based on playlistId/type
    let filteredSongs: Song[] = [];
    if (type === 'purchased') {
      filteredSongs = MOCK_SONGS.filter(s => s.is_purchased);
    } else if (type === 'teasers') {
      filteredSongs = MOCK_SONGS.filter(s => s.is_teaser);
    } else {
      // Custom playlist - just show all non-special songs for demo
      // For a new empty playlist, this might be empty initially
      // But for demo purposes, let's start with empty if it's a new custom playlist
      // or some random ones if it's "My Favorites" (mocked in PlaylistsScreen)
      if (title === 'My Favorites') {
         filteredSongs = MOCK_SONGS.slice(0, 3);
      } else if (title === 'Workout Mix') {
         filteredSongs = MOCK_SONGS.slice(2, 4);
      } else {
         filteredSongs = [];
      }
    }
    setSongs(filteredSongs);
  };

  const handlePlaySong = (song: Song, index: number) => {
    // Construct payload compatible with PlaybackContext
    const uri = song.audio_url ? { uri: song.audio_url } : song.uri;
    const payload = {
      ...song,
      uri: uri,
      cover_url: song.cover_url, // Ensure cover_url is passed
    };
    
    // Play the selected song
    play(payload);
    navigation.navigate('Player');
  };

  const handleAddSong = () => {
    setAddModalVisible(true);
  };

  const addSongToPlaylist = (song: Song) => {
    if (songs.find(s => s.id === song.id)) {
      Alert.alert('Already added', 'This song is already in the playlist');
      return;
    }
    setSongs(prev => [...prev, song]);
    setAddModalVisible(false);
  };

  const removeSong = (songId: string | number) => {
    Alert.alert(
      'Remove Song',
      'Are you sure you want to remove this song from the playlist?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => {
            setSongs(prev => prev.filter(s => s.id !== songId));
          }
        }
      ]
    );
  };

  const renderSongItem: ListRenderItem<Song> = useCallback(({ item, index }) => (
    <SongCard
      song={item}
      index={index}
      onPress={() => handlePlaySong(item, index)}
      isActive={false} // TODO: Check if currently playing
      onRightAction={type === 'custom' ? () => removeSong(item.id) : undefined}
      rightIconName={type === 'custom' ? "trash-2" : "more-horizontal"}
    />
  ), [type, handlePlaySong, removeSong]);

  const renderAvailableSongItem: ListRenderItem<Song> = useCallback(({ item }) => (
    <TouchableOpacity 
      style={[styles.songOption, { borderBottomColor: colors.border }]} 
      onPress={() => addSongToPlaylist(item)}
      accessibilityLabel={`Add ${item.title} to playlist`}
      accessibilityRole="button"
    >
      <Image source={{ uri: item.cover_url || undefined }} style={styles.optionCover} />
      <View style={styles.optionInfo}>
        <Text style={[styles.optionTitle, { color: colors.text }]}>{item.title}</Text>
        <Text style={[styles.optionArtist, { color: colors.textSecondary }]}>{item.artist}</Text>
      </View>
      <Feather name="plus-circle" size={24} color={colors.primary} />
    </TouchableOpacity>
  ), [colors, addSongToPlaylist]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Feather name="chevron-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {title}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {songs.length} songs
          </Text>
        </View>
        {type === 'custom' && (
          <TouchableOpacity 
            onPress={handleAddSong} 
            style={styles.actionButton}
            accessibilityLabel="Add songs to playlist"
            accessibilityRole="button"
          >
            <Feather name="plus" size={24} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Song List */}
      <FlatList
        data={songs}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderSongItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No songs in this playlist yet.
            </Text>
          </View>
        }
      />

      <Modal
        animationType="slide"
        transparent={true}
        visible={isAddModalVisible}
        onRequestClose={() => setAddModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Add Songs</Text>
              <TouchableOpacity 
                onPress={() => setAddModalVisible(false)}
                accessibilityLabel="Close modal"
                accessibilityRole="button"
              >
                <Feather name="x" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={availableSongs}
              keyExtractor={item => item.id.toString()}
              renderItem={renderAvailableSongItem}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  backButton: {
    padding: 6,
    marginRight: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
  },
  actionButton: {
    padding: 8,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
    paddingTop: spacing.sm,
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    height: '80%',
    borderTopLeftRadius: radii.large,
    borderTopRightRadius: radii.large,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  songOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  optionCover: {
    width: 50,
    height: 50,
    borderRadius: radii.small,
    marginRight: spacing.md,
  },
  optionInfo: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  optionArtist: {
    fontSize: 14,
  },
});
