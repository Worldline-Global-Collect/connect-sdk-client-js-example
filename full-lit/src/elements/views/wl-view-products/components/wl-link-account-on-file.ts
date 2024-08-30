import type { AccountOnFile } from 'connect-sdk-client-js';

import { customElement, property } from 'lit/decorators.js';
import { html } from 'lit';

import { TailwindElement } from '@/mixins';

@customElement('wl-link-account-on-file')
export class WlLinkAccountOnFile extends TailwindElement {
  @property({ type: Object }) data!: AccountOnFile;

  private get _label() {
    return this.data.getMaskedValueByAttributeKey('alias')?.formattedValue;
  }

  private get _href() {
    return `/products/product/${this.data.paymentProductId}?aof=${this.data.id}`;
  }

  render() {
    return html`
      <wl-link
        href="${this._href}"
        class-anchor="payment-product-link"
        class="block"
      >
        <img
          src="${this.data.displayHints.logo}?size=37x37"
          alt="${this._label}"
        />
        ${this._label}
      </wl-link>
    `;
  }
}
