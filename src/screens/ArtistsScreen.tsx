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
const COLUMN_COUNT = 3;
const ITEM_SPACING = 12;
const ITEM_WIDTH = (width - (ITEM_SPACING * (COLUMN_COUNT + 1))) / COLUMN_COUNT;

interface Artist {
  name: string;
  cover_url: string;
  songs?: Array<{ id?: string | number; title: string; audio_url?: string | null }>;
}

const ArtistsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { isDarkMode: isDark } = useTheme();
  const colors = getColors(isDark);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArtists();
  }, []);

  const fetchArtists = async () => {
    try {
      setLoading(true);
      const { data } = await supabase
        .from('songs')
        .select('artist, cover_url, id, title, audio_url')
        .not('artist', 'is', null);

      if (data && data.length > 0) {
        const uniqueArtists = new Map();
        data.forEach((item: any) => {
          const artistKey = item.artist?.trim();
          if (artistKey) {
            if (!uniqueArtists.has(artistKey)) {
              uniqueArtists.set(artistKey, {
                name: item.artist,
                cover_url: item.cover_url,
                songs: [],
              });
            }
            const entry = uniqueArtists.get(artistKey);
            if (entry && entry.songs.length < 2 && item.title) {
              entry.songs.push({ id: item.id, title: item.title, audio_url: item.audio_url });
            }
          }
        });
        setArtists(Array.from(uniqueArtists.values()));
      } else {
          // Fallback dummy data for demo if no artists found
          setArtists([
            { name: 'The Weeknd', cover_url: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=800&q=80' },
            { name: 'Dua Lipa', cover_url: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=800&q=80' },
            { name: 'Kavinsky', cover_url: 'https://images.unsplash.com/photo-1619983081563-430f63602796?w=800&q=80' },
            { name: 'Calvin Harris', cover_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&q=80' },
            { name: 'Daft Punk', cover_url: 'https://images.unsplash.com/photo-1598387993441-a364f854c3e1?w=800&q=80' },
            { name: 'Tame Impala', cover_url: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=800&q=80' },
          ]);
      }
    } catch (err) {
      console.warn('Exception fetching artists:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderArtistItem = ({ item }: { item: Artist }) => (
    <TouchableOpacity 
        style={styles.artistItem}
        onPress={() => navigation.navigate('ArtistDetails' as any, { artist: item.name, cover_url: item.cover_url })}
        activeOpacity={0.8}
    >
      <View style={styles.imageContainer}>
        <RemoteImage 
            uri={item.cover_url} 
            width={ITEM_WIDTH} 
            height={ITEM_WIDTH} 
            style={styles.artistImage} 
            imageProps={{ resizeMode: 'cover' }}
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.4)']}
          style={StyleSheet.absoluteFillObject}
        />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.artistName} numberOfLines={1}>{item.name}</Text>
        {item.songs && item.songs.length > 0 && (
          <View style={styles.artistSongsPreview}>
            {item.songs.map((s, i) => (
              <Text key={`${s.id ?? s.title}-${i}`} style={styles.artistSongText} numberOfLines={1}>{s.title}</Text>
            ))}
          </View>
        )}
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
            <Text style={[styles.headerTitle, { color: colors.text }]}>Artists</Text>
            <View style={{ width: 40 }} />
        </View>

        {loading ? (
           <View style={styles.centerContainer}>
             <ActivityIndicator size="large" color="#2F6DFD" />
           </View>
        ) : (
          <FlatList
            data={artists}
            renderItem={renderArtistItem}
            keyExtractor={(item, index) => `${item.name}-${index}`}
            numColumns={COLUMN_COUNT}
            contentContainerStyle={styles.listContent}
            columnWrapperStyle={styles.columnWrapper}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Feather name="users" size={48} color="rgba(255,255,255,0.3)" />
                <Text style={styles.emptyText}>No artists found</Text>
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
    marginBottom: ITEM_SPACING + 10,
  },
  artistItem: {
    width: ITEM_WIDTH,
    alignItems: 'center',
  },
  imageContainer: {
    width: ITEM_WIDTH,
    height: ITEM_WIDTH,
    borderRadius: ITEM_WIDTH / 2,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  artistImage: {
    width: '100%',
    height: '100%',
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  artistName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
    textAlign: 'center',
  },
  artistLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    display: 'none', // Hide label for cleaner look in 3 columns
  },
  artistSongsPreview: {
    marginTop: 4,
  },
  artistSongText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.75)',
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

export default ArtistsScreen;
