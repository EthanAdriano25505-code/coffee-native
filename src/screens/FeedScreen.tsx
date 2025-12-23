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
import { usePlayback } from '../contexts/PlaybackContext';
import { supabase } from '../utils/supabase';
import { BlurView } from 'expo-blur';
import { spacing, radii, sizes } from '../theme/designTokens';
import { useTheme } from '../contexts/ThemeContext';
import AppBackground from '../components/AppBackground';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withRepeat, 
  withTiming, 
  withSequence,
  FadeInDown,
  FadeInRight,
  Easing,
  cancelAnimation,
  runOnJS
} from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';

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

const FeedItem = React.memo(({ 
  item, 
  isActive, 
  isPlaying, 
  progress,
  togglePlayback 
}: { 
  item: Song; 
  isActive: boolean; 
  isPlaying: boolean; 
  progress: ReturnType<typeof useSharedValue>;
  togglePlayback: () => void; 
}) => {
  const navigation = useNavigation();
  
  // Animation Values
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);
  const heartScale = useSharedValue(0);
  const buyButtonScale = useSharedValue(1);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    if (isActive && isPlaying) {
      rotation.value = withRepeat(
        withTiming(360, { duration: 8000, easing: Easing.linear }),
        -1,
        false
      );
    } else {
      cancelAnimation(rotation);
    }
  }, [isActive, isPlaying]);

  // Pulse animation for Buy Button
  useEffect(() => {
    if (isActive) {
      buyButtonScale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 1000 }),
          withTiming(1, { duration: 1000 })
        ),
        -1,
        true
      );
    } else {
      cancelAnimation(buyButtonScale);
      buyButtonScale.value = 1;
    }
  }, [isActive]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }, { scale: scale.value }],
    };
  });

  const heartStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: Math.max(heartScale.value, 0) }],
      opacity: heartScale.value,
    };
  });

  const buyButtonStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: buyButtonScale.value }],
    };
  });

  const progressStyle = useAnimatedStyle(() => {
    return {
      width: `${progress.value * 100}%`,
    };
  });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onStart(() => {
      runOnJS(setIsLiked)(true);
      heartScale.value = withSpring(1, undefined, (finished: boolean) => {
        if (finished) {
          heartScale.value = withTiming(0, { duration: 500 });
        }
      });
    });

  const singleTap = Gesture.Tap()
    .onStart(() => {
      scale.value = withSequence(
        withTiming(0.9, { duration: 100 }),
        withTiming(1, { duration: 100 })
      );
      runOnJS(togglePlayback)();
    });

  return (
    <View style={{ width, height: ITEM_HEIGHT, backgroundColor: '#000' }}>
      {/* Background & Main Tap Area */}
      <GestureDetector gesture={Gesture.Exclusive(doubleTap, singleTap)}>
        <View style={StyleSheet.absoluteFill}>
          <Image
            source={{ uri: item.cover_url || 'https://via.placeholder.com/400' }}
            style={StyleSheet.absoluteFillObject}
            blurRadius={50}
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.6)', '#000']}
            style={StyleSheet.absoluteFillObject}
          />
          
          <View style={styles.centerArea}>
             <Animated.View style={[styles.albumArtContainer, animatedStyle]}>
                <Image 
                  source={{ uri: item.cover_url || 'https://via.placeholder.com/400' }} 
                  style={styles.albumArt} 
                />
                {/* Vinyl Center Hole */}
                <View style={styles.vinylHole} />
             </Animated.View>
             
             {/* Big Heart Animation */}
             <Animated.View style={[styles.bigHeart, heartStyle]}>
               <Ionicons name="heart" size={100} color="#FFF" />
             </Animated.View>

             {!isPlaying && (
                <View style={styles.playOverlay}>
                  <Ionicons name="play" size={50} color="rgba(255,255,255,0.9)" />
                </View>
              )}
          </View>
        </View>
      </GestureDetector>

      {/* Content Overlay */}
      <SafeAreaView style={styles.contentContainer} pointerEvents="box-none">
        {/* Top Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Feather name="arrow-left" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Discover</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Bottom Info & Actions */}
        <View style={styles.bottomSection} pointerEvents="box-none">
          <View style={styles.infoRow} pointerEvents="box-none">
            <View style={styles.textInfo} pointerEvents="box-none">
              <Animated.View entering={FadeInDown.delay(200).duration(500)}>
                <Text style={styles.songTitle}>{item.title}</Text>
              </Animated.View>
              <Animated.View entering={FadeInDown.delay(300).duration(500)}>
                <Text style={styles.artistName}>{item.artist || 'Unknown Artist'}</Text>
              </Animated.View>
              <Animated.View 
                entering={FadeInDown.delay(400).duration(500)} 
                style={styles.tagRow}
              >
                 <View style={styles.tag}>
                    <Text style={styles.tagText}>Teaser</Text>
                 </View>
                 <View style={[styles.tag, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                    <Text style={styles.tagText}>Pop</Text>
                 </View>
              </Animated.View>
            </View>

            {/* Right Side Actions - Safe Zone */}
            <View style={styles.actionsColumn} pointerEvents="box-none">
              <Animated.View entering={FadeInRight.delay(300).springify()}>
                <TouchableOpacity 
                  style={styles.profileContainer}
                  hitSlop={{ top: 10, bottom: 10, left: 20, right: 20 }}
                >
                   <Image source={{ uri: item.cover_url || 'https://via.placeholder.com/100' }} style={styles.profileImage} />
                   <View style={styles.plusBadge}>
                        <Feather name="plus" size={10} color="#FFF" />
                   </View>
                </TouchableOpacity>
              </Animated.View>

              <Animated.View entering={FadeInRight.delay(400).springify()}>
                <TouchableOpacity 
                  style={styles.actionButton} 
                  onPress={() => setIsLiked(!isLiked)}
                  hitSlop={{ top: 10, bottom: 10, left: 20, right: 20 }}
                >
                  <Ionicons name={isLiked ? "heart" : "heart-outline"} size={35} color={isLiked ? "#FF2D55" : "#FFF"} />
                  <Text style={styles.actionText}>{isLiked ? '1.3k' : '1.2k'}</Text>
                </TouchableOpacity>
              </Animated.View>
              
              <Animated.View entering={FadeInRight.delay(500).springify()}>
                <TouchableOpacity 
                  style={styles.actionButton}
                  hitSlop={{ top: 10, bottom: 10, left: 20, right: 20 }}
                >
                  <Ionicons name="chatbubble-ellipses-outline" size={32} color="#FFF" />
                  <Text style={styles.actionText}>450</Text>
                </TouchableOpacity>
              </Animated.View>

              <Animated.View entering={FadeInRight.delay(600).springify()}>
                <TouchableOpacity 
                  style={styles.actionButton}
                  hitSlop={{ top: 10, bottom: 10, left: 20, right: 20 }}
                >
                  <Ionicons name="share-social-outline" size={32} color="#FFF" />
                  <Text style={styles.actionText}>Share</Text>
                </TouchableOpacity>
              </Animated.View>

              <Animated.View entering={FadeInRight.delay(700).springify()}>
                <TouchableOpacity 
                  style={[styles.actionButton, { marginTop: 10 }]}
                  hitSlop={{ top: 10, bottom: 10, left: 20, right: 20 }}
                >
                   <View style={styles.vinylIcon}>
                      <Image source={{ uri: item.cover_url || 'https://via.placeholder.com/100' }} style={styles.vinylImage} />
                   </View>
                </TouchableOpacity>
              </Animated.View>
            </View>
          </View>

          {/* Buy Button */}
          <Animated.View entering={FadeInDown.delay(800).springify()}>
            <Animated.View style={buyButtonStyle}>
              <TouchableOpacity 
                style={styles.buyButton}
                onPress={() => Alert.alert('Purchase', 'Purchase flow would start here!')}
                activeOpacity={0.8}
              >
                <View style={styles.buyContent}>
                  <Text style={styles.buyText}>Buy Full Version</Text>
                  <Text style={styles.priceText}>$1.29 • High Quality Audio</Text>
                </View>
                <View style={styles.buyIconContainer}>
                   <Feather name="shopping-bag" size={20} color="#000" />
                </View>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <Animated.View 
              style={[
                styles.progressBar, 
                progressStyle
              ]} 
            />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
});

