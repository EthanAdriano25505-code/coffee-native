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
  ActivityIndicator
} from 'react-native';
import { useNavigation, useRoute, RouteProp, NavigationProp } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, Feather } from '@expo/vector-icons';
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
  artwork?: string | null;
  duration?: number;
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

      if (songsData && songsData.length > 0) {
          setPopularSongs(songsData as Song[]);
      } else {
          // Fallback demo data if no songs found
          setPopularSongs([
              { id: 'demo1', title: 'Blinding Lights', artist: artist, cover_url: cover_url },
              { id: 'demo2', title: 'Save Your Tears', artist: artist, cover_url: cover_url },
              { id: 'demo3', title: 'Starboy', artist: artist, cover_url: cover_url },
              { id: 'demo4', title: 'The Hills', artist: artist, cover_url: cover_url },
              { id: 'demo5', title: 'Die For You', artist: artist, cover_url: cover_url },
          ] as any);
      }

      // Fetch albums (simulated by distinct albums from songs)
      const { data: albumsData } = await supabase
        .from('songs')
        .select('album, cover_url, created_at')
        .eq('artist', artist)
        .not('album', 'is', null);

      if (albumsData && albumsData.length > 0) {
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
      } else {
          // Fallback demo albums
          setAlbums([
              { title: 'After Hours', cover_url: cover_url, year: '2020' },
              { title: 'Starboy', cover_url: cover_url, year: '2016' },
              { title: 'Beauty Behind the Madness', cover_url: cover_url, year: '2015' },
          ]);
      }

    } catch (err) {
      console.warn('Exception fetching artist data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePlaySong = async (song: Song) => {
    const playlist = popularSongs.map(s => ({
      id: s.id,
      title: s.title,
      artist: s.artist || artist,
      cover_url: s.cover_url || cover_url,
      url: s.audio_url || '',
    }));

    const track = {
      id: song.id,
      title: song.title,
      artist: song.artist || artist,
      cover_url: song.cover_url || cover_url,
      url: song.audio_url || '',
    } as any;
    await play(track, playlist);
  };

  const renderSongItem = (item: Song, index: number) => (
    <TouchableOpacity key={item.id} style={styles.songItem} onPress={() => handlePlaySong(item)}>
      <Text style={styles.songIndex}>{index + 1}</Text>
      <RemoteImage uri={item.cover_url} width={48} height={48} style={{ borderRadius: 4 }} />
      <View style={styles.songInfo}>
        <Text style={styles.songTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.songPlays} numberOfLines={1}>{Math.floor(Math.random() * 50000000 + 1000000).toLocaleString()} plays</Text>
      </View>
      <TouchableOpacity style={styles.moreButton}>
        <Feather name="more-horizontal" size={20} color="#b3b3b3" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderAlbumItem = ({ item }: { item: Album }) => (
    <TouchableOpacity 
        style={styles.albumItem}
        onPress={() => navigation.navigate('AlbumDetails' as any, { album: item.title, artist: artist, cover_url: item.cover_url ?? undefined })}
    >
      <RemoteImage uri={item.cover_url} width={140} height={140} style={styles.albumCover} />
      <Text style={styles.albumTitle} numberOfLines={1}>{item.title}</Text>
      <Text style={styles.albumYear}>{item.year}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color="#00E5FF" />
      </View>
    );
  }

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
                    colors={['transparent', 'rgba(0,0,0,0.8)', '#000']}
                    style={StyleSheet.absoluteFill}
                    locations={[0, 0.7, 1]}
                />
                <SafeAreaView edges={['top']} style={styles.headerContent}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={28} color="#fff" />
                    </TouchableOpacity>
                    
                    <View style={styles.artistInfo}>
                        <Text style={styles.artistName}>{artist}</Text>
                        <Text style={styles.monthlyListeners}>24,102,931 monthly listeners</Text>
                        <View style={styles.headerButtons}>
                            <TouchableOpacity style={styles.followButton}>
                                <Text style={styles.followButtonText}>Follow</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.playButton}>
                                <Ionicons name="play" size={24} color="#000" style={{ marginLeft: 2 }} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </SafeAreaView>
            </ImageBackground>
        </View>

        {/* Popular Songs */}
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Popular releases</Text>
            {popularSongs.map((song, index) => renderSongItem(song, index))}
        </View>

        {/* Albums */}
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Albums</Text>
            <FlatList
                data={albums}
                horizontal
                showsHorizontalScrollIndicator={false}
                renderItem={renderAlbumItem}
                keyExtractor={(item, index) => `${item.title}-${index}`}
                contentContainerStyle={styles.albumsList}
            />
        </View>

        {/* About */}
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <View style={styles.aboutCard}>
                <RemoteImage uri={cover_url} width={width - 32} height={200} style={styles.aboutImage} />
                <View style={styles.aboutOverlay}>
                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.8)']}
                        style={StyleSheet.absoluteFill}
                    />
                    <Text style={styles.aboutText} numberOfLines={3}>
                        {artist} is one of the most influential artists of our generation, blending genres and creating timeless hits.
                    </Text>
                </View>
            </View>
        </View>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    height: 400,
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
    padding: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  artistInfo: {
    marginBottom: 10,
  },
  artistName: {
    fontSize: 48,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
    letterSpacing: -1,
  },
  monthlyListeners: {
    fontSize: 14,
    color: '#b3b3b3',
    marginBottom: 16,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  followButton: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#fff',
  },
  followButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#00E5FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginTop: 32,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
  },
  songItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  songIndex: {
    width: 24,
    fontSize: 16,
    color: '#b3b3b3',
    textAlign: 'center',
    marginRight: 12,
  },
  songInfo: {
    flex: 1,
    marginLeft: 12,
  },
  songTitle: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 4,
    fontWeight: '500',
  },
  songPlays: {
    fontSize: 13,
    color: '#b3b3b3',
  },
  moreButton: {
    padding: 8,
  },
  albumsList: {
    paddingRight: 16,
  },
  albumItem: {
    marginRight: 16,
    width: 150,
  },
  albumCover: {
    borderRadius: 4,
    marginBottom: 8,
  },
  albumTitle: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
    marginBottom: 4,
  },
  albumYear: {
    fontSize: 13,
    color: '#b3b3b3',
  },
  aboutCard: {
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  aboutImage: {
    width: '100%',
    height: 200,
  },
  aboutOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  aboutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
  },
});

export default ArtistDetailsScreen;
