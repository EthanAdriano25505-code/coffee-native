import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

import HomeScreen from '../screens/HomeScreen'; // We will create this screen next
import MusicDetail from '../screens/MusicDetail';
import FullSongsScreen from '../screens/FullSongsScreen';
import PlayerScreen from '../screens/PlayerScreen';
import ProfileScreen from '../screens/ProfileScreen';
import CategorySongsScreen from '../screens/CategorySongsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AboutScreen from '../screens/AboutScreen';

export default function AppNavigator() {
  return (
    <Stack.Navigator initialRouteName="Home">
      <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="MusicDetail" component={MusicDetail} />
      <Stack.Screen name="FullSongs" component={FullSongsScreen} />
      <Stack.Screen name="Player" component={PlayerScreen} options={{ headerShown: false }} />
      <Stack.Screen name={"Profile" as keyof RootStackParamList} component={ProfileScreen} />
      <Stack.Screen name="CategorySongs" component={CategorySongsScreen} />
      <Stack.Screen name={"Settings" as keyof RootStackParamList} component={SettingsScreen} />
      <Stack.Screen name={"About" as keyof RootStackParamList} component={AboutScreen} />
    </Stack.Navigator>
  );
}
