import type { PropertyValues } from 'lit';

import { css, html, LitElement } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { when } from 'lit/directives/when.js';

import { TailwindElement } from '@/mixins';
import { getButtonClassName } from '@/elements';
import { twMerge } from 'tailwind-merge';

type DialogSize = 'small' | 'normal' | 'wide';

const infoButtonClassName = getButtonClassName({ variant: 'secondary' });

const sizesMap = new Map<DialogSize, string>([
  ['small', 'md:max-w-[35ch]'],
  ['normal', 'md:max-w-[50ch]'],
  ['wide', 'w-full'],
]);

@customElement('wl-dialog-info')
export class WlDialogInfo extends TailwindElement {
  static styles = [
    ...TailwindElement.styles,
    css`
      :host {
        display: block;
      }
    `,
  ];
  static shadowRootOptions = {
    ...LitElement.shadowRootOptions,
    delegatesFocus: true,
  };

  @property({ type: String, attribute: 'dialog-title' }) dialogTitle?: string;
  @property({ type: Boolean }) closeClickOutside = true;
  @property({ type: String }) size: DialogSize = 'normal';

  @property({ reflect: true }) open = false;
  @query('dialog') private _dialog!: HTMLDialogElement;

  showModal() {
    this.open = true;
  }

  close() {
    this.open = false;
  }

  protected updated(changedProperties: PropertyValues) {
    super.updated(changedProperties);
    if (!changedProperties.has('open')) return;

    if (this.open) {
      this._dialog.showModal();
      this._dialog.addEventListener('close', this.#onCloseDialog, {
        passive: true,
        capture: false,
      });
      this._dialog.addEventListener('click', this.#onClickDialog, {
        passive: true,
        capture: false,
      });
    } else {
      this._dialog?.close();
      this._dialog.removeEventListener('close', this.#onCloseDialog);
      this._dialog.removeEventListener('click', this.#onClickDialog);
    }
  }

  #onCloseDialog = () => {
    this.open = false;
  };

  #onClickDialog = (e: MouseEvent) => {
    if (this.closeClickOutside && e.target === this._dialog) {
      this.open = false;
    }
  };

  render() {
    return html`
      <slot name="summary" @click=${() => this.showModal()}></slot>
      <dialog
        @close=${() => (this.open = false)}
        class="inset-0 block [&:not([open])]:opacity-0 [&:not([open])]:pointer-events-none [&:not([open])]:translate-y-10 
        transition-[opacity,transform] duration-300 rounded backdrop:bg-gray-800/60 p-4 motion-reduce:transition-none
        backdrop:backdrop-blur-sm ${sizesMap.get(this.size)}"
      >
        <div>
          ${when(
            this.dialogTitle,
            () =>
              html`<h2 class="text-balance text-xl font-semibold mb-4">
                ${this.dialogTitle}
              </h2>`,
          )}
          <slot class="text-pretty"></slot>
          <button
            tabindex="${this.open ? 0 : -1}"
            class="${twMerge(infoButtonClassName, 'w-fit ml-auto flex mt-6')}"
            @click=${() => (this.open = false)}
          >
            Close
          </button>
        </div>
      </dialog>
    `;
  }
}
