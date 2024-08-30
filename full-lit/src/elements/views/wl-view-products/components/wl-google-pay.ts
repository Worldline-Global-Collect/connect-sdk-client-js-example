import type {
  BasicPaymentItem,
  PaymentProductSpecificInputs,
  PaymentProduct,
} from 'connect-sdk-client-js';

import { html } from 'lit';
import { Task, TaskStatus } from '@lit/task';
import { twMerge } from 'tailwind-merge';
import { when } from 'lit/directives/when.js';
import {
  customElement,
  property,
  queryAssignedElements,
  state,
} from 'lit/decorators.js';

import { TailwindElement } from '@/mixins';
import { SessionController } from '@/controllers';
import { buttonDisabledClass } from '@/elements';
import { RouteViewComponentName } from '@/routes';

const baseRequest = { apiVersion: 2, apiVersionMinor: 0 };
const allowedAuthMethods: google.payments.api.CardAuthMethod[] = [
  'PAN_ONLY',
  'CRYPTOGRAM_3DS',
];

@customElement('wl-google-pay')
export class WlGooglePay extends TailwindElement {
  protected sessionController = new SessionController(this);

  @property({ type: Object }) data!: BasicPaymentItem;

  @state() private _paymentClient?: google.payments.api.PaymentsClient;

  @state()
  private _tokenizationSpecification?: google.payments.api.PaymentMethodTokenizationSpecification;

  @state()
  private _baseCardPaymentMethod?: google.payments.api.IsReadyToPayPaymentMethodSpecification;

  @state()
  private _transactionInfo?: google.payments.api.TransactionInfo;

  @queryAssignedElements({ slot: '', flatten: true, selector: 'img' })
  images!: HTMLImageElement[];

