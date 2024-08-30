import type { ReactiveController, ReactiveControllerHost } from 'lit';
import type { Context } from '@/context';
import type {
  PaymentProductSpecificInputs,
  SessionDetails,
  PaymentProduct,
} from 'connect-sdk-client-js';

import { context } from '@/context';
import { ContextConsumer } from '@lit/context';
import { Session } from 'connect-sdk-client-js';

import { RouteViewComponentName } from '@/routes';

type Host = ReactiveControllerHost & HTMLElement;

/**
 * Session Reactive Controller
 *
 * @see https://lit.dev/docs/composition/controllers/
 * @description The session controller allows the consumer to access the session and context.
 */
export class SessionController {
  host: Host;

  private static _session: Session;
  private static _paymentProduct: PaymentProduct;
  private static _sessionDetails?: SessionDetails;
  private static _context?: Context;
  private static _paymentProductUpdateListeners: Array<
    (paymentProduct: PaymentProduct) => void
  > = [];

  get context(): Context | undefined {
    return SessionController._context;
  }

  get session(): Session | undefined {
    if (SessionController._session) return SessionController._session;
    if (!SessionController._sessionDetails) {
      throw new Error('Session details are required to initialize a session');
    }
    SessionController._session = new Session(SessionController._sessionDetails);
    return SessionController._session;
  }

  get paymentDetails() {
    return this.context?.paymentDetails;
  }

  get paymentProductSpecificInputs(): PaymentProductSpecificInputs {
    const paymentSpecificInputs: PaymentProductSpecificInputs = {};
    if (!this.context) return paymentSpecificInputs;

    if (this.context.googlePay) {
      paymentSpecificInputs.googlePay = {
        merchantId: this.context.merchantId!,
        gatewayMerchantId: this.context.gatewayMerchantId!,
        merchantName: this.context.merchantName,
      };
    }

    if (this.context.applePay) {
      paymentSpecificInputs.applePay = {
        merchantName: this.context.merchantName!,
      };
    }

    return paymentSpecificInputs;
  }

  get groupPaymentProducts() {
    return this.context?.groupPaymentProducts;
  }

  /**
   * Clear data from context (session) and session storage
   * and redirect to the view details form
   */
  clearSession() {
    sessionStorage.removeItem('context');
    const eventOptions = { bubbles: true, composed: true };

    if (this.context) {
      this.host.dispatchEvent(
        new CustomEvent('context', {
          ...eventOptions,
          detail: {
            ...this.context,
            sessionDetails: {
              ...this.context.sessionDetails,
              clientSessionId: undefined,
              customerId: undefined,
            },
          },
        }),
      );
    }

    this.host.dispatchEvent(
      new CustomEvent('view-update', {
        ...eventOptions,
        detail: { view: RouteViewComponentName.Details },
      }),
    );
  }

  setPaymentProduct(paymentProduct: PaymentProduct) {
    if (SessionController._paymentProduct !== paymentProduct) {
      this.session?.getPaymentRequest().setPaymentProduct(paymentProduct);
      SessionController._paymentProductUpdateListeners.forEach((_fn) =>
        _fn(paymentProduct),
      );
    }
    SessionController._paymentProduct = paymentProduct;
  }

  /**
   * Subscribe to payment product update
   *
   * @param fn - Function called with the updated payment product
   * @returns unsubscribe function
   */
  subscribeToPaymentProductUpdate(
    fn: (paymentProduct: PaymentProduct) => void,
  ) {
    const listeners = SessionController._paymentProductUpdateListeners;
    listeners.push(fn);
    return () => {
      SessionController._paymentProductUpdateListeners = listeners.filter(
        (_fn) => _fn !== fn,
      );
    };
  }

  /**
   * Add data to payment request and encrypt the payment request
   *
   * @param data - Payment data which will be added to the PaymentRequest
   * @param remember - Remember the payment data
   * @returns Encrypted payment request
   */
  encryptPaymentRequest(
    data: Record<string, string>,
    remember: boolean = false,
  ) {
    if (!this.session) {
      throw new Error('Session is required to encrypt payment data');
    }

    const paymentRequest = this.session.getPaymentRequest();
    paymentRequest.setTokenize(remember);
    Object.entries(data).forEach(([key, value]) => {
      paymentRequest.setValue(key, value);
    });

    return this.session.getEncryptor().encrypt(paymentRequest);
  }

  constructor(host: Host) {
    this.host = host;
    this.host.addController(this as ReactiveController);

    const cachedContextJson = sessionStorage.getItem('context');
    if (!this.context && cachedContextJson) {
      const cachedContext = JSON.parse(cachedContextJson) as Context;
      SessionController._context = cachedContext;
      SessionController._sessionDetails = cachedContext.sessionDetails;
    }

    // subscribe to context updates to set context session
    new ContextConsumer(this.host, {
      context,
      subscribe: true,
      callback: (value) => {
        if (!value) return;

        const hasChanged =
          JSON.stringify(value) !== JSON.stringify(SessionController._context);

        if (hasChanged) {
          SessionController._context = value;
          SessionController._sessionDetails = value.sessionDetails;
          SessionController._session = new Session(value.sessionDetails);
        }
      },
    });
  }
}
