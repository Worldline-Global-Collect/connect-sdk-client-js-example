import type { PropertyValues } from 'lit';

import { html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { twMerge } from 'tailwind-merge';

import { TailwindElement } from '@/mixins';
import { getButtonClassName, WlDialogConfirm } from '@/elements';

/**
 * This component will render a dialog with the encrypted payload
 * and functionality to copy the encrypted payload to the clipboard
 */
@customElement('wl-dialog-encrypted-payload')
export class WlDialogEncryptedPayload extends TailwindElement {
  @property({ type: String }) encryptedPayload = '';
  @query('wl-dialog-confirm') private _dialog!: WlDialogConfirm;

  #selectPayloadText() {
    const form = this._dialog.getFormElement();
    form.querySelector('textarea')!.select();
  }

  willUpdate(changedProperties: PropertyValues) {
    // Open/close the dialog based truthy encryptedPayload value
    if (changedProperties.has('encryptedPayload') && this._dialog) {
      this.encryptedPayload ? this._dialog.showModal() : this._dialog.close();
    }
  }

  render() {
    return html`
      <wl-dialog-confirm dialog-title="Congratulations!">
        <wl-link
          slot="cancel-button"
          href="/"
          class-anchor="${twMerge(
            getButtonClassName({ variant: 'secondary' }),
            'w-fit',
          )}"
        >
          Start another payment process
        </wl-link>

        <wl-copy-button
          value=${this.encryptedPayload}
          slot="submit-button"
          @copied-success=${this.#selectPayloadText}
        >
          <span slot="label-copied">Copy Encrypted Payload Success</span>
          <span slot="label-copy">Copy Encrypted Payload</span>
        </wl-copy-button>

        <div class="flex flex-col gap-4">
          <p class="text-balance">
            Your payment has been successfully processed by the SDK. You can
            send this string to Worldline to process the payment.
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
      </wl-dialog-confirm>
    `;
  }
}
