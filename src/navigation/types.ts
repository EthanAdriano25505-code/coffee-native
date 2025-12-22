export type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  SignUp: undefined;
  Home: undefined;
  MusicDetail: { songId: string };
  FullSongs: undefined;
  Player: { song?: any };
  CategorySongs: { filter?: { is_free?: boolean }; title?: string } | undefined;
  Profile: undefined;
  Settings: undefined;
  About: undefined;
  Search: undefined;
  Playlists: undefined;
  PlaylistDetail: { playlistId: string; title: string; type?: 'purchased' | 'downloaded' | 'custom' };
  AlbumDetails: { album: string; artist?: string; cover_url?: string };
  ArtistDetails: { artist: string; cover_url?: string };
  Artists: undefined;
  Albums: undefined;
  Feed: undefined;
  Premium: undefined;
};

