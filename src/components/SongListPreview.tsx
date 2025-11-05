import React, { useEffect, useState , JSX } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ListRenderItem, ActivityIndicator, Image } from 'react-native';
import { supabase } from '../utils/supabase';
import { usePlayback } from '../contexts/PlaybackContext';
import SongCard from '../components/SongCard';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type Song = {
  id: string | number;
  title: string;
  artist?: string | null;
  audio_url?: string | null;
  teaser_url?: string | null;
  cover_url?: string | null;
};

export default function SongListPreview(): JSX.Element {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { play } = usePlayback();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'Home'>>();

  useEffect(() => {
    async function fetchSongs() {
      try {
        const { data, error } = await supabase
          .from('songs')
          .select('id, title, artist, cover_url, is_available, created_at, popularity, audio_url, teaser_url')
          .order('created_at', { ascending: false })
          .limit(6);

        console.log('Fetched songs (preview):', data);
        if (error) {
          console.error('Supabase fetch error (preview):', error);
          setSongs([]);
        } else {
          setSongs((data as Song[]) || []);
        }
      } catch (err) {
        console.error('Unexpected fetch error (preview):', err);
        setSongs([]);
      } finally {
        setLoading(false);
      }
    }
    fetchSongs();
  }, []);

  const onCardPress = (song: Song) => {
    // construct payload that matches PlaybackContext Song type
    const payload = {
      id: song.id,
      title: song.title,
      artist: song.artist ?? undefined,
      cover_url: song.cover_url ?? undefined,
      uri: song.teaser_url ? { uri: song.teaser_url } : song.audio_url ? { uri: song.audio_url } : undefined,
    };
    play(payload);
    navigation.navigate('Player', { song });
  };

  const renderItem: ListRenderItem<Song> = ({ item }) => <SongCard song={item} onPress={() => onCardPress(item)} />;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={songs}
        keyExtractor={(it) => String(it.id)}
        renderItem={renderItem}
        ListEmptyComponent={null}
        contentContainerStyle={songs.length === 0 ? { flexGrow: 0 } : undefined}
        scrollEnabled={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16 },
  loadingContainer: { paddingHorizontal: 16, paddingVertical: 12, alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, backgroundColor: '#fff' },
  thumbImage: { width: 48, height: 48, borderRadius: 8, marginRight: 12, backgroundColor: '#eee' },
  meta: { flex: 1 },
  title: { fontWeight: '700', fontSize: 15 },
  artist: { color: '#666', marginTop: 4 },
  play: { color: '#2f6dfd', fontWeight: '700' },
});