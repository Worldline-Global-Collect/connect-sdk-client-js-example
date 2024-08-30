import { twMerge } from 'tailwind-merge';
import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { when } from 'lit/directives/when.js';

import { TailwindElement } from '@/mixins';

type ButtonVariant = 'primary' | 'secondary';
type ButtonSize = 'xs' | 'md' | 'xl';

export const buttonVariantClasses = new Map<ButtonVariant, string>([
  [
    'primary',
    'bg-green-600 hover:bg-green-500 focus:bg-green-500 text-white focus-visible:outline-green-600',
  ],
  [
    'secondary',
    'bg-gray-200 hover:bg-gray-300 focus:bg-gray-300 focus-visible:outline-gray-600',
  ],
]);

export const buttonSizeMap = new Map<ButtonSize, string>([
  ['xs', 'text-sm py-1.5'],
  ['md', 'py-2'],
  ['xl', 'text-lg py-2.5'],
]);

export function getButtonClassName({
  disabled = false,
  variant = 'primary',
  size = 'md',
}: {
  disabled?: boolean;
  size?: ButtonSize;
  variant?: ButtonVariant;
} = {}) {
  return twMerge(
    'inline-flex justify-center border border-transparent gap-2 items-center w-full px-4 py-2 font-medium rounded-md focus-visible:outline-2 focus-visible:outline-offset-2',
    buttonVariantClasses.get(variant),
    buttonSizeMap.get(size),
    disabled ? buttonDisabledClass : '',
  );
}

export const buttonDisabledClass =
  'bg-gray-200 transition-colors cursor-not-allowed hover:bg-gray-200 text-gray-400';

@customElement('wl-button')
export class WlButton extends TailwindElement {
  #internals = this.attachInternals();

  static formAssociated = true;
  static styles = [
    ...TailwindElement.styles,
    css`
      :host {
        display: inline-block;
      }
    `,
  ];

  static shadowRootOptions = {
    ...LitElement.shadowRootOptions,
    delegatesFocus: true,
  };

  @property({ type: String, reflect: true }) variant: ButtonVariant = 'primary';
  @property({ type: String, reflect: true }) type: HTMLButtonElement['type'] =
    'submit';
  @property({ type: Boolean, reflect: true }) disabled = false;
  @property({ type: Boolean, reflect: true }) loading = false;
  @property({ type: String, reflect: true }) size: ButtonSize = 'md';
  @property({ type: String, reflect: true }) class = '';

  #onClick() {
    if (this.type !== 'submit') return;
    this.#internals.form?.requestSubmit();
  }

  render() {
    return html`
      <button
        part="button"
        @click=${this.#onClick}
        type="${this.type}"
        ?disabled=${this.disabled}
        class="${twMerge(
          getButtonClassName({
            disabled: this.disabled,
            variant: this.variant,
            size: this.size,
          }),
          this.class,
        )}"
      >
        ${when(
          this.loading,
          () => html`<wl-loading-spinner size="xs"></wl-loading-spinner>`,
        )}
        <slot></slot>
      </button>
    `;
  }
}
