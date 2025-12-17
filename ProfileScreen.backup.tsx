import React from 'react';
import { View, Text, ScrollView, Image, TextInput, Switch, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import createStyles from './src/styles/ProfileScreenStyles';
import { useTheme } from './src/contexts/ThemeContext';
import { getColors } from './src/theme/designTokens';

const ProfileScreen = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  const colors = getColors(isDarkMode);
  const styles = createStyles(colors);

  const [name, setName] = React.useState('John Doe');
  const [email, setEmail] = React.useState('john.doe@example.com');
  const [bio, setBio] = React.useState('React Native developer and coffee enthusiast.');
  const [image, setImage] = React.useState('https://via.placeholder.com/150');

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.profileHeader}>
          <Image
            style={styles.profileImage}
            source={{ uri: image }}
          />
          <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
            <Text style={styles.imagePickerText}>Change Picture</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter your name"
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email"
            keyboardType="email-address"
          />

          <Text style={styles.label}>Bio</Text>
          <TextInput
            style={[styles.input, styles.bioInput]}
            value={bio}
            onChangeText={setBio}
            placeholder="Tell us about yourself"
            multiline
          />
        </View>

        <View style={styles.statsSection}>
            <Text style={styles.statText}>Playlists: 12</Text>
            <Text style={styles.statText}>Liked Songs: 150</Text>
        </View>

        <View style={styles.settingsSection}>
            <TouchableOpacity style={styles.button}>
                <Text style={styles.buttonText}>Change Password</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button}>
                <Text style={styles.buttonText}>Privacy Settings</Text>
            </TouchableOpacity>
            <View style={styles.darkModeContainer}>
                <Text style={styles.darkModeText}>Dark Mode</Text>
                <Switch
                    trackColor={{ false: '#767577', true: '#81b0ff' }}
                    thumbColor={isDarkMode ? '#f5dd4b' : '#f4f3f4'}
                    onValueChange={toggleTheme}
                    value={isDarkMode}
                />
            </View>
             <TouchableOpacity style={[styles.button, styles.logoutButton]}>
                <Text style={styles.buttonText}>Logout</Text>
            </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileScreen;
