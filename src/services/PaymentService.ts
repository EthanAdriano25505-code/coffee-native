import { Plan, PaymentResult, UserSubscription } from '../types/payment';

// Mock data for development
const MOCK_PLANS: Plan[] = [
  {
    id: 'premium_monthly',
    productId: 'prod_monthly_123',
    name: 'Premium Monthly',
    description: 'Unlock all features',
    price: 30000,
    currency: 'MMK',
    interval: 'month',
    features: ['Ad-free listening', 'High quality audio', 'Offline downloads', 'Unlimited skips'],
    isPopular: false,
  },
  {
    id: 'premium_yearly',
    productId: 'prod_yearly_123',
    name: 'Premium Yearly',
    description: 'Best value',
    price: 990000,
    currency: 'MMK',
    interval: 'year',
    features: ['Ad-free listening', 'High quality audio', 'Offline downloads', 'Unlimited skips', '2 months free'],
    isPopular: true,
  },
];

class PaymentService {
  private static instance: PaymentService;
  private isMockMode: boolean = true; // Toggle this when real integration is ready

  private constructor() {}

  public static getInstance(): PaymentService {
    if (!PaymentService.instance) {
      PaymentService.instance = new PaymentService();
    }
    return PaymentService.instance;
  }

  /**
   * Initialize the payment provider (e.g., Stripe, RevenueCat)
   */
  public async initialize(): Promise<void> {
    console.log('PaymentService initialized');
    // TODO: Initialize real payment SDK here
  }

  /**
   * Fetch available subscription plans
   */
  public async getPlans(): Promise<Plan[]> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));
    return MOCK_PLANS;
  }

  /**
   * Purchase a specific plan
   */
  public async purchasePlan(planId: string): Promise<PaymentResult> {
    console.log(`Attempting to purchase plan: ${planId}`);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    if (this.isMockMode) {
      const planExists = MOCK_PLANS.some(p => p.id === planId);
      if (!planExists) {
        return {
          success: false,
          error: `Plan with id ${planId} not found.`,
        };
      }
      // Simulate success
      return {
        success: true,
        transactionId: `mock_tx_${Date.now()}`,
      };
    }

    // TODO: Implement real purchase logic
    return { success: false, error: 'Payment provider not configured' };
  }

  /**
   * Restore previous purchases (e.g., for reinstall)
   */
  public async restorePurchases(): Promise<PaymentResult> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { success: true };
  }

  /**
   * Get current user's subscription status
   * In a real app, this would check against your backend or the payment provider
   */
  public async getSubscriptionStatus(): Promise<UserSubscription> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock: Return inactive by default, or check local storage/global state
    return {
      status: 'inactive',
      planId: null,
      expiresAt: null,
      autoRenew: false,
    };
  }
}

export const paymentService = PaymentService.getInstance();
