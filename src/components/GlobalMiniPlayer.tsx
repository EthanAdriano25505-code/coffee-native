import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePlayback } from '../contexts/PlaybackContext';
import { useNavigation, useNavigationState } from '@react-navigation/native';
import MiniPlayer from './MiniPlayer';

const { width } = Dimensions.get('window');

const GlobalMiniPlayer: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { currentSong, isPlaying, positionMillis, durationMillis, togglePlay, next, prev } = usePlayback();

  // Get current route name to hide mini-player on specific screens
  const routeName = useNavigationState((state) => {
    if (!state) return null;
    return state.routes[state.index].name;
  });

  // Hide on Player screen, Feed screen, and Auth screens
  const hiddenScreens = ['Player', 'Welcome', 'Login', 'SignUp'];
  if (!currentSong || hiddenScreens.includes(routeName || '')) {
    return null;
  }

  return (
    <View
      style={[
        styles.container,
        { bottom: Math.max(insets.bottom, 16) }
      ]}
      pointerEvents="box-none"
    >
      <MiniPlayer
        song={currentSong}
        isPlaying={isPlaying}
        progress={durationMillis ? positionMillis / durationMillis : 0}
        onPress={() => {
          navigation.navigate('Player', { song: currentSong });
        }}
        onPlayPause={() => {
          togglePlay();
        }}
        onNext={() => next()}
        onPrev={() => prev()}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    zIndex: 9999,
  },
});

export default GlobalMiniPlayer;
