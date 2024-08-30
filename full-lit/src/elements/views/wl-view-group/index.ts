import type { PaymentProductGroup } from 'connect-sdk-client-js';
import type { RouterLocation } from '@vaadin/router';

import { css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { Task } from '@lit/task';

import { TailwindElement, WlViewMixin } from '@/mixins';

@customElement('wl-view-group')
export class WlViewGroup extends WlViewMixin(TailwindElement) {
  @property({ type: String }) groupId?: string;

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

  #loadPaymentProductGroupTask = new Task<[], PaymentProductGroup>(this, {
    autoRun: false,
    onError: console.error,
    task: async () => {
      const { session, paymentDetails } = this.sessionController;
      if (!session) throw new Error('No session found');
      if (!this.groupId) throw new Error('No group id found');
      return session.getPaymentProductGroup(this.groupId, paymentDetails);
    },
  });

  onBeforeEnter(location: RouterLocation) {
    this.groupId = location.params.id as string | undefined;
  }

  afterContextProviderReady() {
    this.#loadPaymentProductGroupTask.run().catch(console.error);
  }

  render() {
    return html`<div>
      ${this.#loadPaymentProductGroupTask.render({
        error: () =>
          html`<wl-alert severity="error" class="md:max-w-80 mx-auto">
            There was a problem while getting the payment items; please check
            your credentials and payment context
            <wl-link class-anchor="underline text-black" href="/">here</wl-link>
          </wl-alert>`,
        pending: () =>
          html`<wl-loading-spinner> Fetching data... </wl-loading-spinner>`,
        complete: (paymentProductGroup) => {
          return html`
            <wl-form-payment
              .paymentProductFields=${paymentProductGroup.paymentProductFields}
            ></wl-form-payment>
          `;
        },
      })}
    </div>`;
  }
}
