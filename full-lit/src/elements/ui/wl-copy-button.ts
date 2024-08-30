import { css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { when } from 'lit/directives/when.js';
import { animate } from '@lit-labs/motion';

import { TailwindElement } from '@/mixins';

/**
 * A button that copies the value to the clipboard
 */
@customElement('wl-copy-button')
export class WlCopyButton extends TailwindElement {
  #submitTimeout?: ReturnType<typeof setTimeout>;

  static styles = [
    ...TailwindElement.styles,
    css`
      .copied::part(button) {
        background-color: #0e8559;
        pointer-events: none;
      }
    `,
  ];

  @property({ type: String, reflect: true }) value = '';
  @property({ type: Number, reflect: true }) timeout = 2_000;
  @state() private _copied = false;

  #dispatchEvent(key: string, data?: unknown) {
    this.dispatchEvent(
      new CustomEvent(key, {
        bubbles: true,
        composed: true,
        detail: data,
      }),
    );
  }

  #onClick() {
    navigator.clipboard
      .writeText(this.value)
      .then(() => {
        this._copied = true;
        this.#dispatchEvent('copied-success', this.value);
        if (this.#submitTimeout) clearTimeout(this.#submitTimeout);
        this.#submitTimeout = setTimeout(() => {
          this._copied = false;
          this.#dispatchEvent('copied-success-timeout', this.value);
        }, this.timeout);
      })
      .catch((err) => {
        this.#dispatchEvent('copied-error', err);
        console.error(err);
      });
  }

  render() {
    return html`<wl-button
      @click=${this.#onClick}
      type="button"
      class="${this._copied ? 'copied' : ''}"
      ${animate()}
    >
      ${when(
        this._copied,
        () =>
          html`<span class="flex gap-1 items-center">
            <wl-icon-check class="w-5 h-5"></wl-icon-check>
            <slot name="label-copied">Copied success</slot>
          </span>`,
        () => html`<slot name="label-copy">Copy</slot>`,
      )}
    </wl-button>`;
  }
}
