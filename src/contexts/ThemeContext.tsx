import React, { createContext, useState, useContext, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getColors, getGradients } from '../theme/designTokens';

export type ThemePreference = 'system' | 'light' | 'dark';

type ThemeContextType = {
  themePreference: ThemePreference;
  setThemePreference: (pref: ThemePreference) => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
  colors: ReturnType<typeof getColors>;
  gradients: ReturnType<typeof getGradients>;
};

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const systemScheme = useColorScheme();
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>('system');

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('theme_preference');
        if (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system') {
          setThemePreferenceState(savedTheme as ThemePreference);
        } else {
          // Fallback for legacy 'theme' key
          const legacyTheme = await AsyncStorage.getItem('theme');
          if (legacyTheme === 'dark') setThemePreferenceState('dark');
          else if (legacyTheme === 'light') setThemePreferenceState('light');
        }
      } catch (error) {
        console.error('Failed to load theme from storage', error);
      }
    };
    loadTheme();
  }, []);

  const setThemePreference = async (pref: ThemePreference) => {
    setThemePreferenceState(pref);
    try {
      await AsyncStorage.setItem('theme_preference', pref);
    } catch (e) {
      console.error(e);
    }
  };

  const isDarkMode = 
    themePreference === 'dark' || 
    (themePreference === 'system' && systemScheme === 'dark');

  const colors = getColors(isDarkMode);
  const gradients = getGradients(isDarkMode);

  const toggleTheme = () => {
    const next = isDarkMode ? 'light' : 'dark';
    setThemePreference(next);
  };

  return (
    <ThemeContext.Provider value={{ themePreference, setThemePreference, isDarkMode, toggleTheme, colors, gradients }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
