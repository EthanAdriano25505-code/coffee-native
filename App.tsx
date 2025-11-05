import React from 'react';
import { PlaybackProvider } from './src/contexts/PlaybackContext';
import PlayerScreen from './src/screens/PlayerScreen';
import HomeScreen from './src/screens/HomeScreen';
import MusicDetail from './src/screens/MusicDetail';
import FullSongsScreen from './src/screens/FullSongsScreen';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './src/navigation/types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <PlaybackProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Home" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="MusicDetail" component={MusicDetail} />
          <Stack.Screen name="FullSongs" component={FullSongsScreen} />
          <Stack.Screen name="Player" component={PlayerScreen} options={{ headerShown: false }} />
        </Stack.Navigator>
      </NavigationContainer>
    </PlaybackProvider>
  );
}
