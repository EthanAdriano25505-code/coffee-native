import React, { useEffect, useState, useCallback, JSX } from 'react';
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
import { supabase } from '../utils/supabase'; // keep this path or adjust to your project

type Song = {
  id: string;
  title: string;
  artist: string;
  audio_url?: string;
  cover_url?: string;
  is_available?: boolean;
};

export default function FullSongsScreen(): JSX.Element {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchFullSongs = useCallback(async () => {
    setError(null);
    try {
      const selectCols = 'id, title, artist, audio_url, cover_url';
      const { data, error: fetchError } = await supabase
        .from('songs')
        .select(selectCols)
        .eq('is_available', true);

      if (fetchError) {
        const message = fetchError.message || JSON.stringify(fetchError);
        // If the is_available column doesn't exist, retry without that filter
        const isUndefinedColumn =
          (fetchError.code === '42703') ||
          /column .* does not exist/i.test(message) ||
          /42703/.test(message);

        if (isUndefinedColumn) {
          const { data: allData, error: allError } = await supabase.from('songs').select(selectCols);
          if (allError) {
            const msg2 = allError.message || JSON.stringify(allError);
            setError(msg2);
            setSongs([]);
          } else {
            setSongs((allData as Song[]) || []);
            setError(null);
          }
        } else {
          setError(message);
          setSongs([]);
        }
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
  }, []);

  useEffect(() => {
    fetchFullSongs();
  }, [fetchFullSongs]);

  const renderSongItem: ListRenderItem<Song> = ({ item }) => (
    <View style={styles.songItem}>
      <Text style={styles.songTitle}>{item.title}</Text>
      <Text style={styles.songArtist}>{item.artist}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 12 }}>Loading songs...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorTitle}>Error loading songs</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <View style={{ marginTop: 12 }}>
          <Button
            title="Retry"
            onPress={() => {
              setLoading(true);
              fetchFullSongs();
            }}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={songs}
        keyExtractor={(item) => item.id}
        renderItem={renderSongItem}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchFullSongs();
            }}
          />
        }
        // Remove the full-size "No available songs found." empty state so it doesn't push UI around.
        ListEmptyComponent={null}
        // Keep contentContainerStyle minimal — this avoids unexpected extra space when empty.
        contentContainerStyle={songs.length === 0 ? { flexGrow: 0 } : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  songItem: { marginBottom: 20 },
  songTitle: { fontSize: 18, fontWeight: 'bold' },
  songArtist: { fontSize: 14, color: '#666' },
  errorTitle: { fontSize: 18, fontWeight: '700', color: '#b00020' },
  errorMessage: { marginTop: 8, color: '#333' },
  empty: { color: '#666', padding: 12 },
});