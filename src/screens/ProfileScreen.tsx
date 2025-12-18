import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  TextInput,
  Alert,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { getColors, spacing, radii } from '../theme/designTokens';
import { supabase } from '../utils/supabase';

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = getColors(isDark);

  const [name, setName] = useState('User');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('Music lover & React Native enthusiast.');
  const [image, setImage] = useState('https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=880&q=80');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) {
        setEmail(user.email);
        // Optionally fetch profile data from a 'profiles' table if you have one
      }
    });
  }, []);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) Alert.alert('Error', error.message);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleSave = () => {
    setIsEditing(false);
    Alert.alert('Profile Updated', 'Your changes have been saved locally.');
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Feather name="user" size={22} color={colors.text} />
            <Text style={[styles.title, { color: colors.text }]}>Profile</Text>
          </View>
          <TouchableOpacity
            onPress={() => (isEditing ? handleSave() : setIsEditing(true))}
            style={[styles.editBtn, { backgroundColor: isEditing ? colors.primary : colors.surface }]}
          >
            <Text style={[styles.editBtnText, { color: isEditing ? '#fff' : colors.text }]}>
              {isEditing ? 'Save' : 'Edit'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={[styles.avatarContainer, { borderColor: colors.border }]}>
            <Image source={{ uri: image }} style={styles.avatar} />
            {isEditing && (
              <TouchableOpacity onPress={pickImage} style={[styles.cameraBtn, { backgroundColor: colors.primary }]}>
                <Feather name="camera" size={16} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
          {!isEditing && (
            <View style={styles.nameContainer}>
              <Text style={[styles.displayName, { color: colors.text }]}>{name}</Text>
              <Text style={[styles.displayEmail, { color: colors.textSecondary }]}>{email}</Text>
            </View>
          )}
        </View>

        {/* Info Fields */}
        <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Details</Text>
          
          <ProfileField
            label="Name"
            value={name}
            onChange={setName}
            editable={isEditing}
            colors={colors}
            icon="user"
          />
          <ProfileField
            label="Email"
            value={email}
            onChange={setEmail}
            editable={isEditing}
            colors={colors}
            icon="mail"
            keyboardType="email-address"
          />
          <ProfileField
            label="Bio"
            value={bio}
            onChange={setBio}
            editable={isEditing}
            colors={colors}
            icon="file-text"
            multiline
          />
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatCard label="Playlists" value="12" colors={colors} icon="list" />
          <StatCard label="Liked" value="148" colors={colors} icon="heart" />
          <StatCard label="Following" value="24" colors={colors} icon="users" />
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity
          onPress={handleSignOut}
          style={[styles.signOutBtn, { borderColor: colors.border }]}
        >
          <Feather name="log-out" size={20} color="#ef4444" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

function ProfileField({
  label,
  value,
  onChange,
  editable,
  colors,
  icon,
  keyboardType,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (text: string) => void;
  editable: boolean;
  colors: any;
  icon: React.ComponentProps<typeof Feather>['name'];
  keyboardType?: any;
  multiline?: boolean;
}) {
  return (
    <View style={[styles.fieldRow, { borderColor: colors.border }]}>
      <View style={styles.fieldLabelRow}>
        <Feather name={icon} size={16} color={colors.textSecondary} />
        <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{label}</Text>
      </View>
      {editable ? (
        <TextInput
          value={value}
          onChangeText={onChange}
          style={[
            styles.input,
            {
              color: colors.text,
              backgroundColor: colors.background,
              borderColor: colors.border,
              minHeight: multiline ? 80 : 40,
              textAlignVertical: multiline ? 'top' : 'center',
            },
          ]}
          keyboardType={keyboardType}
          multiline={multiline}
        />
      ) : (
        <Text style={[styles.fieldValue, { color: colors.text }]}>{value}</Text>
      )}
    </View>
  );
}

function StatCard({ label, value, colors, icon }: { label: string; value: string; colors: any; icon: any }) {
  return (
    <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Feather name={icon} size={20} color={colors.primary} style={{ marginBottom: spacing.xs }} />
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
  },
  editBtn: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: radii.round,
  },
  editBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  avatarSection: {
    alignItems: 'center',
    gap: spacing.md,
  },
  avatarContainer: {
    position: 'relative',
    padding: 4,
    borderWidth: 2,
    borderRadius: 999,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  cameraBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#fff',
  },
  nameContainer: {
    alignItems: 'center',
    gap: 4,
  },
  displayName: {
    fontSize: 24,
    fontWeight: '700',
  },
  displayEmail: {
    fontSize: 14,
  },
  card: {
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    gap: spacing.md,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  fieldRow: {
    gap: spacing.xs,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldValue: {
    fontSize: 16,
    fontWeight: '500',
    paddingVertical: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    gap: spacing.sm,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  signOutText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '700',
  },
});
