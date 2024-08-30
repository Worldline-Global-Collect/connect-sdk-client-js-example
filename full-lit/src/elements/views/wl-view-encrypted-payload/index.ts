import type { PropertyValues } from 'lit';
import type { RouterLocation } from '@vaadin/router';

import { html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { twMerge } from 'tailwind-merge';

import { WlViewMixin, TailwindElement } from '@/mixins';
import { getButtonClassName } from '@/elements';

/**
 * Renders the encrypted payload which users can use
 * to copy and paste it into the payment form.
 */
@customElement('wl-view-encrypted-payload')
export class WlViewEncryptedPayload extends WlViewMixin(TailwindElement) {
  @property({ type: String }) encryptedPayload!: string;

  @query('form') private _form!: HTMLFormElement;

  onBeforeEnter(location: RouterLocation) {
    this.encryptedPayload = location.params.payload as string;
  }

  #selectPayloadText() {
    this._form.querySelector('textarea')!.select();
  }

  firstUpdated(changedProperties: PropertyValues) {
    super.firstUpdated(changedProperties);
    this.#selectPayloadText();
  }

  render() {
    return html`<form>
      <h1 class="text-2xl font-bold leading-none mb-4 text-balance">
        Congratulations!
      </h1>
      <div class="flex flex-col gap-4">
        <p class="text-balance">
          Your payment has been successfully processed by the SDK. You can send
          this string to Worldline to process the payment.
        </p>
        <textarea
          readonly
          rows="15"
          cols="100"
          class="text-gray-700 resize-none font-mono w-full text-pretty text-xs break-all p-4 border border-gray-300 rounded-md"
          @click=${this.#selectPayloadText}
          @focus=${this.#selectPayloadText}
          .value=${this.encryptedPayload}
        ></textarea>
      </div>
      <div class="flex flex-col-reverse sm:flex-row justify-between mt-8 gap-2">
        <wl-link
          href="/"
          class-anchor="${twMerge(
            getButtonClassName({ variant: 'secondary' }),
            'sm:w-fit',
          )}"
        >
          Start another payment process
        </wl-link>

        <wl-copy-button
          value=${this.encryptedPayload}
          @copied-success=${this.#selectPayloadText}
        >
          <span slot="label-copied">Copy Encrypted Payload Success</span>
          <span slot="label-copy">Copy Encrypted Payload</span>
        </wl-copy-button>
      </div>
    </form>`;
  }
}
