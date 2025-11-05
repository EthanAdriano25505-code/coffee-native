import React, { useEffect, useState, useCallback , JSX} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Button,
  RefreshControl,
  ListRenderItem,
} from 'react-native';
import { supabase } from '../utils/supabase';

type Song = {
  id: string;
  title: string;
  artist: string;
  audio_url?: string;
  cover_url?: string;
  is_available?: boolean;
};

type Props = {
  embedded?: boolean; // when true, don't take full screen height
};

export default function FullSongsScreen({ embedded = false }: Props): JSX.Element {
  console.log('FullSongsScreen loaded: src/screens/FullSongsScreen.tsx');
  
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchFullSongs = useCallback(async () => {
    setError(null);
    try {
      // Try with full column list (that should exist according to supabase table)
      const selectCols = 'id,title,artist,audio_url,cover_url,teaser_url,is_available,created_at,popularity';
      let { data, error } = await supabase
        .from('songs')
        .select(selectCols)
        .order('created_at', { ascending: false })
        .limit(embedded ? 6 : 1000);

      // Debug log immediately so we can see the raw response
      console.log('FullSongs fetch result (attempt 1):', { data, error });

      // If column missing error (Postgres 42703 or message), retry with minimal safe select
      const isMissingColumn = error && (error.code === '42703' || /column .* does not exist/i.test(error.message || ''));
      if (isMissingColumn) {
        const fallbackCols = 'id,title,created_at';
        const retry = await supabase
          .from('songs')
          .select(fallbackCols)
          .order('created_at', { ascending: false })
          .limit(embedded ? 6 : 1000);
  // Log the retry result
  console.log('FullSongs fetch result (fallback):', retry);
  data = retry.data as any;
        error = retry.error;
      }

      if (error) {
        const message = error.message || JSON.stringify(error);
        setError(message);
        setSongs([]);
      } else {
        setSongs((data as Song[]) || []);
      }
    } catch (err: any) {
      setError(err?.message ?? String(err));
      setSongs([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [embedded]);

  useEffect(() => { fetchFullSongs(); }, [fetchFullSongs]);

  const renderSongItem: ListRenderItem<Song> = ({ item }) => (
    <View style={styles.songItem}>
      <Text style={styles.songTitle}>{item.title}</Text>
      <Text style={styles.songArtist}>{item.artist}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={embedded ? styles.containerEmbedded : styles.container}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 12 }}>Loading songs...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={embedded ? styles.containerEmbedded : styles.container}>
        <Text style={styles.errorTitle}>Error loading songs</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <View style={{ marginTop: 12 }}>
          <Button title="Retry" onPress={() => { setLoading(true); fetchFullSongs(); }} />
        </View>
      </View>
    );
  }

  return (
    <View style={embedded ? styles.containerEmbedded : styles.container}>
      <FlatList
        data={songs}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderSongItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchFullSongs(); }} />
        }
        ListEmptyComponent={null}
        contentContainerStyle={songs.length === 0 ? { flexGrow: 0 } : undefined}
        scrollEnabled={!embedded}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  containerEmbedded: { padding: 0, marginTop: 8, marginBottom: 8, flexShrink: 0 },
  songItem: { paddingVertical: 12, paddingHorizontal: 16, backgroundColor: '#fff' },
  songTitle: { fontSize: 16, fontWeight: '700' },
  songArtist: { fontSize: 13, color: '#666', marginTop: 4 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorTitle: { fontSize: 18, fontWeight: '700', color: '#b00020' },
  errorMessage: { marginTop: 8, color: '#333' },
});

