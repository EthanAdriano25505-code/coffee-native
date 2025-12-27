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
import SongCard from '../components/SongCard';
import { usePlayback } from '../contexts/PlaybackContext';
import { spacing, radii } from '../theme/designTokens';
import { SafeAreaView } from 'react-native-safe-area-context';

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
  const { play } = usePlayback();
  
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchFullSongs = useCallback(async () => {
    setError(null);
    try {
      const selectCols = 'id,title,artist,audio_url,cover_url,teaser_url,is_available,created_at,popularity';
      let { data, error } = await supabase
        .from('songs')
        .select(selectCols)
        .order('created_at', { ascending: false })
        .limit(embedded ? 6 : 1000);

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

  const handlePlay = (song: Song) => {
    play(song, songs);
  };

  const renderSongItem: ListRenderItem<Song> = ({ item }) => (
    <View style={{ marginBottom: spacing.sm }}>
      <SongCard song={item} onPress={() => handlePlay(item)} />
    </View>
  );

  const content = (
    <View style={embedded ? styles.containerEmbedded : styles.container}>
      {!embedded && (
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Feather name="chevron-left" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Songs</Text>
        </View>
      )}
      
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ marginTop: 12, color: colors.textSecondary }}>Loading songs...</Text>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={[styles.errorTitle, { color: colors.error }]}>Error loading songs</Text>
          <Text style={[styles.errorMessage, { color: colors.textSecondary }]}>{error}</Text>
          <View style={{ marginTop: 12 }}>
            <TouchableOpacity 
              style={[styles.retryButton, { backgroundColor: colors.primary }]}
              onPress={() => { setLoading(true); fetchFullSongs(); }}
            >
              <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Retry</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <FlatList
          data={songs}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderSongItem}
          contentContainerStyle={[
            styles.listContent,
            embedded && { padding: 0, paddingBottom: 0 }
          ]}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={() => { setRefreshing(true); fetchFullSongs(); }} 
              tintColor={colors.primary} 
            />
          }
          ListEmptyComponent={null}
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
      <SafeAreaView style={{ flex: 1 }}>
        {content}
      </SafeAreaView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  containerEmbedded: { padding: 0, marginTop: 8, marginBottom: 8, flexShrink: 0 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: 100,
  },
  songItem: { paddingVertical: 12, paddingHorizontal: 16 },
  songTitle: { fontSize: 16, fontWeight: '700' },
  songArtist: { fontSize: 13, marginTop: 4 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 200 },
  errorTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  errorMessage: { textAlign: 'center', marginBottom: 20 },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: radii.normal,
  },
});

