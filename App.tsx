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
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import AppNavigator from './src/navigation/AppNavigator';
import GlobalMiniPlayer from './src/components/GlobalMiniPlayer';
import { useState, useEffect, useRef } from 'react';
import { View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './src/utils/supabase';
import { Session } from '@supabase/supabase-js';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // Try restoring persisted session first (faster for immediate routing)
        const stored = await AsyncStorage.getItem('sb_session');
        if (stored && mounted) {
          try {
            const parsed = JSON.parse(stored);
            setSession(parsed);
          } catch (e) {
            // ignore parse errors and fall back to supabase
          }
        }

        // Also ask Supabase for the canonical session (keeps server / client in sync)
        const { data } = await supabase.auth.getSession();
        if (mounted) {
          setSession(data.session ?? null);
        }
      } catch (e) {
        // ignore
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      // Keep in-memory state
      setSession(session);

      // Persist or remove session in storage so next app cold start can restore immediately
      (async () => {
        try {
          if (session) {
            await AsyncStorage.setItem('sb_session', JSON.stringify(session));
          } else {
            await AsyncStorage.removeItem('sb_session');
          }
        } catch (err) {
          // ignore storage errors
        }
      })();
    });

    return () => {
      subscription.unsubscribe();
      mounted = false;
    };
  }, []);

  const navigationRef = useRef<any>(null);
  const [currentRouteName, setCurrentRouteName] = useState<string | null>(null);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <ActivityIndicator size="large" color="#2F80ED" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <ThemeProvider>
        <PlaybackProvider>
        <SubscriptionProvider>
          <NavigationContainer
            ref={navigationRef}
            onReady={() => {
              setCurrentRouteName(navigationRef.current?.getCurrentRoute()?.name ?? null);
            }}
            onStateChange={() => {
              setCurrentRouteName(navigationRef.current?.getCurrentRoute()?.name ?? null);
            }}
          >
            <View style={{ flex: 1 }}>
              <AppNavigator session={session} />
              <GlobalMiniPlayer currentRouteName={currentRouteName} navigationRef={navigationRef} />
            </View>
          </NavigationContainer>
        </SubscriptionProvider>
      </PlaybackProvider>
    </ThemeProvider>
    </SafeAreaProvider>
  );
}