const FeedScreen = () => {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const { pause: pauseGlobal } = usePlayback();
  const insets = useSafeAreaInsets();
  const { isDarkMode: isDark, colors, gradients } = useTheme();
  const [songs, setSongs] = useState<Song[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentIndexRef = useRef(0);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [loading, setLoading] = useState(true);
  const progress = useSharedValue(0);
  const lastRequestId = useRef(0);

  // Configure Audio Mode
  useEffect(() => {
    const setupAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: false,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
      } catch (e) {
        console.warn('Audio mode setup error:', e);
      }
    };
    setupAudio();
  }, []);

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

  // Pause global playback (e.g. Home mini-player) when Feed becomes focused
  useEffect(() => {
    if (isFocused) {
      // best-effort pause; ignore errors
      pauseGlobal().catch(() => {});
    }
  }, [isFocused, pauseGlobal]);

  useEffect(() => {
    if (!isFocused && sound) {
      sound.pauseAsync();
      setIsPlaying(false);
    }
  }, [isFocused, sound]);

  // Play current song
  const playSong = async (index: number) => {
    if (!songs[index]) return;
    
    const requestId = ++lastRequestId.current;
    
    try {
      // 1. Immediate cleanup of previous sound (don't await unload to keep it snappy)
      if (sound) {
        const oldSound = sound;
        setSound(null);
        oldSound.stopAsync().then(() => oldSound.unloadAsync()).catch(() => {});
      }

      const song = songs[index];
      const uri = song.teaser_url || song.audio_url;
      
      if (!uri) return;

      // 2. Load new sound
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true, isLooping: true, progressUpdateIntervalMillis: 100 },
        onPlaybackStatusUpdate
      );

      // 3. Check if this is still the latest request before setting state
      if (requestId === lastRequestId.current) {
        setSound(newSound);
        setIsPlaying(true);
        progress.value = 0;
      } else {
        // If user scrolled away while loading, clean up this sound
        newSound.unloadAsync().catch(() => {});
      }
    } catch (error) {
      if (requestId === lastRequestId.current) {
        console.warn('Error playing sound:', error);
        setIsPlaying(false);
      }
    }
  };

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded && status.durationMillis) {
      progress.value = status.positionMillis / status.durationMillis;
    }
  };

  // Handle scroll
  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      const index = viewableItems[0].index;
      if (index !== null && index !== undefined && index !== currentIndexRef.current) {
        setCurrentIndex(index);
        currentIndexRef.current = index;
        
        // Cancel any pending loads immediately
        lastRequestId.current++;
        
        // Stop current sound immediately for instant silence on scroll
        if (sound) {
          sound.stopAsync().catch(() => {});
        }
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

  const renderItem = useCallback(({ item, index }: { item: Song; index: number }) => {
    return (
      <FeedItem 
        item={item} 
        isActive={index === currentIndex}
        isPlaying={isPlaying}
        progress={progress}
        togglePlayback={togglePlayback}
      />
    );
  }, [currentIndex, isPlaying, togglePlayback]);



  if (loading) {
    return (
      <AppBackground>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2F6DFD" />
        </View>
      </AppBackground>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppBackground>
        <StatusBar barStyle="light-content" />
        <FlatList
          data={songs}
          renderItem={renderItem}
          keyExtractor={(item) => String(item.id)}
          pagingEnabled
          disableIntervalMomentum={true}
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_HEIGHT}
          snapToAlignment="start"
          decelerationRate="fast"
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
          initialNumToRender={3}
          maxToRenderPerBatch={3}
          windowSize={5}
          getItemLayout={(data, index) => (
            { length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index }
          )}
        />
      </AppBackground>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
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
    zIndex: 10,
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
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  centerArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  albumArtContainer: {
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: (width * 0.6) / 2,
    borderWidth: 6,
    borderColor: 'rgba(255,255,255,0.1)',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111',
  },
  albumArt: {
    width: '100%',
    height: '100%',
    borderRadius: (width * 0.6) / 2,
    opacity: 0.9,
  },
  vinylHole: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#000',
    borderWidth: 2,
    borderColor: '#333',
    zIndex: 2,
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    zIndex: 10,
  },
  bigHeart: {
    position: 'absolute',
    zIndex: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  bottomSection: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
    zIndex: 10,
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
    justifyContent: 'flex-end',
    paddingBottom: 10,
  },
  songTitle: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 6,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  artistName: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  tagRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tag: {
    backgroundColor: 'rgba(47, 109, 253, 0.8)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  actionsColumn: {
    alignItems: 'center',
    gap: 24,
    paddingBottom: 10,
  },
  profileContainer: {
    marginBottom: 10,
    position: 'relative',
  },
  profileImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  plusBadge: {
    position: 'absolute',
    bottom: -5,
    alignSelf: 'center',
    backgroundColor: '#FF2D55',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButton: {
    alignItems: 'center',
  },
  actionText: {
    color: '#FFF',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  vinylIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 6,
    borderColor: '#222',
  },
  vinylImage: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  buyButton: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  buyContent: {
    flexDirection: 'column',
  },
  buyText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  priceText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  buyIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressContainer: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#FFF',
  },
});

export default FeedScreen;
