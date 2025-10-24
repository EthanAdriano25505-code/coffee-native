import React from 'react';
import AppNavigator from './src/navigation/AppNavigator';
import { PlaybackProvider } from './src/contexts/PlaybackContext';
import FullSongsScreen from './src/screens/FullSongsScreen';


export default function App() {
  return (
     <>
    <PlaybackProvider>
      <AppNavigator />
    </PlaybackProvider>
    <FullSongsScreen />
    </>
  );
}
