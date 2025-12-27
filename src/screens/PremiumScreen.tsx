import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSubscription } from '../contexts/SubscriptionContext';
import { getColors, spacing, radii } from '../theme/designTokens';
import { Plan } from '../types/payment';

const { width } = Dimensions.get('window');

export default function PremiumScreen() {
  const navigation = useNavigation();
  const { plans, isLoading, purchasePlan, isPremium, restorePurchases } = useSubscription();
  const colors = getColors(true); // Force dark mode colors for premium feel

  const handlePurchase = async (plan: Plan) => {
    const success = await purchasePlan(plan);
    if (success) {
      navigation.goBack();
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2F80ED" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Background */}
      <LinearGradient
        colors={['#0f172a', '#1e1b4b', '#000000']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
              <Feather name="x" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={restorePurchases}>
              <Text style={styles.restoreText}>Restore</Text>
            </TouchableOpacity>
          </View>

          {/* Hero Section */}
          <View style={styles.hero}>
            <View style={styles.iconContainer}>
              <Ionicons name="diamond" size={48} color="#2F80ED" />
            </View>
            <Text style={styles.title}>Go Premium</Text>
            <Text style={styles.subtitle}>
              Unlock the full experience with high quality audio, offline listening, and no ads.
            </Text>
          </View>

          {/* Features List */}
          <View style={styles.featuresContainer}>
            <FeatureItem icon="musical-notes" text="High Quality Audio" />
            <FeatureItem icon="cloud-download" text="Offline Downloads" />
            <FeatureItem icon="ban" text="Ad-free Experience" />
            <FeatureItem icon="infinite" text="Unlimited Skips" />
          </View>

          {/* Plans */}
          <View style={styles.plansContainer}>
            {plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                onPress={() => handlePurchase(plan)}
                isPopular={plan.isPopular}
              />
            ))}
          </View>

          <Text style={styles.disclaimer}>
            Recurring billing, cancel anytime. By subscribing, you agree to our Terms of Service and Privacy Policy.
          </Text>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function FeatureItem({ icon, text }: { icon: any; text: string }) {
  return (
    <View style={styles.featureItem}>
      <View style={styles.featureIconBg}>
        <Ionicons name={icon} size={20} color="#2F80ED" />
      </View>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

function PlanCard({ plan, onPress, isPopular }: { plan: Plan; onPress: () => void; isPopular?: boolean }) {
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={[styles.planCard, isPopular && styles.popularPlanCard]}>
      {isPopular && (
        <View style={styles.popularBadge}>
          <Text style={styles.popularText}>BEST VALUE</Text>
        </View>
      )}
      <BlurView intensity={20} tint="dark" style={styles.planBlur}>
        <View style={styles.planContent}>
          <View>
            <Text style={styles.planName}>{plan.name}</Text>
            <Text style={styles.planPrice}>
              {plan.currency === 'USD' ? '$' : plan.currency}{plan.price}
              <Text style={styles.planInterval}>/{plan.interval}</Text>
            </Text>
            <Text style={styles.planDesc}>{plan.description}</Text>
          </View>
          <View style={styles.selectButton}>
            <Text style={styles.selectButtonText}>Select</Text>
          </View>
        </View>
      </BlurView>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  closeButton: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
  },
  restoreText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    fontWeight: '600',
  },
  hero: {
    alignItems: 'center',
    paddingHorizontal: 30,
    marginTop: 20,
    marginBottom: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(47, 128, 237, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(47, 128, 237, 0.3)',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 24,
  },
  featuresContainer: {
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 16,
    borderRadius: 16,
  },
  featureIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(47, 128, 237, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  plansContainer: {
    paddingHorizontal: 20,
    gap: 16,
    marginBottom: 20,
  },
  planCard: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  popularPlanCard: {
    borderColor: '#2F80ED',
    borderWidth: 2,
    transform: [{ scale: 1.02 }],
  },
  planBlur: {
    padding: 20,
  },
  planContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  planPrice: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  planInterval: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '600',
  },
  planDesc: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
  },
  selectButton: {
    backgroundColor: '#2F80ED',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  selectButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  popularBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#2F80ED',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderBottomLeftRadius: 12,
    zIndex: 10,
  },
  popularText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  disclaimer: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    paddingHorizontal: 40,
    marginTop: 10,
  },
});
