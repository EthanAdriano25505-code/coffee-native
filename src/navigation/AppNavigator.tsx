import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';
import { Session } from '@supabase/supabase-js';

const Stack = createNativeStackNavigator<RootStackParamList>();

import HomeScreen from '../screens/HomeScreen';
import MusicDetail from '../screens/MusicDetail';
import FullSongsScreen from '../screens/FullSongsScreen';
import PlayerScreen from '../screens/PlayerScreen';
import ProfileScreen from '../screens/ProfileScreen';
import CategorySongsScreen from '../screens/CategorySongsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AboutScreen from '../screens/AboutScreen';
import WelcomeScreen from '../screens/WelcomeScreen';
import LoginScreen from '../screens/LoginScreen';
import SignUpScreen from '../screens/SignUpScreen';

export default function AppNavigator({ session }: { session: Session | null }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {session ? (
        // Authenticated Stack
        <>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="MusicDetail" component={MusicDetail} />
          <Stack.Screen name="FullSongs" component={FullSongsScreen} />
          <Stack.Screen name="Player" component={PlayerScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="CategorySongs" component={CategorySongsScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="About" component={AboutScreen} />
        </>
      ) : (
        // Auth Stack
        <>
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="SignUp" component={SignUpScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}
