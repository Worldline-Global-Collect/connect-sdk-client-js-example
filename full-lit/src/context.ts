import type { PaymentDetails, SessionDetails } from 'connect-sdk-client-js';

import { createContext } from '@lit/context';

export type Context = {
  sessionDetails: SessionDetails;
  paymentDetails: PaymentDetails;
  groupPaymentProducts: boolean;
  merchantId?: string;
  merchantName?: string;
  gatewayMerchantId?: string;
  googlePay?: boolean;
  applePay?: boolean;
};

export const context = createContext<Context | undefined>(Symbol('context'));
