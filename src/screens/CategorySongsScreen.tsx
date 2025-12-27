import React, { useCallback, useEffect, useState } from 'react';
import { TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../utils/supabase';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/types';
import { useTheme } from '../contexts/ThemeContext';
import { getColors, spacing, radii } from '../theme/designTokens';
import AppBackground from '../components/AppBackground';
import SongCard from '../components/SongCard';
import { usePlayback } from '../contexts/PlaybackContext';

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
  const navigation = useNavigation<any>();
  const { isDarkMode: isDark } = useTheme();
  const colors = getColors(isDark);
  const { play } = usePlayback();
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

  const handlePlay = (song: Song) => {
    play(song, songs);
  };

  const renderSongItem: ListRenderItem<Song> = ({ item }) => (
    <View style={{ marginBottom: spacing.sm }}>
      <SongCard song={item} onPress={() => handlePlay(item)} />
    </View>
  );

  if (loading) {
    return (
      <AppBackground>
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Feather name="chevron-left" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.text }]}>{title ?? 'Category'}</Text>
          </View>
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{ marginTop: 12, color: colors.textSecondary }}>Loading {title ?? 'songs'}...</Text>
          </View>
        </SafeAreaView>
      </AppBackground>
    );
  }

  if (error) {
    return (
      <AppBackground>
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Feather name="chevron-left" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.text }]}>{title ?? 'Category'}</Text>
          </View>
          <View style={styles.center}>
            <Text style={[styles.errorTitle, { color: colors.error }]}>Error loading songs</Text>
            <Text style={[styles.errorMessage, { color: colors.textSecondary }]}>{error}</Text>
            <TouchableOpacity 
              style={[styles.retryButton, { backgroundColor: colors.primary }]}
              onPress={() => { setLoading(true); fetchSongs(); }}
            >
              <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Retry</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </AppBackground>
    );
  }

  return (
    <AppBackground>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Feather name="chevron-left" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>{title ?? 'Category'}</Text>
        </View>
        <FlatList
          data={songs}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderSongItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={() => { setRefreshing(true); fetchSongs(); }}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={{ color: colors.textSecondary, padding: 16 }}>No songs found.</Text>
            </View>
          }
        />
      </SafeAreaView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: 100,
  },
  errorTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  errorMessage: { textAlign: 'center', marginBottom: 20 },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: radii.normal,
  },
});