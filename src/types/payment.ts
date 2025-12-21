export type PlanInterval = 'month' | 'year';

export interface Plan {
  id: string;
  productId: string; // Store specific ID (e.g., Stripe price ID, Apple product ID)
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: PlanInterval;
  features: string[];
  isPopular?: boolean;
}

export type SubscriptionStatus = 'active' | 'inactive' | 'past_due' | 'canceled' | 'trialing';

export interface UserSubscription {
  status: SubscriptionStatus;
  planId: string | null;
  expiresAt: string | null; // ISO date string
  autoRenew: boolean;
}

export interface PaymentResult {
  success: boolean;
  error?: string;
  transactionId?: string;
}
