import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  Alert,
  Image,
  Dimensions,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  ListRenderItem,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { getColors, spacing, radii } from '../theme/designTokens';
import { supabase } from '../utils/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import AppBackground from '../components/AppBackground';

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 2;
const ITEM_WIDTH = (width - spacing.md * 3) / COLUMN_COUNT;
const ITEM_HEIGHT = ITEM_WIDTH * 0.65; // Reduced height ratio for smaller cards

type Playlist = {
  id: string;
  title: string;
  type: 'purchased' | 'downloaded' | 'custom';
  count: number;
  cover?: string;
  gradient?: string[];
};

// Mock data for now - replace with Supabase fetch
const DEFAULT_PLAYLISTS: Playlist[] = [
  {
    id: 'purchased',
    title: 'Purchased Songs',
    type: 'purchased',
    count: 12, // Example count
    cover: 'https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?w=800&q=80',
    gradient: ['#2F80ED', '#56CCF2'],
  },
  {
    id: 'downloaded',
    title: 'Downloaded',
    type: 'downloaded',
    count: 0,
    cover: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&q=80',
    gradient: ['#FF512F', '#DD2476'],
  },
];

export default function PlaylistsScreen() {
  const navigation = useNavigation<any>();
  const { isDarkMode: isDark } = useTheme();
  const colors = getColors(isDark);
  const [userPlaylists, setUserPlaylists] = useState<Playlist[]>([]);
  const [isModalVisible, setModalVisible] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');

  useEffect(() => {
    fetchPlaylists();
  }, []);

  const fetchPlaylists = async () => {
    // TODO: Fetch user playlists from Supabase
    // const { data, error } = await supabase.from('playlists').select('*');
    // if (data) setUserPlaylists(data);
    
    // Mock user playlists
    setUserPlaylists([
      { id: '1', title: 'My Favorites', count: 24, type: 'custom', cover: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=800&q=80' },
      { id: '2', title: 'Workout Mix', count: 15, type: 'custom', cover: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80' },
    ]);
  };

  const handleCreatePlaylist = () => {
    setNewPlaylistName('');
    setModalVisible(true);
  };

  const confirmCreatePlaylist = () => {
    if (!newPlaylistName.trim()) {
      Alert.alert('Error', 'Please enter a playlist name');
      return;
    }

    // TODO: Create playlist in Supabase
    const newPlaylist: Playlist = {
      id: Date.now().toString(),
      title: newPlaylistName.trim(),
      count: 0,
      type: 'custom',
      cover:
        'https://via.placeholder.com/300/2F80ED/FFFFFF?text=' +
        newPlaylistName.trim().charAt(0).toUpperCase(),
    };
    setUserPlaylists((prev) => [...prev, newPlaylist]);
    setModalVisible(false);
  };

  const renderItem: ListRenderItem<Playlist> = useCallback(({ item }) => {
    const isSpecial = item.type === 'purchased' || item.type === 'downloaded';
    
    return (
      <TouchableOpacity
        style={[
          styles.gridItem,
          { 
            backgroundColor: colors.surface,
            borderColor: colors.border,
          }
        ]}
        onPress={() =>
          navigation.navigate('PlaylistDetail', {
            playlistId: item.id,
            title: item.title,
            type: item.type,
          })
        }
        activeOpacity={0.9}
        accessibilityLabel={`Open playlist ${item.title}`}
        accessibilityRole="button"
      >
        <View style={styles.imageContainer}>
          {item.cover ? (
            <Image source={{ uri: item.cover }} style={styles.coverImage} />
          ) : (
            <View style={[styles.placeholderCover, { backgroundColor: colors.surfaceAlt }]}>
              <Feather name="music" size={32} color={colors.primary} />
            </View>
          )}
          
          {/* Gradient Overlay for text readability */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={StyleSheet.absoluteFill}
          />

          {/* Icon Badge for special playlists */}
          {isSpecial && (
            <View style={styles.iconBadge}>
              <Ionicons 
                name={item.type === 'purchased' ? "cart" : "download"} 
                size={16} 
                color="#FFF" 
              />
            </View>
          )}

          <View style={styles.textOverlay}>
            <Text style={styles.gridTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.gridSubtitle}>{item.count} songs</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }, [colors, navigation]);

  return (
    <AppBackground>
    <SafeAreaView style={[styles.safe, { backgroundColor: 'transparent' }]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Feather name="chevron-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Playlists</Text>
        <TouchableOpacity 
          onPress={handleCreatePlaylist} 
          style={[styles.addButton, { backgroundColor: colors.primary }]}
        >
          <Feather name="plus" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={[...DEFAULT_PLAYLISTS, ...userPlaylists]}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Library</Text>
        }
      />

      <Modal
        animationType="fade"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalOverlay}
          >
            <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>New Playlist</Text>
              <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                Enter a name for your new playlist
              </Text>
              
              <TextInput
                style={[
                  styles.input, 
                  { 
                    color: colors.text, 
                    borderColor: colors.border,
                    backgroundColor: colors.background 
                  }
                ]}
                placeholder="Playlist Name"
                placeholderTextColor={colors.textSecondary}
                value={newPlaylistName}
                onChangeText={setNewPlaylistName}
                autoFocus
                onSubmitEditing={confirmCreatePlaylist}
              />
              
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  onPress={() => setModalVisible(false)} 
                  style={[styles.modalButton, styles.cancelButton]}
                >
                  <Text style={{ color: colors.text }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={confirmCreatePlaylist} 
                  style={[styles.modalButton, { backgroundColor: colors.primary }]}
                >
                  <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Create</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    flex: 1,
    marginLeft: spacing.sm,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  gridItem: {
    width: ITEM_WIDTH,
    height: ITEM_HEIGHT,
    marginBottom: spacing.md,
    borderRadius: radii.normal,
    overflow: 'hidden',
    borderWidth: 1,
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  imageContainer: {
    flex: 1,
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderCover: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.md,
  },
  gridTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 2,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  gridSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.8)',
  },
  iconBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 6,
    borderRadius: 12,
    // backdropFilter removed (web-only) to satisfy React Native StyleSheet types
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: radii.large,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: radii.normal,
    paddingHorizontal: spacing.md,
    fontSize: 16,
    marginBottom: spacing.lg,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  modalButton: {
    flex: 1,
    height: 44,
    borderRadius: radii.normal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: 'transparent',
  },
});
