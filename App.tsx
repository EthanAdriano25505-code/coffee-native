import React from 'react';

// TEMP DEV HELPER: detect and log when a string/number is passed as a direct child
// Remove this block after debugging.
if (__DEV__) {
  const origCreateElement = (React as any).createElement;
  (React as any).createElement = function patchedCreateElement(type: any, props: any, ...children: any[]) {
    const checkChild = (child: any) => {
      if (child === null || child === undefined) return;
      if (Array.isArray(child)) {
        child.forEach(checkChild);
        return;
      }
      const t = typeof child;
      if (t === 'string' || t === 'number') {
        try {
          const parentName =
            typeof type === 'string'
              ? type
              : (type && (type.displayName || type.name)) || 'Unknown';
          console.error('--- PRIMITIVE CHILD DETECTED START ---');
          console.error(`parent: ${parentName}`);
          console.error('value:', child);
          console.error(new Error('Primitive child stack').stack);
          console.error('--- PRIMITIVE CHILD DETECTED END ---');
        } catch (e) {
          // ignore logging errors
        }
      }
    };

    children.forEach(checkChild);
    return origCreateElement.apply(this, [type, props, ...children]);
  };
}

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