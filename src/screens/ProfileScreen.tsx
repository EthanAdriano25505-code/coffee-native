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
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { getColors, spacing, radii } from '../theme/designTokens';
import { supabase } from '../utils/supabase';

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = getColors(isDark);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [image, setImage] = useState('https://via.placeholder.com/150');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getProfile();
  }, []);

  const getProfile = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        setEmail(user.email || '');
        
        const { data, error, status } = await supabase
          .from('profiles')
          .select(`username, website, avatar_url, full_name`)
          .eq('id', user.id)
          .single();

        if (error && status !== 406) {
          throw error;
        }

        if (data) {
          setName(data.full_name || data.username || '');
          setBio(data.website || ''); // Using website field for bio for now
          if (data.avatar_url) setImage(data.avatar_url);
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert('Error', error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) throw new Error('No user on the session!');

      const updates = {
        id: user.id,
        full_name: name,
        website: bio, // Mapping bio to website field for now
        avatar_url: image,
        updated_at: new Date(),
      };

      const { error } = await supabase.from('profiles').upsert(updates);

      if (error) {
        throw error;
      }
      
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert('Error', error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  function handleSignOut(): void {
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
              Alert.alert('Signed out', 'You have been signed out.');
            } catch (err) {
              if (err instanceof Error) {
                Alert.alert('Error', err.message);
              }
            }
          },
        },
      ],
      { cancelable: true }
    );
  }

  async function pickImage(_: any): Promise<void> {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Permission to access photos is required.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
      });

      // Newer expo returns { canceled, assets }, older returns { cancelled, uri }
      if ((result as any).canceled || (result as any).cancelled) return;

      const uri =
        // @ts-ignore
        (result as any).uri ?? (result as any).assets?.[0]?.uri;
      if (!uri) return;

      // Optimistically show selected image
      setImage(uri);

      // Upload to Supabase storage (avatars bucket)
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const response = await fetch(uri);
      const blob = await response.blob();

      const ext = uri.split('.').pop()?.split(/\#|\?/)[0] ?? 'jpg';
      const fileName = `${user.id}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, blob, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage.from('avatars').getPublicUrl(fileName);
      if (publicData?.publicUrl) {
        setImage(publicData.publicUrl);
      }
    } catch (error) {
      if (error instanceof Error) Alert.alert('Error', error.message);
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {/* Back-aware header: shows back arrow when appropriate */}
            <TouchableOpacity
              onPress={() => { if (navigation?.canGoBack && navigation.canGoBack()) navigation.goBack(); else navigation?.navigate?.('Home'); }}
              style={{ padding: 6, marginRight: 8 }}
            >
              <Feather name="chevron-left" size={22} color={colors.text} />
            </TouchableOpacity>
            <Feather name="user" size={22} color={colors.text} />
            <Text style={[styles.title, { color: colors.text }]}>Profile</Text>
          </View>
          <TouchableOpacity
            onPress={() => (isEditing ? handleSave() : setIsEditing(true))}
            style={[styles.editBtn, { backgroundColor: isEditing ? colors.primary : colors.surface }]}
          >
            <Text style={[styles.editBtnText, { color: isEditing ? '#fff' : colors.text }]}>\
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
