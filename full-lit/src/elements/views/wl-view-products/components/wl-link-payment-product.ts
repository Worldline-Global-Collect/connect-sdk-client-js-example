import type { BasicPaymentItem } from 'connect-sdk-client-js';

import { html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import {
  isBasicPaymentProduct,
  isBasicPaymentProductGroup,
} from 'connect-sdk-client-js';

import { TailwindElement } from '@/mixins';
import { getViewComponentPath, RouteViewComponentName } from '@/routes';

@customElement('wl-link-payment-product')
export class WlLinkPaymentProduct extends TailwindElement {
  @property({ type: Object }) data!: BasicPaymentItem;

  /**
   * Get label of payment product
   */
  private get _label() {
    return this.data.displayHints.label;
  }

  /**
   * Get path to payment details page
   */
  private get _href() {
    return getViewComponentPath(
      this.data.type === 'group'
        ? RouteViewComponentName.PaymentProductGroupDetail
        : RouteViewComponentName.PaymentProductDetail,
      { id: this.data.id.toString() },
    );
  }

  get isGooglePay() {
    return this.data.id === 320;
  }

  get isApplePay() {
    return this.data.id === 302;
  }

  /**
   * Only support cards to navigate to payment detail page
   */
  get supported() {
    const isPaymentProductCard =
      isBasicPaymentProduct(this.data) && this.data.paymentMethod === 'card';
    const isPaymentProductGroupCard =
      isBasicPaymentProductGroup(this.data) && this.data.id === 'cards';

    return isPaymentProductCard || isPaymentProductGroupCard;
  }

  render() {
    if (this.isApplePay) {
      return html`<wl-apple-pay .data=${this.data}>
        <img
          src="${this.data.displayHints.logo}?size=37x37"
          alt=${this._label}
        />
        ${this._label}
      </wl-apple-pay>`;
    }

    if (this.isGooglePay) {
      return html`<wl-google-pay .data=${this.data}>
        <img
          src="${this.data.displayHints.logo}?size=37x37"
          alt=${this._label}
        />
        ${this._label}
      </wl-google-pay>`;
    }

    if (!this.supported) {
      return html`
        <wl-dialog-info
          dialog-title="${this._label} not supported"
          size="small"
        >
          <button
            type="button"
            class="payment-product-link opacity-50 cursor-not-allowed"
            slot="summary"
          >
            <img
              src="${this.data.displayHints.logo}?size=37x37"
              alt=${this._label}
            />
            ${this._label}
          </button>
          <div class="flex flex-col gap-4">
            <p>
              The payment method <strong>${this._label}</strong> is not
              supported in this example.
            </p>
            <p>
              Currently, only <strong>card payments</strong> are implemented as
              an example.
            </p>
          </div>
        </wl-dialog-info>
      `;
    }

    return html`
      <wl-link
        href="${this._href}"
        class-anchor="payment-product-link"
        class="block"
      >
        <img
          src="${this.data.displayHints.logo}?size=37x37"
          alt=${this._label}
        />
        ${this._label}
      </wl-link>
    `;
  }
}
