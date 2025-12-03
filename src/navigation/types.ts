export type RootStackParamList = {
  Home: undefined;
  MusicDetail: { songId: string };
  FullSongs: undefined;
  Player: { song?: any } | undefined;
  CategorySongs: {
    filter?: string;
    title?: string;
  } | undefined;
};