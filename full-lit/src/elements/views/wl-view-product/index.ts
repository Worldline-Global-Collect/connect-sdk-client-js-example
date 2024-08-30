import type { RouterLocation } from '@vaadin/router';
import type { PaymentProduct, AccountOnFile } from 'connect-sdk-client-js';

import { css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { Task } from '@lit/task';

import { WlViewMixin, TailwindElement } from '@/mixins';
import './components';

@customElement('wl-view-product')
export class WlViewProduct extends WlViewMixin(TailwindElement) {
  @property({ type: Number }) productId?: PaymentProduct['id'];
  @property({ type: Number }) accountOnFileId?: AccountOnFile['id'];
  @state() private _accountOnFile?: AccountOnFile;

  static styles = [
    ...TailwindElement.styles,
    css`
      @media (min-width: 640px) {
        [field-id='cardNumber'],
        [field-id='cardholderName'] {
          grid-column: span 2;
        }
      }
    `,
  ];

  #loadPaymentProductTask = new Task<[], PaymentProduct>(this, {
    autoRun: false,
    onError: console.error,
    onComplete: (paymentProduct) => {
      this.sessionController.setPaymentProduct(paymentProduct);
      this._accountOnFile =
        this.accountOnFileId !== undefined
          ? paymentProduct.getAccountOnFile(this.accountOnFileId)
          : undefined;
    },
    task: async () => {
      const { session, paymentDetails, paymentProductSpecificInputs } =
        this.sessionController;
      if (!session) throw new Error('No session found');
      if (!this.productId) throw new Error('No product id found');

      return session.getPaymentProduct(
        this.productId,
        paymentDetails,
        paymentProductSpecificInputs,
      );
    },
  });

  onBeforeEnter(location: RouterLocation) {
    const productId = location.params.id as string | undefined;
    const search = new URLSearchParams(location.search);
    if (productId) {
      this.productId = parseInt(productId, 10);
    }
    if (search.has('aof')) {
      this.accountOnFileId = parseInt(search.get('aof')!, 10);
    }
  }

  afterContextProviderReady() {
    this.#loadPaymentProductTask.run().catch(console.error);
  }

  render() {
    return html`<div>
      ${this.#loadPaymentProductTask.render({
        error: () =>
          html`<wl-alert severity="error" class="md:max-w-80 mx-auto">
            There was a problem while getting the payment items; please check
            your credentials and payment context
            <wl-link class-anchor="underline text-black" href="/">here</wl-link>
          </wl-alert>`,
        pending: () =>
          html`<wl-loading-spinner> Fetching data... </wl-loading-spinner>`,
        complete: (paymentProduct) => {
          const { paymentProductFields, allowsTokenization, autoTokenized } =
            paymentProduct;

          return html`
            <wl-form-payment
              ?auto-tokenized=${autoTokenized}
              ?allows-tokenization=${allowsTokenization}
              .paymentProductFields=${paymentProductFields}
              .accountOnFile=${this._accountOnFile}
            ></wl-form-payment>
          `;
        },
      })}
    </div>`;
  }
}
