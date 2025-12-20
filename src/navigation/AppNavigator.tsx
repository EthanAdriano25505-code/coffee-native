import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

import HomeScreen from '../screens/HomeScreen';
import MusicDetail from '../screens/MusicDetail';
import FullSongsScreen from '../screens/FullSongsScreen';
import CategorySongsScreen from '../screens/CategorySongsScreen'; // <-- NEW

export default function AppNavigator() {
  return (
    <Stack.Navigator initialRouteName="Home">
      <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="MusicDetail" component={MusicDetail} />
      <Stack.Screen name="FullSongs" component={FullSongsScreen} />
      <Stack.Screen name = "CategorySongs"component={CategorySongsScreen} options={{ title: 'Songs' }} /> {/* <-- NEW */}
    </Stack.Navigator>
  );
}