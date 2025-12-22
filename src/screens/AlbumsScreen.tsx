import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Dimensions, 
  StatusBar,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { supabase } from '../utils/supabase';
import RemoteImage from '../components/RemoteImage';
import AppBackground from '../components/AppBackground';
import { useTheme } from '../contexts/ThemeContext';
import { getColors } from '../theme/designTokens';

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 2;
const ITEM_SPACING = 16;
const ITEM_WIDTH = (width - (ITEM_SPACING * (COLUMN_COUNT + 1))) / COLUMN_COUNT;

interface Album {
  title: string;
  artist: string;
  cover_url: string;
  songs?: Array<{ id?: string | number; title: string; audio_url?: string | null; cover_url?: string | null }>;
}

const AlbumsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { isDarkMode: isDark } = useTheme();
  const colors = getColors(isDark);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlbums();
  }, []);

  const fetchAlbums = async () => {
    try {
      setLoading(true);
      const { data } = await supabase
        .from('songs')
        .select('album, artist, cover_url')
        .not('album', 'is', null);

      if (data && data.length > 0) {
        const uniqueAlbums = new Map();
        data.forEach((item: any) => {
          const albumKey = item.album?.trim();
          if (albumKey) {
            if (!uniqueAlbums.has(albumKey)) {
              uniqueAlbums.set(albumKey, {
                title: item.album,
                artist: item.artist,
                cover_url: item.cover_url,
                songs: [],
              });
            }
            // collect up to 3 songs per album for the preview
            const albumEntry = uniqueAlbums.get(albumKey);
            if (albumEntry && albumEntry.songs.length < 3) {
              albumEntry.songs.push({ id: item.id, title: item.title, audio_url: item.audio_url, cover_url: item.cover_url });
            }
          }
        });
        setAlbums(Array.from(uniqueAlbums.values()));
      } else {
          // Fallback dummy data for demo if no albums found
          setAlbums([
            { title: 'Midnight Vibes', artist: 'The Weeknd', cover_url: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=800&q=80' },
            { title: 'Neon Dreams', artist: 'Dua Lipa', cover_url: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=800&q=80' },
            { title: 'Retro Future', artist: 'Kavinsky', cover_url: 'https://images.unsplash.com/photo-1619983081563-430f63602796?w=800&q=80' },
            { title: 'Summer Hits', artist: 'Calvin Harris', cover_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&q=80' },
          ]);
      }
    } catch (err) {
      console.warn('Exception fetching albums:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderAlbumItem = ({ item }: { item: Album }) => (
    <TouchableOpacity 
        style={[styles.albumItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={() => navigation.navigate('AlbumDetails' as any, { album: item.title, artist: item.artist, cover_url: item.cover_url })}
        activeOpacity={0.8}
    >
      <View style={styles.imageContainer}>
        <RemoteImage 
            uri={item.cover_url} 
            width={ITEM_WIDTH} 
            height={ITEM_WIDTH} 
            style={styles.albumImage} 
            imageProps={{ resizeMode: 'cover' }}
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.playIcon}>
           <Ionicons name="play-circle" size={32} color="rgba(255,255,255,0.9)" />
        </View>
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.albumTitle, { color: colors.text }]} numberOfLines={1}>{item.title}</Text>
        <Text style={[styles.albumArtist, { color: colors.textSecondary }]} numberOfLines={1}>{item.artist || 'Unknown Artist'}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <AppBackground>
    <View style={[styles.container, { backgroundColor: 'transparent' }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <BlurView intensity={20} tint={isDark ? "light" : "dark"} style={styles.blurButton}>
                   <Feather name="arrow-left" size={24} color={colors.text} />
                </BlurView>
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Albums</Text>
            <View style={{ width: 40 }} />
        </View>

        {loading ? (
           <View style={styles.centerContainer}>
             <ActivityIndicator size="large" color="#2F6DFD" />
           </View>
        ) : (
          <FlatList
            data={albums}
            renderItem={renderAlbumItem}
            keyExtractor={(item, index) => `${item.title}-${index}`}
            numColumns={COLUMN_COUNT}
            contentContainerStyle={styles.listContent}
            columnWrapperStyle={styles.columnWrapper}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Feather name="disc" size={48} color={colors.textSecondary} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No albums found</Text>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </View>
    </AppBackground>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  blurButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  listContent: {
    padding: ITEM_SPACING,
    paddingBottom: 100,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: ITEM_SPACING,
  },
  albumItem: {
    width: ITEM_WIDTH,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  imageContainer: {
    width: ITEM_WIDTH,
    height: ITEM_WIDTH,
    position: 'relative',
  },
  albumImage: {
    width: '100%',
    height: '100%',
  },
  playIcon: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    opacity: 0.8,
  },
  textContainer: {
    padding: 12,
  },
  albumTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  albumArtist: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
  },
  songsPreview: {
    marginTop: 8,
  },
  songPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  songPreviewImage: {
    width: 36,
    height: 36,
    borderRadius: 6,
    marginRight: 8,
  },
  songPreviewTitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 16,
    marginTop: 12,
  },
});

export default AlbumsScreen;
