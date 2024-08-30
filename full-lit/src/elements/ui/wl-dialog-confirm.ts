import type { PropertyValues } from 'lit';

import { css, html, LitElement } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';

import { TailwindElement } from '@/mixins';
import { when } from 'lit/directives/when.js';

type DialogSize = 'small' | 'normal' | 'wide';

const sizesMap = new Map<DialogSize, string>([
  ['small', 'md:max-w-80'],
  ['normal', 'md:max-w-2xl'],
  ['wide', 'w-full'],
]);

@customElement('wl-dialog-confirm')
export class WlDialogConfirm extends TailwindElement {
  static formAssociated = true;
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

  @property({ type: String, attribute: 'cancel-text' }) cancelText = 'cancel';
  @property({ type: String, attribute: 'submit-label' }) submitLabel = 'Submit';
  @property({ type: String, attribute: 'dialog-title' }) dialogTitle?: string;
  @property({ type: String }) size: DialogSize = 'normal';
  @property({ type: Boolean, reflect: true }) open = false;

  @query('dialog') private _dialog!: HTMLDialogElement;
  @query('form') private _form!: HTMLFormElement;
  @query('slot[data-section="content"]') private _slotContent!: HTMLSlotElement;

  showModal() {
    this._dialog.showModal();
    if (!this.open) this.open = true;
  }

  close() {
    this._dialog.close();
    if (this.open) this.open = false;
  }

  getFormElement() {
    return this._form;
  }

  #onSubmit(e: Event) {
    e.preventDefault();
    e.stopPropagation();
    this.open = false;
    const detail = this._form;
    this.dispatchEvent(
      new CustomEvent('submit', { bubbles: true, composed: true, detail }),
    );
  }

  updated(changedProperties: PropertyValues) {
    super.updated(changedProperties);
    if (changedProperties.has('open')) {
      this.open ? this.showModal() : this.close();

      // update tab index of form elements
      Array.from(this._form.elements).forEach((element) => {
        if (element instanceof HTMLElement) {
          element.tabIndex = this.open ? 0 : -1;
        }
      });
    }
  }

  /**
   * Make sure the fields inside the slot are inserted into the form
   */
  protected firstUpdated(changedProperties: PropertyValues) {
    super.firstUpdated(changedProperties);
    const assignedNodes = this._slotContent.assignedNodes();
    if (assignedNodes.length === 0) return;
    for (const field of assignedNodes) {
      this._form.insertBefore(field, this._slotContent);
    }
  }

  render() {
    return html`
      <slot name="summary" @click=${this.showModal}></slot>
      <dialog
        @close=${() => (this.open = false)}
        @submit=${this.#onSubmit}
        class="inset-0 block [&:not([open])]:opacity-0 [&:not([open])]:pointer-events-none [&:not([open])]:translate-y-10 
        transition-[opacity,transform] duration-300 rounded backdrop:bg-gray-800/60 p-4 motion-reduce:transition-none
        backdrop:backdrop-blur-sm backdrop:animate-fade ${sizesMap.get(
          this.size,
        )}"
      >
        <form method="dialog">
          ${when(
            this.dialogTitle,
            () =>
              html`<h2 class="text-balance text-xl font-semibold mb-4">
                ${this.dialogTitle}
              </h2>`,
          )}

          <slot data-section="content"></slot>
          <div
            class="flex flex-col-reverse sm:flex-row justify-between mt-8 gap-2"
          >
            <slot name="cancel-button" tabindex="${this.open ? 0 : -1}">
              <wl-button type="button" variant="secondary" @click=${this.close}
                >${this.cancelText}</wl-button
              >
            </slot>
            <slot name="submit-button" tabindex="${this.open ? 0 : -1}">
              <wl-button type="submit">${this.submitLabel}</wl-button>
            </slot>
          </div>
        </form>
      </dialog>
    `;
  }
}
