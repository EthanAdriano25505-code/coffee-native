import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { spacing, radii, sizes } from '../theme/designTokens';
import { StatusBar } from 'expo-status-bar';
import AppBackground from '../components/AppBackground';

const { width, height } = Dimensions.get('window');

type WelcomeScreenProp = NativeStackNavigationProp<RootStackParamList, 'Welcome'>;

export default function WelcomeScreen() {
  const navigation = useNavigation<WelcomeScreenProp>();

  return (
    <AppBackground>
      <StatusBar style="light" />

      {/* Decorative blurred orbs for "Glass" feel */}
      <View style={[styles.orb, { top: -100, left: -50, backgroundColor: '#2F80ED', opacity: 0.2 }]} />
      <View style={[styles.orb, { bottom: 100, right: -50, backgroundColor: '#b21f1f', opacity: 0.15 }]} />

      <View style={styles.content}>
        <View style={styles.header}>
          {/* Placeholder for Logo */}
          <View style={styles.logoPlaceholder}>
            <Text style={styles.logoText}>S</Text>
          </View>
          <Text style={styles.title}>Ta'ang Music App</Text>
          <Text style={styles.subtitle}>မင်္ဂလာပါ</Text>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.button, styles.buttonPrimary]}
            onPress={() => navigation.navigate('SignUp')}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonTextPrimary}>Sign Up</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.buttonSecondary]}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonTextSecondary}>Log In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  orb: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    // filter: 'blur(50px)', // Removed invalid property
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    padding: spacing.xl,
    paddingTop: height * 0.15,
    paddingBottom: height * 0.1,
  },
  header: {
    alignItems: 'center',
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#2F80ED',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    shadowColor: '#2F80ED',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  logoText: {
    fontSize: 40,
    fontWeight: '800',
    color: '#fff',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#9AA7BF',
    textAlign: 'center',
    maxWidth: '80%',
  },
  footer: {
    gap: spacing.md,
  },
  button: {
    height: 56,
    borderRadius: 28, // Pill shape
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimary: {
    backgroundColor: '#2F80ED', // App Primary Blue
    shadowColor: '#2F80ED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonSecondary: {
    backgroundColor: '#1E293B', // Dark Surface
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  buttonTextPrimary: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  buttonTextSecondary: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
