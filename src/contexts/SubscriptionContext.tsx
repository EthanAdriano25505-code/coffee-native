import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { paymentService } from '../services/PaymentService';
import { Plan, UserSubscription } from '../types/payment';
import { Alert } from 'react-native';

interface SubscriptionContextType {
  isPremium: boolean;
  subscription: UserSubscription | null;
  isLoading: boolean;
  plans: Plan[];
  purchasePlan: (plan: Plan) => Promise<boolean>;
  restorePurchases: () => Promise<void>;
  refreshStatus: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider = ({ children }: { children: ReactNode }) => {
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Derived state
  const isPremium = subscription?.status === 'active' || subscription?.status === 'trialing';

  useEffect(() => {
    initialize();
  }, []);

  const initialize = async () => {
    try {
      setIsLoading(true);
      await paymentService.initialize();
      const [fetchedPlans, status] = await Promise.all([
        paymentService.getPlans(),
        paymentService.getSubscriptionStatus()
      ]);
      setPlans(fetchedPlans);
      setSubscription(status);
    } catch (error) {
      console.error('Failed to initialize subscription context:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const purchasePlan = async (plan: Plan): Promise<boolean> => {
    try {
      setIsLoading(true);
      const result = await paymentService.purchasePlan(plan.id);
      
      if (result.success) {
        // Optimistically update state for immediate UI feedback
        setSubscription({
          status: 'active',
          planId: plan.id,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // +30 days
          autoRenew: true,
        });
        Alert.alert('Success', 'Welcome to Premium!');
        return true;
      } else {
        Alert.alert('Error', result.error || 'Purchase failed');
        return false;
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const restorePurchases = async () => {
    try {
      setIsLoading(true);
      const result = await paymentService.restorePurchases();
      if (result.success) {
        Alert.alert('Success', 'Purchases restored');
        // In a real app, we would re-fetch the status here
        await refreshStatus();
      } else {
        Alert.alert('Notice', 'No purchases found to restore');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to restore purchases');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshStatus = async () => {
    const status = await paymentService.getSubscriptionStatus();
    setSubscription(status);
  };

  return (
    <SubscriptionContext.Provider
      value={{
        isPremium,
        subscription,
        isLoading,
        plans,
        purchasePlan,
        restorePurchases,
        refreshStatus,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};
