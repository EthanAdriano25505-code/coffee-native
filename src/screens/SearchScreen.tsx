import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ImageBackground,
  useColorScheme,
  Dimensions,
  Keyboard,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../utils/supabase';
import SongCard from '../components/SongCard';
import { usePlayback } from '../contexts/PlaybackContext';
import { getColors, spacing, radii } from '../theme/designTokens';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useTheme } from '../contexts/ThemeContext';
import AppBackground from '../components/AppBackground';

const { width } = Dimensions.get('window');

// --- Data ---
const CATEGORIES = [
  { name: 'DJ', image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&q=80', featured: true },
  { name: 'Pop', image: 'https://images.unsplash.com/photo-1514525253440-b393452e8d26?w=800&q=80' },
  { name: 'Rock', image: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=800&q=80' },
  { name: 'Hip Hop', image: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800&q=80' },
  { name: 'R&B', image: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=800&q=80' },
  { name: 'Country', image: 'https://images.unsplash.com/photo-1530259042678-cfa97d67edeb?w=800&q=80' },
  { name: 'Jazz', image: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=800&q=80' },
  { name: 'Classical', image: 'https://images.unsplash.com/photo-1507838153414-b4b713384ebd?w=800&q=80' },
  { name: 'Lo-fi', image: 'https://images.unsplash.com/photo-1494232410401-ad00d5433cfa?w=800&q=80' },
  { name: 'Electronic', image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&q=80' },
  { name: 'Workout', image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80' },
  { name: 'Chill', image: 'https://images.unsplash.com/photo-1499415479124-43c32433a620?w=800&q=80' },
  { name: 'Soul', image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&q=80' },
  { name: 'Blues', image: 'https://images.unsplash.com/photo-1525441273400-056e9c7517b3?w=800&q=80' },
  { name: 'Metal', image: 'https://images.unsplash.com/photo-1528645238318-22cc5cc019a7?w=800&q=80' },
  { name: 'Indie', image: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=800&q=80' },
];

type Song = {
  id: string | number;
  title: string;
  artist?: string | null;
  audio_url?: string | null;
  cover_url?: string | null;
};

export default function SearchScreen() {
  const navigation = useNavigation<any>();
  const { isDarkMode: isDark } = useTheme();
  const colors = getColors(isDark);
  const { play } = usePlayback();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // Auto-focus input on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('songs')
          .select('id,title,artist,audio_url,cover_url')
          .or(`title.ilike.%${query}%,artist.ilike.%${query}%`)
          .limit(20);

        if (error) throw error;
        setResults((data as Song[]) || []);
      } catch (err) {
        console.warn('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handlePlay = useCallback(async (song: Song) => {
    const payload = {
      id: song.id,
      title: song.title,
      artist: song.artist ?? undefined,
      cover_url: song.cover_url ?? undefined,
      uri: song.audio_url ? { uri: song.audio_url } : undefined,
    };
    await play(payload);
    navigation.navigate('Player', { song: payload });
  }, [play, navigation]);

  const clearQuery = () => {
    setQuery('');
    setResults([]);
    inputRef.current?.focus();
  };

  const navigateToCategory = (categoryName: string) => {
    navigation.navigate('CategorySongs', { title: categoryName });
  };

  // --- Render Components ---

  const renderCategoryItem = ({ item }: { item: typeof CATEGORIES[0] }) => (
    <TouchableOpacity
      activeOpacity={0.9}
      style={styles.gridItemContainer}
      onPress={() => navigateToCategory(item.name)}
    >
      <ImageBackground
        source={{ uri: item.image }}
        style={styles.gridItemImage}
        imageStyle={{ borderRadius: radii.normal }}
      >
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.2)', 'rgba(0,0,0,0.8)']}
          locations={[0, 0.5, 1]}
          style={styles.categoryOverlay}
        >
          <View style={styles.categoryContent}>
            <Text style={styles.categoryText}>{item.name}</Text>
            <View style={styles.categoryIcon}>
              <Feather name="music" size={12} color="rgba(255,255,255,0.8)" />
            </View>
          </View>
        </LinearGradient>
      </ImageBackground>
    </TouchableOpacity>
  );

  const renderFeaturedCategory = () => {
    const item = CATEGORIES[0]; // DJ
    return (
      <View style={styles.featuredContainer}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Browse Categories</Text>
        <TouchableOpacity
          activeOpacity={0.95}
          style={styles.featuredItem}
          onPress={() => navigateToCategory(item.name)}
        >
          <ImageBackground
            source={{ uri: item.image }}
            style={styles.featuredImage}
            imageStyle={{ borderRadius: radii.large }}
          >
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.2)', 'rgba(0,0,0,0.9)']}
              locations={[0, 0.5, 1]}
              style={styles.featuredOverlay}
            >
              <Text style={styles.featuredText}>{item.name}</Text>
              <View style={styles.featuredBadge}>
                <Text style={styles.featuredBadgeText}>Featured</Text>
              </View>
            </LinearGradient>
          </ImageBackground>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <AppBackground>
    <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Feather name="chevron-left" size={28} color={isDark ? '#fff' : colors.text} />
        </TouchableOpacity>

        <View style={[styles.searchBar, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#FFFFFF' }]}>
          <Feather name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            ref={inputRef}
            style={[styles.input, { color: colors.text }]}
            placeholder="What do you want to listen to?"
            placeholderTextColor={colors.textSecondary}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            selectionColor={colors.primary}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={clearQuery} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {query.length === 0 ? (
          // Categories Grid
          <FlatList
            data={CATEGORIES.slice(1)} // Skip the first one (DJ) as it's in the header
            keyExtractor={(item) => item.name}
            numColumns={2}
            renderItem={renderCategoryItem}
            ListHeaderComponent={renderFeaturedCategory}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            columnWrapperStyle={styles.columnWrapper}
          />
        ) : (
          // Search Results
          <View style={{ flex: 1 }}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : (
              <FlatList
                data={results}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <View style={{ marginBottom: spacing.sm }}>
                    <SongCard song={item} onPress={() => handlePlay(item)} />
                  </View>
                )}
                contentContainerStyle={styles.resultsContent}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Feather name="music" size={64} color={isDark ? '#333' : '#DDD'} />
                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                      No songs found for "{query}"
                    </Text>
                    <Text style={[styles.emptySubtext, { color: colors.muted }]}>
                      Try searching for a different artist or song title.
                    </Text>
                  </View>
                }
              />
            )}
          </View>
        )}
      </View>
    </SafeAreaView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  backButton: {
    padding: 4,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderRadius: radii.round,
    paddingHorizontal: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: '100%',
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl * 3,
  },
  resultsContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl * 3,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: spacing.md,
    letterSpacing: 0.5,
  },
  // Featured Category (DJ)
  featuredContainer: {
    marginBottom: spacing.lg,
  },
  featuredItem: {
    width: '100%',
    height: 240,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
  featuredImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
  },
  featuredOverlay: {
    padding: spacing.lg,
    borderBottomLeftRadius: radii.large,
    borderBottomRightRadius: radii.large,
    height: '100%',
    justifyContent: 'flex-end',
  },
  featuredText: {
    color: '#FFF',
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  featuredBadge: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.small,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  featuredBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  // Grid Categories
  columnWrapper: {
    justifyContent: 'space-between',
  },
  gridItemContainer: {
    width: (width - spacing.md * 3) / 2,
    height: 150,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  gridItemImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
  },
  categoryOverlay: {
    padding: spacing.md,
    borderBottomLeftRadius: radii.normal,
    borderBottomRightRadius: radii.normal,
    height: '100%',
    justifyContent: 'flex-end',
  },
  categoryContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  categoryText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '800',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  // States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: spacing.xl,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.xl * 2,
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
