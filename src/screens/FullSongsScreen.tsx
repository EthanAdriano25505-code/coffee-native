import React, { useEffect, useState, useCallback, JSX, useContext } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Button,
  RefreshControl,
  ListRenderItem,
  TouchableOpacity,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { supabase } from '../utils/supabase';
import { useNavigation } from '@react-navigation/native';
import AppBackground from '../components/AppBackground';
import { useTheme } from '../contexts/ThemeContext';

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
  const navigation = useNavigation<any>();
  const { isDarkMode, colors } = useTheme();
  
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
    <View style={[styles.songItem, { backgroundColor: 'transparent', borderBottomColor: isDarkMode ? 'rgba(255,255,255,0.1)' : '#eee', borderBottomWidth: 1 }]}>
      <Text style={[styles.songTitle, { color: colors.text }]}>{item.title}</Text>
      <Text style={[styles.songArtist, { color: colors.textSecondary }]}>{item.artist}</Text>
    </View>
  );

  const content = (
    <View style={embedded ? styles.containerEmbedded : styles.container}>
      {!embedded && (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <TouchableOpacity onPress={() => { if (navigation?.canGoBack && navigation.canGoBack()) navigation.goBack(); else navigation?.navigate?.('Home'); }} style={{ padding: 6, marginRight: 8 }}>
            <Feather name="chevron-left" size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={{ fontSize: 20, fontWeight: '800', color: colors.text }}>Songs</Text>
        </View>
      )}
      
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ marginTop: 12, color: colors.textSecondary }}>Loading songs...</Text>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorTitle}>Error loading songs</Text>
          <Text style={[styles.errorMessage, { color: colors.text }]}>{error}</Text>
          <View style={{ marginTop: 12 }}>
            <Button title="Retry" onPress={() => { setLoading(true); fetchFullSongs(); }} color={colors.primary} />
          </View>
        </View>
      ) : (
        <FlatList
          data={songs}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderSongItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchFullSongs(); }} tintColor={colors.text} />
          }
          ListEmptyComponent={null}
          contentContainerStyle={songs.length === 0 ? { flexGrow: 0 } : undefined}
          scrollEnabled={!embedded}
        />
      )}
    </View>
  );

  if (embedded) {
    return content;
  }

  return (
    <AppBackground>
      {content}
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  containerEmbedded: { padding: 0, marginTop: 8, marginBottom: 8, flexShrink: 0 },
  songItem: { paddingVertical: 12, paddingHorizontal: 16 },
  songTitle: { fontSize: 16, fontWeight: '700' },
  songArtist: { fontSize: 13, marginTop: 4 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 200 },
  errorTitle: { fontSize: 18, fontWeight: '700', color: '#b00020' },
  errorMessage: { marginTop: 8 },
});

