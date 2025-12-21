import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { supabase } from '../utils/supabase';
import { spacing, radii, tokens } from '../theme/designTokens';
import RemoteImage from '../components/RemoteImage';

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 2;
const ITEM_WIDTH = (width - spacing.md * 3) / COLUMN_COUNT;

type Album = {
  title: string;
  artist?: string;
  cover_url?: string | null;
};

const AlbumsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlbums();
  }, []);

  const fetchAlbums = async () => {
    try {
      setLoading(true);
      // Fetch all songs to extract albums
      // Note: In a real production app, you should have a dedicated 'albums' table.
      // This is a workaround to extract albums from the 'songs' table.
      const { data } = await supabase
        .from('songs')
        .select('album, artist, cover_url')
        .not('album', 'is', null);

      if (data) {
        const uniqueAlbums = new Map();
        data.forEach((item: any) => {
            // Normalize album name to avoid duplicates with different casing
            const albumKey = item.album.trim();
            if (albumKey && !uniqueAlbums.has(albumKey)) {
                uniqueAlbums.set(albumKey, {
                    title: item.album,
                    artist: item.artist,
                    cover_url: item.cover_url
                });
            }
        });
        setAlbums(Array.from(uniqueAlbums.values()));
      } else {
          // Fallback for demo if no albums found
          setAlbums([]);
      }
    } catch (err) {
      console.warn('Exception fetching albums:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderAlbumItem = ({ item }: { item: Album }) => (
    <TouchableOpacity 
        style={styles.albumItem}
        onPress={() => navigation.navigate('AlbumDetails' as any, { album: item.title, artist: item.artist, cover_url: item.cover_url })}
        activeOpacity={0.7}
    >
      <View style={styles.imageContainer}>
        <RemoteImage 
            uri={item.cover_url} 
            width={ITEM_WIDTH} 
            height={ITEM_WIDTH} 
            style={styles.albumImage} 
            imageProps={{ resizeMode: 'cover' }}
        />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.albumTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.albumArtist} numberOfLines={1}>{item.artist}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <Ionicons name="chevron-back" size={28} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Albums</Text>
            <View style={{ width: 40 }} />
        </View>

        <FlatList
          data={albums}
          keyExtractor={(item) => item.title}
          renderItem={renderAlbumItem}
          numColumns={COLUMN_COUNT}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.columnWrapper}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  listContent: {
    padding: spacing.md,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  albumItem: {
    width: ITEM_WIDTH,
    marginBottom: spacing.xl,
  },
  imageContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    marginBottom: spacing.sm,
    borderRadius: 12,
  },
  albumImage: {
    borderRadius: 12,
  },
  textContainer: {
    paddingHorizontal: spacing.xs,
  },
  albumTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  albumArtist: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
  },
});

export default AlbumsScreen;
