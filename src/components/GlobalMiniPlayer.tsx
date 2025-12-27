import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePlayback } from '../contexts/PlaybackContext';
import MiniPlayer from './MiniPlayer';

const { width } = Dimensions.get('window');

const GlobalMiniPlayer: React.FC<{ currentRouteName: string | null; navigationRef?: React.RefObject<any> }> = ({ currentRouteName, navigationRef }) => {
  const insets = useSafeAreaInsets();
  const { currentSong, isPlaying, positionMillis, durationMillis, togglePlay, next, prev } = usePlayback();

  // Hide on Player screen, Feed screen, and Auth screens
  const hiddenScreens = ['Player', 'Feed', 'Welcome', 'Login', 'SignUp'];
  if (!currentSong || hiddenScreens.includes(currentRouteName || '')) {
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
          // prefer navigationRef if provided
          if (navigationRef && navigationRef.current && typeof navigationRef.current.navigate === 'function') {
            navigationRef.current.navigate('Player', { song: currentSong });
          }
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
