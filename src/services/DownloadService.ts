import AsyncStorage from '@react-native-async-storage/async-storage';

const DOWNLOADED_SONGS_KEY = '@downloaded_songs';

export type DownloadedSong = {
  id: string | number;
  title: string;
  artist?: string | null;
  cover_url?: string | null;
  audio_url?: string | null;
  downloaded_at: string;
};

export const DownloadService = {
  async getDownloadedSongs(): Promise<DownloadedSong[]> {
    try {
      const jsonValue = await AsyncStorage.getItem(DOWNLOADED_SONGS_KEY);
      return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (e) {
      console.error('Error fetching downloaded songs', e);
      return [];
    }
  },

  async saveSong(song: DownloadedSong): Promise<void> {
    try {
      const songs = await this.getDownloadedSongs();
      if (songs.find(s => s.id === song.id)) return;
      
      const newSongs = [song, ...songs];
      await AsyncStorage.setItem(DOWNLOADED_SONGS_KEY, JSON.stringify(newSongs));
    } catch (e) {
      console.error('Error saving downloaded song', e);
    }
  },

  async removeSong(songId: string | number): Promise<void> {
    try {
      const songs = await this.getDownloadedSongs();
      const newSongs = songs.filter(s => s.id !== songId);
      await AsyncStorage.setItem(DOWNLOADED_SONGS_KEY, JSON.stringify(newSongs));
    } catch (e) {
      console.error('Error removing downloaded song', e);
    }
  },

  async isDownloaded(songId: string | number): Promise<boolean> {
    const songs = await this.getDownloadedSongs();
    return !!songs.find(s => s.id === songId);
  }
};
