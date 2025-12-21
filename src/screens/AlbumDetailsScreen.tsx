import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, Feather, Entypo } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

import { supabase } from '../utils/supabase';
import { usePlayback } from '../contexts/PlaybackContext';
import RemoteImage from '../components/RemoteImage';
import { RootStackParamList } from '../navigation/types';

const { width } = Dimensions.get('window');

type AlbumDetailsRouteProp = RouteProp<RootStackParamList, 'AlbumDetails'>;

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

const AlbumDetailsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
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
      // Try to fetch songs by album name
      let { data, error } = await supabase
        .from('songs')
        .select('*')
        .eq('album', album);
      
      if (error || !data || data.length === 0) {
        // Fallback: fetch songs by artist if album fetch fails or is empty
        const { data: artistData } = await supabase
            .from('songs')
            .select('*')
            .eq('artist', artist || '')
            .limit(10);
        
        if (artistData) setSongs(artistData as Song[]);
      } else {
        setSongs(data as Song[]);
      }
    } catch (err) {
      console.warn('Exception fetching album songs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePlaySong = async (song: Song) => {
    const track = {
      id: song.id,
      title: song.title,
      artist: song.artist || 'Unknown Artist',
      artwork: song.cover_url || cover_url || 'https://via.placeholder.com/300',
      url: song.audio_url || '',
    } as any;
    await play(track);
  };

  const renderSongItem = ({ item, index }: { item: Song; index: number }) => (
    <TouchableOpacity 
        style={styles.songItem} 
        onPress={() => handlePlaySong(item)}
        activeOpacity={0.7}
    >
      <View style={styles.songIndexContainer}>
          <Text style={styles.songIndex}>{index + 1}</Text>
      </View>
      <View style={styles.songInfo}>
        <Text style={styles.songTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.songArtist} numberOfLines={1}>{item.artist}</Text>
      </View>
      <TouchableOpacity style={styles.moreButton}>
        <Feather name="more-horizontal" size={20} color="#b3b3b3" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View style={styles.contentHeader}>
        <View style={styles.albumArtContainer}>
            <RemoteImage 
                uri={cover_url} 
                width={200} 
                height={200} 
                style={styles.albumArt} 
                imageProps={{ resizeMode: 'cover' }}
            />
            <View style={styles.shadow} />
        </View>
        
        <Text style={styles.albumTitle}>{album}</Text>
        <View style={styles.artistRow}>
            <RemoteImage 
                uri={cover_url} 
                width={24} 
                height={24} 
                style={styles.artistTinyImage} 
                imageProps={{ resizeMode: 'cover' }}
            />
            <Text style={styles.artistName}>{artist}</Text>
            <Text style={styles.albumMeta}>• Album • 2024</Text>
        </View>

        <View style={styles.controlsRow}>
            <View style={styles.leftControls}>
                <TouchableOpacity style={styles.iconButton}>
                    <Feather name="heart" size={28} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconButton}>
                    <Feather name="download-cloud" size={28} color="#b3b3b3" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconButton}>
                    <Feather name="more-horizontal" size={28} color="#b3b3b3" />
                </TouchableOpacity>
            </View>
            <TouchableOpacity 
                style={styles.playButton}
                onPress={() => songs.length > 0 && handlePlaySong(songs[0])}
            >
                <Ionicons name="play" size={32} color="#000" style={{ marginLeft: 4 }} />
            </TouchableOpacity>
        </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Background Gradient */}
      <LinearGradient
        colors={['#4c669f', '#192f6a', '#000']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 0.6 }}
      />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.headerBar}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <Ionicons name="chevron-back" size={28} color="#fff" />
            </TouchableOpacity>
        </View>

        {loading ? (
           <View style={styles.centerContainer}>
             <ActivityIndicator size="large" color="#1DB954" />
           </View>
        ) : (
          <FlatList
            data={songs}
            renderItem={renderSongItem}
            keyExtractor={(item, index) => `${item.id}-${index}`}
            ListHeaderComponent={renderHeader}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
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
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 50,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 100,
  },
  contentHeader: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    alignItems: 'flex-start',
  },
  albumArtContainer: {
    alignSelf: 'center',
    marginVertical: 20,
    shadowColor: "#000",
    shadowOffset: {
        width: 0,
        height: 10,
    },
    shadowOpacity: 0.5,
    shadowRadius: 13.16,
    elevation: 20,
  },
  albumArt: {
    width: 220,
    height: 220,
  },
  shadow: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'transparent',
  },
  albumTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'left',
  },
  artistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  artistTinyImage: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  artistName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginRight: 6,
  },
  albumMeta: {
    fontSize: 14,
    color: '#b3b3b3',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 8,
  },
  leftControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    marginRight: 24,
  },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1DB954', // Spotify Green
    justifyContent: 'center',
    alignItems: 'center',
  },
  songItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  songIndexContainer: {
    width: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  songIndex: {
    color: '#b3b3b3',
    fontSize: 16,
  },
  songInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  songTitle: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 4,
  },
  songArtist: {
    fontSize: 14,
    color: '#b3b3b3',
  },
  moreButton: {
    padding: 8,
  },
});

export default AlbumDetailsScreen;