  #initGooglePayTask = new Task(this, {
    autoRun: false,
    onError: console.error,
    task: async () => {
      const session = this.sessionController.session!;
      const paymentDetails = this.sessionController.paymentDetails!;
      const paymentProductSpecificInputs = this.sessionController
        .paymentProductSpecificInputs as Required<
        Pick<PaymentProductSpecificInputs, 'googlePay'>
      >;

      const paymentProduct = await session.getPaymentProduct(
        this.data.id as PaymentProduct['id'],
        paymentDetails,
        paymentProductSpecificInputs,
      );

      if (!paymentProduct.paymentProduct320SpecificData) {
        throw new Error('No payment product 320 specific data found');
      }

      this.sessionController.setPaymentProduct(paymentProduct);

      this._tokenizationSpecification = {
        type: 'PAYMENT_GATEWAY',
        parameters: {
          gateway: paymentProduct.paymentProduct320SpecificData.gateway,
          gatewayMerchantId:
            paymentProductSpecificInputs.googlePay.gatewayMerchantId,
        },
      };

      const allowedCardNetworks = paymentProduct.paymentProduct320SpecificData
        .networks as google.payments.api.CardNetwork[];

      this._baseCardPaymentMethod = {
        type: 'CARD',
        parameters: { allowedAuthMethods, allowedCardNetworks },
      };

      this._transactionInfo = {
        currencyCode: paymentDetails.currency,
        totalPriceStatus: 'FINAL',

        // @note:
        // In this example we divided the `totalAmount` by 100.
        // The `totalAmount` is the smallest possible denominator, which is cents for EUR.
        //
        // Google Pay `totalPrice` uses a different format:
        // "Total monetary value of the transaction with an optional decimal precision of two decimal places"
        //
        // The user will have to convert this manually, when the smallest possible
        // denominator is not the value divided by 100 (for example, JPY).
        totalPrice: (paymentDetails.totalAmount / 100).toString(),
        countryCode: paymentProduct.acquirerCountry,
      };

      return this._paymentClient!.isReadyToPay({
        ...baseRequest,
        allowedPaymentMethods: [this._baseCardPaymentMethod],
      });
    },
  });

  #processPaymentTask = new Task(this, {
    autoRun: false,
    onError: console.error,
    onComplete: (payload) => {
      this.dispatchEvent(
        new CustomEvent('view-update', {
          bubbles: true,
          composed: true,
          detail: {
            view: RouteViewComponentName.EncryptedPayload,
            params: { payload },
          },
        }),
      );
    },
    task: async () => {
      const context = this.sessionController.context!;
      const merchantInfo = {
        merchantId: context.merchantId!,
        merchantName: context.merchantName!,
      };

      const allowedPaymentMethod = {
        ...this._baseCardPaymentMethod!,
        tokenizationSpecification: this._tokenizationSpecification!,
      };

      const paymentData = await this._paymentClient!.loadPaymentData({
        ...baseRequest,
        allowedPaymentMethods: [allowedPaymentMethod],
        transactionInfo: this._transactionInfo!,
        merchantInfo,
      });

      const encryptedPaymentData =
        paymentData.paymentMethodData.tokenizationData.token;

      return this.sessionController.encryptPaymentRequest({
        encryptedPaymentData,
      });
    },
  });

  private get readyToPay() {
    return !!(
      this.#initGooglePayTask.status === TaskStatus.COMPLETE &&
      this.#initGooglePayTask.value?.result
    );
  }

  private get isDisabled() {
    return !this.readyToPay || this.isLoading;
  }

  private get isLoading() {
    return (
      this.#initGooglePayTask.status === TaskStatus.PENDING ||
      this.#processPaymentTask.status === TaskStatus.PENDING
    );
  }

  /**
   * Update the transparency of the image within the slot
   * when the `isDisabled` state changes.
   */
  #updateProductImage() {
    const image = this.images[0];
    if (!image) return;

    if (this.isDisabled) {
      image.classList.add('opacity-40');
    } else {
      image.classList.remove('opacity-40');
    }
  }

  connectedCallback() {
    super.connectedCallback();
    this._paymentClient = new google.payments.api.PaymentsClient({
      environment: 'TEST',
    });
    this.#initGooglePayTask.run().catch(console.error);
  }

  #onClick() {
    this.#processPaymentTask.run().catch(console.error);
  }

  /**
   * Get the error message from an unknown error.
   * @see https://developers.google.com/pay/api/web/reference/error-objects
   */
  #getErrorMessage(error: unknown) {
    if (error instanceof Error) return error.message;
    if (typeof error === 'string') return error;
    if (typeof error !== 'object' || !error) return 'Unknown error';
    if ('statusMessage' in error) return error.statusMessage;
    if ('statusCode' in error) return error.statusCode;
  }

  render() {
    this.#updateProductImage();

    if (!this.readyToPay) {
      return html`<wl-dialog-info dialog-title="Google Pay not supported">
        <button
          type="button"
          class="payment-product-link opacity-50 cursor-not-allowed"
          slot="summary"
        >
          <slot></slot>
        </button>
        <p>
          Google Pay is supported for this merchant, but the
          <span class="whitespace-nowrap font-semibold">"ready to pay"</span>
          check failed, unfortunately.
        </p>
      </wl-dialog-info>`;
    }

    return html`
      <button
        type="button"
        @click=${this.#onClick}
        ?disabled=${this.isDisabled}
        class="payment-product-link ${when(this.isLoading, () =>
          twMerge(buttonDisabledClass, 'border-0'),
        )}"
      >
        ${when(
          this.isLoading,
          () => html`<wl-loading-spinner size="xs"></wl-loading-spinner>`,
        )}
        <slot></slot>
      </button>
      ${this.#processPaymentTask.render({
        error: (error) =>
          html`<wl-dialog-info dialog-title="Google Pay error" open=${true}>
            <div class="text-red-500">${this.#getErrorMessage(error)}</div>
          </wl-dialog-info>`,
      })}
    `;
  }
}
