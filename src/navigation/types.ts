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
};

