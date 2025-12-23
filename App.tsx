import React from 'react';
import 'react-native-gesture-handler';
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
import { ThemeProvider } from './src/contexts/ThemeContext';
import { SubscriptionProvider } from './src/contexts/SubscriptionContext';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';
import GlobalMiniPlayer from './src/components/GlobalMiniPlayer';
import { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { supabase } from './src/utils/supabase';
import { Session } from '@supabase/supabase-js';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <ActivityIndicator size="large" color="#2F80ED" />
      </View>
    );
  }

  return (
    <ThemeProvider>
      <PlaybackProvider>
        <SubscriptionProvider>
          <NavigationContainer>
            <View style={{ flex: 1 }}>
              <AppNavigator session={session} />
              <GlobalMiniPlayer />
            </View>
          </NavigationContainer>
        </SubscriptionProvider>
      </PlaybackProvider>
    </ThemeProvider>
  );
}