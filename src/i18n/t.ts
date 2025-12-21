type TranslationKey =
  | 'payments.kpay.title'
  | 'payments.kpay.steps.openApp'
  | 'payments.kpay.steps.scan'
  | 'payments.kpay.steps.confirm'
  | 'payments.kpay.cta.openApp'
  | 'payments.checkout.title'
  | 'payments.checkout.amountLabel'
  | 'payments.checkout.amountPlaceholder'
  | 'payments.checkout.methodLabel'
  | 'payments.checkout.payCta'
  | 'payments.status.title'
  | 'payments.status.tryAgain'
  | 'payments.status.back'
  | 'payments.disabled'
  | 'common.cancel'
  | 'common.close'
  | 'common.loading'
  | 'common.error.generic';

const EN: Record<TranslationKey, string> = {
  'payments.kpay.title': 'Pay with KPay',
  'payments.kpay.steps.openApp': '1) Open KPay app',
  'payments.kpay.steps.scan': '2) Scan the QR or use the deep link',
  'payments.kpay.steps.confirm': '3) Confirm payment in KPay',
  'payments.kpay.cta.openApp': 'Open KPay',

  'payments.checkout.title': 'Checkout',
  'payments.checkout.amountLabel': 'Amount',
  'payments.checkout.amountPlaceholder': 'Enter amount (MMK)',
  'payments.checkout.methodLabel': 'Payment method',
  'payments.checkout.payCta': 'Pay with KPay',

  'payments.status.title': 'Payment status',
  'payments.status.tryAgain': 'Try again',
  'payments.status.back': 'Back',

  'payments.disabled': 'KPay is disabled. Enable EXPO_PUBLIC_KPAY_ENABLED to test.',

  'common.cancel': 'Cancel',
  'common.close': 'Close',
  'common.loading': 'Loading…',
  'common.error.generic': 'Something went wrong.',
};

export function t(key: TranslationKey): string {
  // TODO: wire to real i18n library and locale selection.
  return EN[key];
}
