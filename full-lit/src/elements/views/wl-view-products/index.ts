import type { AccountOnFile, BasicPaymentItem } from 'connect-sdk-client-js';

import { html } from 'lit';
import { Task } from '@lit/task';
import { customElement, state } from 'lit/decorators.js';
import { when } from 'lit/directives/when.js';

import { WlViewMixin, TailwindElement } from '@/mixins';
import { loadScript } from '@/utils';
import './components';

const classNameGrid = 'grid md:grid-cols-2 gap-4';

type Data = {
  accountsOnFile: AccountOnFile[];
  basicPaymentItems: BasicPaymentItem[];
};

@customElement('wl-view-products')
export class WlViewProducts extends WlViewMixin(TailwindElement) {
  @state() private _items: Data['basicPaymentItems'] = [];
  @state() private _accountsOnFile: Data['accountsOnFile'] = [];

  #loadProductsTask = new Task(this, {
    autoRun: false,
    onError: console.error,
    onComplete: ({ accountsOnFile, basicPaymentItems }) => {
      this._items = basicPaymentItems;
      this._accountsOnFile = accountsOnFile;
    },
    task: async () => {
      if (this.sessionController.context?.googlePay) {
        await loadScript('https://pay.google.com/gp/p/js/pay.js');
      }

      const {
        paymentProductSpecificInputs,
        groupPaymentProducts,
        session,
        paymentDetails,
      } = this.sessionController;

      if (!session) throw new Error('No session found');
      if (!paymentDetails) throw new Error('No payment details found');

      const { accountsOnFile, basicPaymentItems } =
        await session.getBasicPaymentItems(
          paymentDetails,
          !!groupPaymentProducts,
          paymentProductSpecificInputs,
        );

      return { accountsOnFile, basicPaymentItems };
    },
  });

  protected afterContextProviderReady() {
    super.afterContextProviderReady();
    this.#loadProductsTask.run().catch(console.error);
  }

  render() {
    return html`<div>
      ${this.#loadProductsTask.render({
        error: () => html`
          <wl-alert severity="error" class="md:max-w-80 mx-auto">
            There was a problem while getting the payment items; please check
            your credentials and payment context
            <wl-link class-anchor="underline text-black" href="/">here</wl-link>
          </wl-alert>
        `,
        pending: () =>
          html`<div>
            <wl-loading-spinner>
              Fetching payment products...
            </wl-loading-spinner>
          </div>`,
        complete: () => html`
          <h1 class="text-2xl font-semibold mb-8">Payment Product</h1>
          <div class="flex flex-col gap-8">
            ${when(
              this._accountsOnFile.length,
              () => html`
                <aside>
                  <h2 class="text-lg font-semibold mb-4">
                    Previously used accounts
                  </h2>
                  <ul class="${classNameGrid}">
                    ${this._accountsOnFile.map(
                      (account) =>
                        html`<li>
                          <wl-link-account-on-file
                            .data=${account}
                          ></wl-link-account-on-file>
                        </li>`,
                    )}
                  </ul>
                </aside>
              `,
            )}
            ${when(
              this._items.length,
              () => html`
                <aside>
                  <h2 class="text-lg font-semibold mb-4">
                    Choose a payment product
                  </h2>
                  <ul class="${classNameGrid}">
                    ${this._items.map(
                      (item) =>
                        html`<li>
                          <wl-link-payment-product
                            .data=${item}
                          ></wl-link-payment-product>
                        </li>`,
                    )}
                  </ul>
                </aside>
              `,
            )}
          </div>
        `,
      })}
    </div>`;
  }
}
