import React, { useCallback, useEffect, useState } from 'react';
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
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/types';

type Song = {
  id: string;
  title: string;
  artist?: string;
  audio_url?: string;
  cover_url?: string;
  is_available?: boolean;
  is_free?: boolean | null;
};

type Props = {
  route: RouteProp<RootStackParamList, 'CategorySongs'>;
};

export default function CategorySongsScreen({ route }: Props) {
  const { filter, title } = route.params ?? {};
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchSongs = useCallback(async () => {
    setError(null);
    try {
      // start building the query
      let query = supabase
        .from('songs')
        .select('id,title,artist,audio_url,cover_url,teaser_url,is_available,is_free,created_at,popularity')
        .order('created_at', { ascending: false })
        .limit(1000);

      // apply simple equality filters from route param (safe guard)
      if (filter && typeof filter.is_free !== 'undefined') {
        query = query.eq('is_free', filter.is_free);
      }

      const { data, error } = await query;

      if (error) {
        setError(error.message || JSON.stringify(error));
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
  }, [filter]);

  useEffect(() => {
    fetchSongs();
  }, [fetchSongs]);

  const renderSongItem: ListRenderItem<Song> = ({ item }) => (
    <View style={styles.songItem}>
      <Text style={styles.songTitle}>{item.title}</Text>
      <Text style={styles.songArtist}>{item.artist}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 12 }}>Loading {title ?? 'songs'}...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorTitle}>Error loading songs</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <View style={{ marginTop: 12 }}>
          <Button title="Retry" onPress={() => { setLoading(true); fetchSongs(); }} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={songs}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderSongItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchSongs(); }} />
        }
        ListEmptyComponent={<Text style={{ padding: 16 }}>No songs found.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  songItem: { paddingVertical: 12, paddingHorizontal: 16, backgroundColor: '#fff' },
  songTitle: { fontSize: 16, fontWeight: '700' },
  songArtist: { fontSize: 13, color: '#666', marginTop: 4 },
  errorTitle: { fontSize: 18, fontWeight: '700', color: '#b00020' },
  errorMessage: { marginTop: 8, color: '#333' },
});