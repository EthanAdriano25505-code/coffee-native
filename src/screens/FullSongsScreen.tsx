import React, { useEffect, useState, useCallback, useLayoutEffect, JSX } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  ListRenderItem,
  Button,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { supabase } from '../utils/supabase';
import SongCard from '../components/SongCard';
import { usePlayback } from '../contexts/PlaybackContext';
import type { RootStackParamList } from '../navigation/types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Song = {
  id: string | number;
  title: string;
  artist?: string | null;
  audio_url?: string | null;
  teaser_url?: string | null;
  cover_url?: string | null;
  is_available?: boolean;
  created_at?: string | null;
  popularity?: number | null;
  is_free?: boolean | null;
  access_level?: string | null;
  is_teaser?: boolean | null;
};

type PropsRoute = RouteProp<RootStackParamList, 'FullSongs'>;

export default function FullSongsScreen(): JSX.Element {
  const navigation = useNavigation<any>();
  const route = useRoute<PropsRoute>();
  const insets = useSafeAreaInsets();

  const { play } = usePlayback();

  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // set title from params if provided
  useLayoutEffect(() => {
    const title = (route?.params as any)?.title;
    if (title) {
      navigation.setOptions({ title });
    }
  }, [navigation, route?.params]);

  const fetchFullSongs = useCallback(async () => {
    setError(null);
    try {
      const selectCols =
        'id,title,artist,audio_url,teaser_url,cover_url,is_available,created_at,popularity,is_free,access_level';
      let query = supabase.from('songs').select(selectCols).order('created_at', { ascending: false });

      // New: prefer explicit access_level filtering
      const filter = (route?.params as any)?.filter;
      const title = (route?.params as any)?.title;

      if (filter?.access_level) {
        // explicit access_level provided by caller
        query = query.eq('access_level', filter.access_level);
      } else if (typeof filter?.is_free !== 'undefined') {
        // legacy behavior: map is_free -> access_level when possible
        if (filter.is_free === true) {
          query = query.eq('access_level', 'free');
        } else {
          if (title === 'Teasers') {
            query = query.eq('access_level', 'teaser');
          } else {
            // when caller asked for non-free but didn't specify teasers, assume premium
            query = query.eq('access_level', 'premium');
          }
        }
      } else if (title) {
        // infer from screen title when provided
        if (title === 'Teasers') {
          query = query.eq('access_level', 'teaser');
        } else if (title === 'Free' || title === 'Free Songs' || title === 'Free Songs Album') {
          query = query.eq('access_level', 'free');
        } else if (title === 'Premium' || title === 'Paid') {
          query = query.eq('access_level', 'premium');
        }
        // otherwise leave unfiltered (rare)
      } else {
        // DEFAULT FALLBACK: if no params provided at all, treat this invocation as the Free album.
        // This fixes the case where navigation did not pass a filter (so the Free screen showed all songs).
        query = query.eq('access_level', 'free');
      }

      // always only return available songs
      query = query.eq('is_available', true);

      const { data, error } = await query.limit(1000);

      console.log('FullSongs fetch result (with filter):', { params: route?.params, data, error });

      const isMissingColumn = error && (error.code === '42703' || /column .* does not exist/i.test(error.message || ''));
      if (isMissingColumn) {
        const minimal = await supabase.from('songs').select('id,title,artist,created_at').order('created_at', { ascending: false });
        console.log('FullSongs fetch fallback:', minimal);
        if (minimal.error) {
          setError(minimal.error.message || JSON.stringify(minimal.error));
          setSongs([]);
        } else {
          setSongs((minimal.data as Song[]) || []);
        }
      } else if (error) {
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
  }, [route?.params]);

  useEffect(() => {
    fetchFullSongs();
  }, [fetchFullSongs]);

  // IMPORTANT: use teaser_url first, then audio_url — same behavior as SongListPreview
  const onCardPress = useCallback(
    (song: Song) => {
      const payload = {
        id: song.id,
        title: song.title,
        artist: song.artist ?? undefined,
        cover_url: song.cover_url ?? undefined,
        uri: song.teaser_url ? { uri: song.teaser_url } : song.audio_url ? { uri: song.audio_url } : undefined,
      };
      // start playback using the shared PlaybackContext
      console.log('FullSongs play payload:', payload);
      play(payload);
      // navigate to Player (we pass original song object — PlayerScreen will also attempt to start playback
      // from params, but the PlaybackContext already started playback)
      navigation.navigate('Player', { song });
    },
    [play, navigation]
  );

  const renderSongItem: ListRenderItem<Song> = ({ item }) => <SongCard song={item} onPress={() => onCardPress(item)} />;

  if (loading) {
    return (
      <View style={[styles.container, { paddingBottom: insets.bottom ?? 0 }]}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 12 }}>Loading songs...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { paddingBottom: insets.bottom ?? 0 }]}>
        <Text style={styles.errorTitle}>Error loading songs</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <View style={{ marginTop: 12 }}>
          <Button title="Retry" onPress={() => { setLoading(true); fetchFullSongs(); }} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom ?? 0 }]}>
      <FlatList
        data={songs}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderSongItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchFullSongs(); }} />
        }
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No songs found</Text>
            <Text style={styles.emptySub}>Try a different category or refresh.</Text>
            <View style={{ marginTop: 10 }}>
              <Button title="Reload" onPress={() => { setLoading(true); fetchFullSongs(); }} />
            </View>
          </View>
        )}
        contentContainerStyle={songs.length === 0 ? { flexGrow: 1, justifyContent: 'center' } : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f7f8' },
  errorTitle: { fontSize: 18, fontWeight: '700', color: '#b00020' },
  errorMessage: { marginTop: 8, color: '#333' },
  empty: { alignItems: 'center' },
  emptyTitle: { fontSize: 16, fontWeight: '700' },
  emptySub: { marginTop: 6, color: '#666' },
});