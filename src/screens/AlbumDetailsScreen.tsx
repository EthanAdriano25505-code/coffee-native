import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Platform,
  StatusBar,
} from 'react-native';
import { useNavigation, useRoute, RouteProp, NavigationProp } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

import { supabase } from '../utils/supabase';
import { usePlayback } from '../contexts/PlaybackContext';
import { spacing, radii, getColors, tokens } from '../theme/designTokens';
import type { RootStackParamList } from '../navigation/types';
import RemoteImage from '../components/RemoteImage';

const { width } = Dimensions.get('window');

type AlbumDetailsRouteProp = RouteProp<RootStackParamList, 'AlbumDetails'>;

type Song = {
  id: string | number;
  title: string;
  artist?: string | null;
  album?: string | null;
  audio_url?: string | null;
  cover_url?: string | null;
  duration?: number;
};

const AlbumDetailsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<AlbumDetailsRouteProp>();
  const { album, artist, cover_url } = route.params;
  const insets = useSafeAreaInsets();
  const { play } = usePlayback();

  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlbumSongs();
  }, [album]);

  const fetchAlbumSongs = async () => {
    try {
      setLoading(true);
      // Assuming 'album' column exists. If not, we might need to filter client side or use another method.
      // For now, we'll try to fetch by album. If it fails, we might fallback to artist or just random songs for demo.
      let query = supabase
        .from('songs')
        .select('id, title, artist, album, audio_url, cover_url')
        .eq('album', album);
      
      const { data, error } = await query;

      if (error) {
        console.warn('Error fetching album songs:', error);
        // Fallback: fetch songs by artist if album fetch fails (or returns empty which might mean column doesn't exist or data is missing)
        // This is just a safety net for the demo if the DB schema isn't exactly as expected.
        const { data: artistData } = await supabase
            .from('songs')
            .select('id, title, artist, album, audio_url, cover_url')
            .eq('artist', artist || '')
            .limit(10);
        
        if (artistData) setSongs(artistData as Song[]);
      } else if (data && data.length > 0) {
        setSongs(data as Song[]);
      } else {
         // If no songs found for album, maybe try to find songs with same artist
         if (artist) {
             const { data: artistData } = await supabase
            .from('songs')
            .select('id, title, artist, album, audio_url, cover_url')
            .eq('artist', artist)
            .limit(10);
            if (artistData) setSongs(artistData as Song[]);
         }
      }
    } catch (err) {
      console.warn('Exception fetching album songs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePlaySong = async (song: Song, index: number) => {
    const uri = song.audio_url ? { uri: song.audio_url } : undefined;
    await play({
      id: song.id,
      title: song.title,
      artist: song.artist ?? undefined,
      cover_url: song.cover_url ?? undefined,
      uri,
    });
  };

  const handlePlayAll = async () => {
    if (songs.length > 0) {
      handlePlaySong(songs[0], 0);
      // In a real app, we would queue the rest
    }
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.coverContainer}>
        <RemoteImage 
            uri={cover_url} 
            width={width * 0.6} 
            height={width * 0.6} 
            style={styles.coverImage} 
            placeholderText={album}
        />
        <View style={styles.shadow} />
      </View>
      
      <View style={styles.infoContainer}>
        <Text style={styles.albumTitle}>{album}</Text>
        <TouchableOpacity onPress={() => navigation.navigate('ArtistDetails', { artist: artist ?? '', cover_url })}>
            <Text style={styles.artistName}>{artist}</Text>
        </TouchableOpacity>
        <Text style={styles.metaInfo}>Album • {new Date().getFullYear()}</Text>
      </View>

      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.playButton} onPress={handlePlayAll}>
          <Ionicons name="play" size={24} color="#fff" style={{ marginLeft: 4 }} />
        </TouchableOpacity>
        
        <View style={styles.secondaryActions}>
            <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="heart-outline" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="ellipsis-horizontal" size={24} color="#fff" />
            </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderSongItem = ({ item, index }: { item: Song; index: number }) => (
    <TouchableOpacity style={styles.songItem} onPress={() => handlePlaySong(item, index)}>
      <Text style={styles.songIndex}>{index + 1}</Text>
      <View style={styles.songInfo}>
        <Text style={styles.songTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.songArtist} numberOfLines={1}>{item.artist}</Text>
      </View>
      <TouchableOpacity style={styles.moreButton}>
        <Ionicons name="ellipsis-vertical" size={16} color="rgba(255,255,255,0.5)" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Background Gradient */}
      <LinearGradient
        colors={['#1a1a1a', '#000']}
        style={StyleSheet.absoluteFill}
      />
      
      {/* Blurred Background Image */}
      {cover_url && (
        <View style={[StyleSheet.absoluteFill, { opacity: 0.3 }]}>
            <RemoteImage 
                uri={cover_url} 
                width={width} 
                height={width} 
                style={{ width: '100%', height: '100%' }}
            />
            <BlurView intensity={80} style={StyleSheet.absoluteFill} tint="dark" />
            <LinearGradient
                colors={['transparent', '#000']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
            />
        </View>
      )}

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.navBar}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <Ionicons name="chevron-back" size={28} color="#fff" />
            </TouchableOpacity>
        </View>

        <FlatList
          data={songs}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderSongItem}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 80 }]}
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  safeArea: {
    flex: 1,
  },
  navBar: {
    height: 44,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  headerContainer: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  coverContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
    marginBottom: spacing.lg,
  },
  coverImage: {
    borderRadius: 8,
  },
  shadow: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    bottom: -20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: -1,
    borderRadius: 8,
  },
  infoContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  albumTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  artistName: {
    fontSize: 18,
    color: tokens.light.colors.primary,
    marginBottom: spacing.xs,
  },
  metaInfo: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginTop: spacing.sm,
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: tokens.light.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: tokens.light.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
    marginHorizontal: spacing.lg,
  },
  secondaryActions: {
    position: 'absolute',
    right: 0,
    flexDirection: 'row',
  },
  actionButton: {
    padding: spacing.sm,
    marginLeft: spacing.sm,
  },
  songItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  songIndex: {
    width: 30,
    fontSize: 16,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
  },
  songInfo: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  songTitle: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 4,
  },
  songArtist: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
  },
  moreButton: {
    padding: spacing.sm,
  },
});

export default AlbumDetailsScreen;
