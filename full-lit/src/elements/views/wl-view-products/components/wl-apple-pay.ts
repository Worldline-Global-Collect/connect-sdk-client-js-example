import type {
  BasicPaymentItem,
  PaymentProduct,
  PaymentProductSpecificInputs,
} from 'connect-sdk-client-js';

import { html, nothing } from 'lit';
import { Task, TaskStatus } from '@lit/task';
import { when } from 'lit/directives/when.js';
import {
  customElement,
  property,
  queryAssignedElements,
} from 'lit/decorators.js';
import { twMerge } from 'tailwind-merge';
import { ApplePayError, ApplePayErrorStatus } from 'connect-sdk-client-js';

import { TailwindElement } from '@/mixins';
import { SessionController } from '@/controllers';
import { buttonDisabledClass } from '@/elements';
import { RouteViewComponentName } from '@/routes';

@customElement('wl-apple-pay')
export class WlApplePay extends TailwindElement {
  protected sessionController = new SessionController(this);

  @property({ type: Object }) data!: BasicPaymentItem;

  @queryAssignedElements({ slot: '', flatten: true, selector: 'img' })
  images!: HTMLImageElement[];

  #initApplePayTask = new Task(this, {
    autoRun: false,
    onError: console.error,
    task: async () => {
      const session = this.sessionController.session!;
      const paymentDetails = this.sessionController.paymentDetails!;
      const paymentProductSpecificInputs = this.sessionController
        .paymentProductSpecificInputs as Required<
        Pick<PaymentProductSpecificInputs, 'applePay'>
      >;

      const paymentProduct = await session.getPaymentProduct(
        this.data.id as PaymentProduct['id'],
        paymentDetails,
        paymentProductSpecificInputs,
      );

      this.sessionController.setPaymentProduct(paymentProduct);
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
      const session = this.sessionController.session!;
      const paymentProduct = session.getPaymentRequest().getPaymentProduct()!;
      const { networks: supportedNetworks } =
        paymentProduct.paymentProduct302SpecificData!;

      const { applePay } = this.sessionController
        .paymentProductSpecificInputs as Required<
        Pick<PaymentProductSpecificInputs, 'applePay'>
      >;

      const result = await session.createApplePayPayment(
        this.sessionController.paymentDetails!,
        { ...applePay, acquirerCountry: paymentProduct.acquirerCountry },
        supportedNetworks,
      );

      return this.sessionController.encryptPaymentRequest({
        encryptedPaymentData: JSON.stringify(result.data.paymentData),
      });
    },
  });

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

  private get readyToPay() {
    return this.#initApplePayTask.status === TaskStatus.COMPLETE;
  }

  private get isDisabled() {
    return !this.readyToPay || this.isLoading;
  }

  private get isLoading() {
    return (
      this.#initApplePayTask.status === TaskStatus.PENDING ||
      this.#processPaymentTask.status === TaskStatus.PENDING
    );
  }

  connectedCallback() {
    super.connectedCallback();
    this.#initApplePayTask.run().catch(console.error);
  }

  #onClick() {
    this.#processPaymentTask.run().catch(console.error);
  }

  render() {
    this.#updateProductImage();

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
        error: (error) => {
          const isCancelled =
            error instanceof ApplePayError &&
            error.status === ApplePayErrorStatus.Cancelled;

          return isCancelled
            ? nothing
            : html`<wl-dialog-info dialog-title="Apple Pay error" open=${true}>
                <div class="text-red-500">${error}</div>
              </wl-dialog-info>`;
        },
      })}
    `;
  }
}
