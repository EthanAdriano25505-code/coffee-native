import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Alert,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { getColors, spacing } from '../theme/designTokens';
import { supabase } from '../utils/supabase';
import { useTheme, ThemePreference } from '../contexts/ThemeContext';
import AppBackground from '../components/AppBackground';

export default function SettingsScreen() {
  // Use global theme context
  const { themePreference, setThemePreference, isDarkMode } = useTheme();
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [wifiOnlyDownloads, setWifiOnlyDownloads] = useState(true);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);

  const colors = getColors(isDarkMode);
  const navigation = useNavigation<any>();

  const clearCache = () => {
    // Placeholder: integrate with your cache strategy (e.g., Assets/Images) if needed.
    Alert.alert('Cache cleared', 'Temporary files will be cleared on next app run where applicable.');
  };

  const resetAppData = () => {
    Alert.alert('Reset app data', 'This will reset local settings. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: () => {
          setThemePreference('system');
          setNotificationsEnabled(true);
          setWifiOnlyDownloads(true);
          setHapticsEnabled(true);
          setAnalyticsEnabled(false);
          Alert.alert('Done', 'Local settings have been reset.');
        },
      },
    ]);
  };

  const signOut = () => {
    Alert.alert(
      'Sign out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase.auth.signOut();
              if (error) throw error;
              try {
                navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
              } catch (e) {
                navigation.navigate('Login');
              }
              Alert.alert('Signed out', 'You have been signed out.');
            } catch (err) {
              if (err instanceof Error) Alert.alert('Error', err.message);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <AppBackground>
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.container}>
          {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => { if (navigation?.canGoBack && navigation.canGoBack()) navigation.goBack(); else navigation?.navigate?.('Home'); }}
            style={{ padding: 6, marginRight: 8 }}
          >
            <Feather name="chevron-left" size={22} color={colors.text} />
          </TouchableOpacity>
          <Feather name="settings" size={22} color={colors.text} />
          <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
        </View>

        {/* Subscription Banner */}
        <TouchableOpacity
          onPress={() => navigation.navigate('Premium')}
          style={[
            styles.card, 
            { 
              borderColor: 'rgba(47, 128, 237, 0.3)', 
              backgroundColor: isDarkMode ? 'rgba(47, 128, 237, 0.1)' : '#F0F7FF', 
              flexDirection: 'row', 
              alignItems: 'center', 
              justifyContent: 'space-between' 
            }
          ]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#2F80ED', alignItems: 'center', justifyContent: 'center' }}>
              <Feather name="star" size={20} color="#fff" />
            </View>
            <View>
              <Text style={[styles.cardTitle, { color: colors.text, marginBottom: 2, fontSize: 16 }]}>Go Premium</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Unlock high quality audio & no ads</Text>
            </View>
          </View>
          <Feather name="chevron-right" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* Appearance */}
        <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Appearance</Text>
          <Text style={[styles.muted, { color: colors.textSecondary }]}>
            Choose theme preference (does not change app theme yet).
          </Text>

          <View style={styles.segmentRow}>
            {(['system', 'light', 'dark'] as ThemePreference[]).map((opt) => {
              const selected = themePreference === opt;
              return (
                <TouchableOpacity
                  key={opt}
                  onPress={() => setThemePreference(opt)}
                  style={[
                    styles.segmentBtn,
                    {
                      borderColor: selected ? colors.text : colors.border,
                      backgroundColor: selected ? colors.surface : 'transparent',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      { color: selected ? colors.text : colors.textSecondary },
                    ]}
                  >
                    {opt.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Playback / General */}
        <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>General</Text>

          <SettingRow
            label="Enable notifications"
            value={notificationsEnabled}
            onChange={setNotificationsEnabled}
            colors={colors}
            icon="bell"
          />
          <SettingRow
            label="Download over Wi‑Fi only"
            value={wifiOnlyDownloads}
            onChange={setWifiOnlyDownloads}
            colors={colors}
            icon="wifi"
          />
          <SettingRow
            label="Enable haptics"
            value={hapticsEnabled}
            onChange={setHapticsEnabled}
            colors={colors}
            icon="activity"
          />
          <SettingRow
            label="Share anonymous analytics"
            value={analyticsEnabled}
            onChange={setAnalyticsEnabled}
            colors={colors}
            icon="bar-chart-2"
          />
        </View>

        {/* Maintenance */}
        <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Maintenance</Text>

          <TouchableOpacity
            onPress={clearCache}
            style={[styles.actionBtn, { borderColor: colors.border }]}
          >
            <Feather name="trash-2" size={16} color={colors.text} />
            <Text style={[styles.actionText, { color: colors.text }]}>Clear cache</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={resetAppData}
            style={[styles.actionBtn, { borderColor: colors.border }]}
          >
            <Feather name="rotate-ccw" size={16} color={colors.text} />
            <Text style={[styles.actionText, { color: colors.text }]}>Reset app data</Text>
          </TouchableOpacity>
        </View>

        {/* Account */}
        <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Account</Text>

          <TouchableOpacity
            onPress={signOut}
            style={[styles.signOutBtn, { borderColor: colors.border }]}
          >
            <Feather name="log-out" size={16} color="#c62828" />
            <Text style={[styles.signOutText]}>Sign out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
    </AppBackground>
  );
}

function SettingRow({
  label,
  value,
  onChange,
  colors,
  icon,
}: {
  label: string;
  value: boolean;
  onChange: (next: boolean) => void;
  colors: any;
  icon: React.ComponentProps<typeof Feather>['name'];
}) {
  return (
    <View style={[styles.row, { borderColor: colors.border }]}>
      <View style={styles.rowLeft}>
        <Feather name={icon} size={18} color={colors.text} />
        <Text style={[styles.rowLabel, { color: colors.text }]}>{label}</Text>
      </View>
      <Switch value={value} onValueChange={onChange} />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    paddingBottom: 120,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
  },
  card: {
    padding: spacing.md,
    borderWidth: 1,
    borderRadius: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  muted: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  segmentRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  segmentBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  row: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  rowLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  actionBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  signOutBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  signOutText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#c62828',
  },
});