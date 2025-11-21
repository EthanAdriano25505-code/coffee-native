export type RootStackParamList = {
  Home: undefined;
  MusicDetail: { songId: string };
  FullSongs: undefined;
  Player: { song?: any };
  CategorySongs: { filter?: { is_free?: boolean }; title?: string } | undefined;
};

