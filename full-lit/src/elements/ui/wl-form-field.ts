import type { PropertyValues } from 'lit';

import { html, LitElement } from 'lit';
import {
  customElement,
  property,
  queryAssignedElements,
} from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

import { TailwindElement } from '@/mixins';
import { when } from 'lit/directives/when.js';

@customElement('wl-form-field')
export class WlFormField extends TailwindElement {
  static formAssociated = true;
  static shadowRootOptions = {
    ...LitElement.shadowRootOptions,
    delegatesFocus: true,
  };

  @property({ type: String }) label = '';
  @property({ type: Boolean, reflect: true }) disabled = false;
  @property({ type: Boolean, reflect: true }) required = false;

  @queryAssignedElements({ slot: '' })
  _controlElements!: HTMLElement[];

  #handleLabelClick() {
    const input = this._controlElements.find(
      (el) => 'focus' in el && typeof el.focus === 'function',
    );
    if (input) input.focus();
  }

  #getLabelElement() {
    if (!this.label) return;
    return html`<label
      @click=${this.#handleLabelClick}
      class="font-semibold ${classMap({
        'text-gray-300': this.disabled,
        'cursor-not-allowed': this.disabled,
      })}"
    >
      ${this.label}&nbsp;${when(
        this.required,
        () => html`<span class="text-md">*</span>`,
      )}
    </label>`;
  }

  #updateControlElementsDisabled() {
    const hasDisabledProp = (
      el: HTMLElement,
    ): el is HTMLElement & { disabled: boolean } => 'disabled' in el;
    this._controlElements.filter(hasDisabledProp).forEach((el) => {
      el.disabled = this.disabled;
    });
  }

  protected willUpdate(changedProperties: PropertyValues) {
    super.willUpdate(changedProperties);
    if (changedProperties.has('disabled')) {
      this.#updateControlElementsDisabled();
    }
  }

  render() {
    const labelElement = this.#getLabelElement();
    return html`<div class="flex flex-col gap-2">
      ${labelElement}
      <slot @slotchange=${this.#updateControlElementsDisabled}></slot>
      <slot class="text-red-500 italic text-sm" name="error"></slot>
    </div>`;
  }
}
