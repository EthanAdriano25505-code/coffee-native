import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  Image,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { supabase } from '../utils/supabase';
import { BlurView } from 'expo-blur';
import { spacing, radii, sizes } from '../theme/designTokens';

const { width, height } = Dimensions.get('window');
const ITEM_HEIGHT = height; // Full screen

type Song = {
  id: string | number;
  title: string;
  artist?: string | null;
  audio_url?: string | null;
  teaser_url?: string | null;
  cover_url?: string | null;
  price?: number; // Mock price
};

const FeedScreen = () => {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();
  const [songs, setSongs] = useState<Song[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [loading, setLoading] = useState(true);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);

  // Fetch songs
  useEffect(() => {
    const fetchFeed = async () => {
      try {
        const { data, error } = await supabase
          .from('songs')
          .select('*')
          .limit(20); // Get some songs

        if (error) throw error;
        
        // Shuffle for "discovery" feel
        const shuffled = (data as Song[]).sort(() => 0.5 - Math.random());
        setSongs(shuffled);
      } catch (err) {
        console.warn('Error fetching feed:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFeed();
  }, []);

  // Cleanup sound on unmount or blur
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  useEffect(() => {
    if (!isFocused && sound) {
      sound.pauseAsync();
      setIsPlaying(false);
    }
  }, [isFocused, sound]);

  // Play current song
  const playSong = async (index: number) => {
    if (!songs[index]) return;
    
    try {
      if (sound) {
        await sound.unloadAsync();
      }

      const song = songs[index];
      // Prefer teaser_url, fallback to audio_url
      const uri = song.teaser_url || song.audio_url;
      
      if (!uri) return;

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true, isLooping: true },
        onPlaybackStatusUpdate
      );

      setSound(newSound);
      setIsPlaying(true);
    } catch (error) {
      console.warn('Error playing sound:', error);
    }
  };

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      setDuration(status.durationMillis || 0);
      setPosition(status.positionMillis || 0);
    }
  };

  // Handle scroll
  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      const index = viewableItems[0].index;
      if (index !== null && index !== undefined && index !== currentIndex) {
        setCurrentIndex(index);
      }
    }
  }).current;

  useEffect(() => {
    if (songs.length > 0) {
      playSong(currentIndex);
    }
  }, [currentIndex, songs]);

  const togglePlayback = async () => {
    if (!sound) return;
    if (isPlaying) {
      await sound.pauseAsync();
      setIsPlaying(false);
    } else {
      await sound.playAsync();
      setIsPlaying(true);
    }
  };

  const renderItem = ({ item, index }: { item: Song; index: number }) => {
    const isActive = index === currentIndex;
    
    return (
      <View style={{ width, height: ITEM_HEIGHT, backgroundColor: '#000' }}>
        {/* Background */}
        <Image
          source={{ uri: item.cover_url || 'https://via.placeholder.com/400' }}
          style={StyleSheet.absoluteFillObject}
          blurRadius={30}
        />
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.4)' }]} />

        {/* Content */}
        <SafeAreaView style={styles.contentContainer}>
          {/* Top Bar */}
          <View style={styles.topBar}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Feather name="arrow-left" size={24} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Discover</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Main Center Area - Album Art */}
          <View style={styles.centerArea}>
             <TouchableOpacity activeOpacity={0.9} onPress={togglePlayback} style={styles.albumArtContainer}>
                <Image 
                  source={{ uri: item.cover_url || 'https://via.placeholder.com/400' }} 
                  style={styles.albumArt} 
                />
                {!isPlaying && (
                  <View style={styles.playOverlay}>
                    <Ionicons name="play" size={50} color="rgba(255,255,255,0.9)" />
                  </View>
                )}
             </TouchableOpacity>
          </View>

          {/* Bottom Info & Actions */}
          <View style={styles.bottomSection}>
            <View style={styles.infoRow}>
              <View style={styles.textInfo}>
                <Text style={styles.songTitle}>{item.title}</Text>
                <Text style={styles.artistName}>{item.artist || 'Unknown Artist'}</Text>
                <View style={styles.tagRow}>
                   <View style={styles.tag}>
                      <Text style={styles.tagText}>Teaser</Text>
                   </View>
                   <View style={[styles.tag, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                      <Text style={styles.tagText}>Pop</Text>
                   </View>
                </View>
              </View>

              {/* Right Side Actions */}
              <View style={styles.actionsColumn}>
                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons name="heart-outline" size={32} color="#FFF" />
                  <Text style={styles.actionText}>1.2k</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons name="chatbubble-outline" size={30} color="#FFF" />
                  <Text style={styles.actionText}>450</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons name="share-social-outline" size={30} color="#FFF" />
                  <Text style={styles.actionText}>Share</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Buy Button */}
            <TouchableOpacity 
              style={styles.buyButton}
              onPress={() => Alert.alert('Purchase', 'Purchase flow would start here!')}
            >
              <View style={styles.buyContent}>
                <Text style={styles.buyText}>Buy Full Version</Text>
                <Text style={styles.priceText}>$1.29</Text>
              </View>
              <Feather name="shopping-bag" size={20} color="#000" />
            </TouchableOpacity>

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <View 
                style={[
                  styles.progressBar, 
                  { width: `${duration > 0 ? (position / duration) * 100 : 0}%` }
                ]} 
              />
            </View>
          </View>
        </SafeAreaView>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2F6DFD" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <FlatList
        data={songs}
        renderItem={renderItem}
        keyExtractor={(item) => String(item.id)}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        snapToAlignment="start"
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        initialNumToRender={3}
        maxToRenderPerBatch={3}
        windowSize={5}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  centerArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  albumArtContainer: {
    width: width * 0.75,
    height: width * 0.75,
    borderRadius: 20,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    position: 'relative',
  },
  albumArt: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  bottomSection: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: spacing.lg,
  },
  textInfo: {
    flex: 1,
    marginRight: spacing.lg,
  },
  songTitle: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  artistName: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  tagRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tag: {
    backgroundColor: '#2F6DFD',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  actionsColumn: {
    alignItems: 'center',
    gap: 20,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionText: {
    color: '#FFF',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
  },
  buyButton: {
    backgroundColor: '#FFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 20,
  },
  buyContent: {
    flexDirection: 'column',
  },
  buyText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '800',
  },
  priceText: {
    color: '#666',
    fontSize: 12,
    fontWeight: '600',
  },
  progressContainer: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#2F6DFD',
  },
});

export default FeedScreen;
