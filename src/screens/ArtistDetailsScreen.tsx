import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  ScrollView,
  ImageBackground,
} from 'react-native';
import { useNavigation, useRoute, RouteProp, NavigationProp } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

import { supabase } from '../utils/supabase';
import { usePlayback } from '../contexts/PlaybackContext';
import { spacing, radii, tokens } from '../theme/designTokens';
import type { RootStackParamList } from '../navigation/types';
import RemoteImage from '../components/RemoteImage';

const { width } = Dimensions.get('window');

type ArtistDetailsRouteProp = RouteProp<RootStackParamList, 'ArtistDetails'>;

type Song = {
  id: string | number;
  title: string;
  artist?: string | null;
  album?: string | null;
  audio_url?: string | null;
  cover_url?: string | null;
};

type Album = {
    title: string;
    cover_url?: string | null;
    year?: string;
};

const ArtistDetailsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<ArtistDetailsRouteProp>();
  const { artist, cover_url } = route.params;
  const insets = useSafeAreaInsets();
  const { play } = usePlayback();

  const [popularSongs, setPopularSongs] = useState<Song[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArtistData();
  }, [artist]);

  const fetchArtistData = async () => {
    try {
      setLoading(true);
      
      // Fetch popular songs
      const { data: songsData, error: songsError } = await supabase
        .from('songs')
        .select('id, title, artist, album, audio_url, cover_url, popularity')
        .eq('artist', artist)
        .order('popularity', { ascending: false })
        .limit(5);

      if (songsData) setPopularSongs(songsData as Song[]);

      // Fetch albums (simulated by distinct albums from songs)
      // Since Supabase JS client doesn't support distinct easily on select without a view or rpc, 
      // we'll fetch songs and process client side for this demo.
      const { data: albumsData } = await supabase
        .from('songs')
        .select('album, cover_url, created_at')
        .eq('artist', artist)
        .not('album', 'is', null);

      if (albumsData) {
          const uniqueAlbums = new Map();
          albumsData.forEach((item: any) => {
              if (item.album && !uniqueAlbums.has(item.album)) {
                  uniqueAlbums.set(item.album, {
                      title: item.album,
                      cover_url: item.cover_url,
                      year: new Date(item.created_at).getFullYear().toString()
                  });
              }
          });
          setAlbums(Array.from(uniqueAlbums.values()));
      }

    } catch (err) {
      console.warn('Exception fetching artist data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePlaySong = async (song: Song) => {
    const uri = song.audio_url ? { uri: song.audio_url } : undefined;
    await play({
      id: song.id,
      title: song.title,
      artist: song.artist ?? undefined,
      cover_url: song.cover_url ?? undefined,
      uri,
    });
  };

  const renderSongItem = (item: Song, index: number) => (
    <TouchableOpacity key={item.id} style={styles.songItem} onPress={() => handlePlaySong(item)}>
      <Text style={styles.songIndex}>{index + 1}</Text>
      <RemoteImage uri={item.cover_url} width={40} height={40} style={{ borderRadius: 4 }} />
      <View style={styles.songInfo}>
        <Text style={styles.songTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.songPlays} numberOfLines={1}>{Math.floor(Math.random() * 1000000).toLocaleString()} plays</Text>
      </View>
      <TouchableOpacity style={styles.moreButton}>
        <Ionicons name="ellipsis-horizontal" size={16} color="rgba(255,255,255,0.5)" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderAlbumItem = ({ item }: { item: Album }) => (
    <TouchableOpacity 
        style={styles.albumItem}
        onPress={() => navigation.navigate('AlbumDetails', { album: item.title, artist: artist, cover_url: item.cover_url ?? undefined })}
    >
      <RemoteImage uri={item.cover_url} width={140} height={140} style={styles.albumCover} />
      <Text style={styles.albumTitle} numberOfLines={1}>{item.title}</Text>
      <Text style={styles.albumYear}>{item.year}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <ScrollView 
        contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
            <ImageBackground
                source={{ uri: cover_url || 'https://via.placeholder.com/500' }}
                style={styles.headerBackground}
            >
                <LinearGradient
                    colors={['transparent', '#000']}
                    style={StyleSheet.absoluteFill}
                />
                <SafeAreaView edges={['top']} style={styles.headerContent}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={28} color="#fff" />
                    </TouchableOpacity>
                    
                    <View style={styles.artistInfo}>
                        <Text style={styles.artistName}>{artist}</Text>
                        <Text style={styles.monthlyListeners}>1.2M Monthly Listeners</Text>
                        <View style={styles.headerButtons}>
                            <TouchableOpacity style={styles.followButton}>
                                <Text style={styles.followButtonText}>Follow</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.playButton}>
                                <Ionicons name="play" size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </SafeAreaView>
            </ImageBackground>
        </View>

        {/* Popular Songs */}
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Popular</Text>
            {popularSongs.map((song, index) => renderSongItem(song, index))}
        </View>

        {/* Albums */}
        {albums.length > 0 && (
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Albums</Text>
                <FlatList
                    data={albums}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    renderItem={renderAlbumItem}
                    keyExtractor={(item) => item.title}
                    contentContainerStyle={styles.albumsList}
                />
            </View>
        )}

        {/* About */}
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <View style={styles.aboutCard}>
                <RemoteImage uri={cover_url} width={width - spacing.lg * 2} height={200} style={styles.aboutImage} />
                <Text style={styles.aboutText} numberOfLines={4}>
                    {artist} is a popular artist known for their unique style and amazing performances. 
                    Listen to their latest tracks and albums right here.
                </Text>
            </View>
        </View>

      </ScrollView>
    </View>
  );
};

const primaryColor = (tokens as any)?.colors?.primary ?? (tokens as any)?.light?.primary ?? '#1DB954';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    height: 350,
    width: '100%',
  },
  headerBackground: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
  },
  headerContent: {
    flex: 1,
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  artistInfo: {
    marginBottom: spacing.lg,
  },
  artistName: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: spacing.xs,
  },
  monthlyListeners: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: spacing.md,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  followButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.round,
    borderWidth: 1,
    borderColor: '#fff',
    marginRight: spacing.md,
  },
  followButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: primaryColor,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: spacing.md,
  },
  songItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  songIndex: {
    width: 24,
    fontSize: 16,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    marginRight: spacing.sm,
  },
  songInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  songTitle: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 2,
  },
  songPlays: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
  moreButton: {
    padding: spacing.sm,
  },
  albumsList: {
    paddingRight: spacing.md,
  },
  albumItem: {
    marginRight: spacing.md,
    width: 140,
  },
  albumCover: {
    borderRadius: 8,
    marginBottom: spacing.sm,
  },
  albumTitle: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
    marginBottom: 2,
  },
  albumYear: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
  aboutCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    overflow: 'hidden',
    paddingBottom: spacing.md,
  },
  aboutImage: {
    marginBottom: spacing.md,
  },
  aboutText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: spacing.md,
  },
});

export default ArtistDetailsScreen;
