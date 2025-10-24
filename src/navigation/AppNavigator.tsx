import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

import HomeScreen from '../screens/HomeScreen';
import MusicDetail from '../screens/MusicDetail';
import FullSongsScreen from '../screens/FullSongsScreen'; // Import your full song screen

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="MusicDetail" component={MusicDetail} />
        <Stack.Screen name={"FullSongs" as keyof RootStackParamList} component={FullSongsScreen} options={{ title: 'Full Songs' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
