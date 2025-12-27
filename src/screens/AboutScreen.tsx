import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Linking,
  TouchableOpacity,
  Platform,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { getColors, spacing } from '../theme/designTokens';
import { useTheme } from '../contexts/ThemeContext';
import AppBackground from '../components/AppBackground';

const Constants: any = (() => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('expo-constants');
  } catch {
    // Fallback when expo-constants or its types are not available
    return {};
  }
})();

const openLink = async (url: string) => {
  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    }
  } catch {
    // Silently ignore to avoid crashes
  }
};

export default function AboutScreen() {
  const { isDarkMode: isDark } = useTheme();
  const colors = getColors(isDark);
  const navigation = useNavigation<any>();

  const appName = Constants.expoConfig?.name ?? Constants.manifest?.name ?? 'Coffee Native';
  const appVersion = Constants.expoConfig?.version ?? Constants.manifest?.version ?? '1.0.0';
  const sdkVersion = (Constants.expoConfig as any)?.sdkVersion ?? Constants.manifest?.sdkVersion ?? 'unknown';

  return (
    <AppBackground>
    <SafeAreaView style={[styles.safe, { backgroundColor: 'transparent' }]}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => { if (navigation?.canGoBack && navigation.canGoBack()) navigation.goBack(); else navigation?.navigate?.('Home'); }}
            style={{ padding: 6, marginRight: 8 }}
          >
            <Feather name="chevron-left" size={22} color={colors.text} />
          </TouchableOpacity>
          <Feather name="info" size={22} color={colors.text} />
          <Text style={[styles.title, { color: colors.text }]}>About</Text>
        </View>

        {/* App overview */}
        <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <Text style={[styles.appName, { color: colors.text }]}>{appName}</Text>
          <Text style={[styles.muted, { color: colors.textSecondary }]}>
            A simple music app with a clean player, profile, and drawer navigation.
          </Text>
          <View style={styles.metaRow}>
            <MetaItem label="Version" value={appVersion} colors={colors} />
            <MetaItem label="Expo SDK" value={String(sdkVersion)} colors={colors} />
            <MetaItem label="Platform" value={Platform.OS} colors={colors} />
          </View>
        </View>

        {/* Links */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Links</Text>
          <LinkItem
            label="Project Repository"
            icon="github"
            onPress={() =>
              openLink('https://github.com/EthanAdriano25505-code/coffee-native')
            }
            colors={colors}
          />
          <LinkItem
            label="Privacy Policy"
            icon="shield"
            onPress={() => openLink('https://example.com/privacy')}
            colors={colors}
          />
          <LinkItem
            label="Terms of Use"
            icon="file-text"
            onPress={() => openLink('https://example.com/terms')}
            colors={colors}
          />
          <LinkItem
            label="Contact Support"
            icon="mail"
            onPress={() => openLink('mailto:support@example.com')}
            colors={colors}
          />
        </View>

        {/* Credits / Acknowledgments */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Credits</Text>
          <Text style={[styles.muted, { color: colors.textSecondary }]}>
            Design and development by Saw K Za.
          </Text>
          <Text style={[styles.muted, { color: colors.textSecondary, marginTop: spacing.xs }]}>
            Built with React Native, Expo, and React Navigation.
          </Text>
        </View>

        {/* Licenses / Third-party */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Licenses</Text>
          <Text style={[styles.muted, { color: colors.textSecondary }]}>
            This app may include third‑party libraries licensed under their respective terms.
            See the repository for full license information.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
    </AppBackground>
  );
}

function MetaItem({ label, value, colors }: { label: string; value: string; colors: any }) {
  return (
    <View style={[styles.metaItem, { backgroundColor: colors.surface }]}>
      <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.metaValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

function LinkItem({
  label,
  icon,
  onPress,
  colors,
}: {
  label: string;
  icon: React.ComponentProps<typeof Feather>['name'];
  onPress: () => void;
  colors: any;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.linkRow, { borderColor: colors.border, backgroundColor: colors.surface }]}
    >
      <View style={styles.linkLeft}>
        <Feather name={icon} size={18} color={colors.text} />
        <Text style={[styles.linkLabel, { color: colors.text }]}>{label}</Text>
      </View>
      <Feather name="external-link" size={16} color={colors.textSecondary} />
    </TouchableOpacity>
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
  appName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
    flexWrap: 'wrap',
  },
  metaItem: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  metaLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  section: {
    marginTop: spacing.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  muted: {
    fontSize: 14,
    lineHeight: 20,
  },
  linkRow: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  linkLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  linkLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
});