import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

import HomeScreen from '../screens/HomeScreen'; // We will create this screen next
import MusicDetail from '../screens/MusicDetail';
import FullSongsScreen from '../screens/FullSongsScreen';

export default function AppNavigator() {
  return (
    <Stack.Navigator initialRouteName="Home">
      <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="MusicDetail" component={MusicDetail} />
      <Stack.Screen name="FullSongs" component={FullSongsScreen} />
    </Stack.Navigator>
  );
}
