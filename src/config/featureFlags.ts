export const KPAY_ENABLED =
  (process.env.EXPO_PUBLIC_KPAY_ENABLED ?? 'false').toLowerCase() === 'true';

export const PAYMENT_TESTMODE =
  (process.env.EXPO_PUBLIC_PAYMENT_TESTMODE ?? 'true').toLowerCase() === 'true';

export type SupportedCurrencyCode = 'MMK';

const currencyFromEnv = process.env.EXPO_PUBLIC_PAYMENT_CURRENCY;

// NOTE: For now we only support MMK in this app. If more currencies are added,
// extend SupportedCurrencyCode and validate here.
export const PAYMENT_CURRENCY: SupportedCurrencyCode = currencyFromEnv === 'MMK' ? 'MMK' : 'MMK';

export const KPAY_SERVER_BASE_URL =
  process.env.EXPO_PUBLIC_KPAY_SERVER_BASE_URL ?? 'http://localhost:3000';
