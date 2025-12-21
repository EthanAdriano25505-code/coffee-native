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

type Artist = {
  name: string;
  cover_url?: string | null;
};

const ArtistsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
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
        .select('artist, cover_url')
        .not('artist', 'is', null);

      if (data) {
        const uniqueArtists = new Map();
        data.forEach((item: any) => {
            if (item.artist && !uniqueArtists.has(item.artist)) {
                uniqueArtists.set(item.artist, {
                    name: item.artist,
                    cover_url: item.cover_url
                });
            }
        });
        setArtists(Array.from(uniqueArtists.values()));
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
        onPress={() => navigation.navigate('ArtistDetails', { artist: item.name, cover_url: item.cover_url })}
        activeOpacity={0.7}
    >
      <View style={styles.imageContainer}>
        <RemoteImage 
            uri={item.cover_url} 
            width={ITEM_WIDTH} 
            height={ITEM_WIDTH} 
            style={styles.artistImage} 
            imageProps={{ resizeMode: 'cover' }}
        />
        {/* Gradient Overlay for better text visibility if we wanted text over image, but here we keep it clean */}
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.artistName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.artistLabel}>Artist</Text>
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
            <Text style={styles.headerTitle}>Artists</Text>
            <View style={{ width: 40 }} />
        </View>

        <FlatList
          data={artists}
          keyExtractor={(item) => item.name}
          renderItem={renderArtistItem}
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
  artistItem: {
    width: ITEM_WIDTH,
    marginBottom: spacing.xl,
    alignItems: 'center',
  },
  imageContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    marginBottom: spacing.sm,
    borderRadius: ITEM_WIDTH / 2,
  },
  artistImage: {
    borderRadius: ITEM_WIDTH / 2,
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
  },
  artistName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 2,
  },
  artistLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
  },
});

export default ArtistsScreen;
