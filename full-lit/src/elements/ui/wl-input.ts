import type { PropertyValues } from 'lit';

import { twMerge } from 'tailwind-merge';
import { css, html, LitElement, nothing } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import {
  customElement,
  eventOptions,
  property,
  query,
  queryAssignedNodes,
} from 'lit/decorators.js';

import { TailwindElement } from '@/mixins';

let idx = 0;
const paddingOffset = 8;
const gap = 16;

@customElement('wl-input')
export class WlInput extends TailwindElement {
  static styles = [
    ...TailwindElement.styles,
    css`
      :host {
        outline: 0 !important;
        box-shadow: none !important;
        padding: 0 !important;
        border: 0 !important;
      }
      ::slotted(*) {
        position: absolute;
        top: 0;
        height: 100%;
        display: flex;
        align-items: center;
      }
      slot[name='prefix']::slotted(*) {
        left: ${paddingOffset}px;
      }
      slot[name='suffix']::slotted(*) {
        right: ${paddingOffset}px;
      }
      input {
        padding-left: var(--wl-input-padding-left, 1rem) !important;
        padding-right: var(--wl-input-padding-right, 1rem) !important;
      }
    `,
  ];

  static shadowRootOptions = {
    ...LitElement.shadowRootOptions,
    delegatesFocus: true,
  };

  static formAssociated = true;
  #internals = this.attachInternals();

  @property({ type: Number, reflect: true }) step?: number;
  @property({ type: String }) class = '';
  @property({ type: String, attribute: 'input-id' }) inputId?: string;
  @property({ attribute: false }) private _id: string = `input:${++idx}`;
  @property({ type: Boolean, attribute: false }) isDirty = false;

  @property({ type: String, reflect: true })
  type: HTMLInputElement['type'] = 'text';

  @property({ type: Boolean, reflect: true })
  required: HTMLInputElement['required'] = false;

  @property({ type: Boolean, reflect: true })
  disabled: HTMLInputElement['disabled'] = false;

  @property({ type: Boolean, reflect: true })
  readonly: HTMLInputElement['readOnly'] = false;

  @property({ type: Function })
  onChange?: HTMLInputElement['onchange'];

  @property({ type: String, reflect: true })
  placeholder: HTMLInputElement['placeholder'] = '';

  @property({ type: String, reflect: true })
  autocomplete?: HTMLInputElement['autocomplete'];

  @property({ type: String })
  inputmode: HTMLInputElement['inputMode'] = 'text';

  @property({ type: String, reflect: true })
  name: HTMLInputElement['name'] = '';

  @property({ type: String, reflect: true })
  pattern?: HTMLInputElement['pattern'];

  @property({ type: String, reflect: true })
  value: HTMLInputElement['value'] = '';

  @query('input') _input!: HTMLInputElement;

  @queryAssignedNodes({ slot: 'prefix', flatten: true })
  private _assignedNodesPrefix?: Node[];

  @queryAssignedNodes({ slot: 'suffix', flatten: true })
  private _assignedNodesSuffix?: Node[];

  connectedCallback() {
    super.connectedCallback();
    this.isDirty = false;
  }

  protected firstUpdated(changedProperties: PropertyValues) {
    super.firstUpdated(changedProperties);
    this.#syncInputInternal();
  }

  async #waitForLoadedImages(node: HTMLElement) {
    const imageLoadComplete = (img: HTMLImageElement): Promise<void> => {
      return new Promise((r) => {
        if (img.complete) return r();
        img.addEventListener('load', () => r(), { once: true });
      });
    };

    const images = Array.from(node.querySelectorAll<HTMLImageElement>('img'));
    return Promise.all(images.map(imageLoadComplete));
  }

  async #setPadding(type: 'prefix' | 'suffix') {
    const direction = type === 'prefix' ? 'left' : 'right';
    const node = (
      type === 'prefix' ? this._assignedNodesPrefix : this._assignedNodesSuffix
    )?.[0];
    if (!(node instanceof HTMLElement)) {
      this._input.style.removeProperty(`--wl-input-padding-${direction}`);
      return;
    }

    await this.#waitForLoadedImages(node);
    const width = node.getBoundingClientRect().width;
    this._input.style.setProperty(
      `--wl-input-padding-${direction}`,
      `${width + paddingOffset + gap}px`,
    );
  }

  @eventOptions({ passive: true, capture: true })
  private async _slotChangeSuffix() {
    await this.#setPadding('suffix');
  }

  @eventOptions({ passive: true, capture: true })
  private async _slotChangePrefix() {
    await this.#setPadding('prefix');
  }

  attributeChangedCallback(
    name: string,
    _old: string | null,
    value: string | null,
  ) {
    super.attributeChangedCallback(name, _old, value);
    if (name === 'value' && value) this.isDirty = true;
    if (name === 'input-id' && value && _old !== value) {
      this._id = value;
    }
    this.#syncInputInternal();
  }

  protected updated(changedProperties: PropertyValues) {
    super.updated(changedProperties);
    const syncInputProps = ['value', 'required'];
    if (syncInputProps.some((prop) => changedProperties.has(prop))) {
      this.#syncInputInternal();
    }
  }

  setValidity(flags?: ValidityStateFlags, message?: string) {
    this.#internals.setValidity(flags, message, this._input);
  }

  setCustomValidity(error: string) {
    this.setValidity({ customError: true }, error);
  }

  checkValidity() {
    return this.#internals.checkValidity();
  }

  reportValidity() {
    return this.#internals.reportValidity();
  }

  get validity() {
    return this.#internals.validity;
  }

  get validationMessage() {
    return this.#internals.validationMessage;
  }

  formDisabledCallback(disabled: boolean) {
    this.disabled = disabled;
  }

  formStateRestoreCallback(state: string) {
    this.value = state;
  }

  #syncInputInternal() {
    if (!this._input) return;
    this.value = this._input.value;

    // only set validation when is dirty
    if (this.isDirty || this.required) {
      this.#internals.setFormValue(this._input.value);
      this.#internals.setValidity(
        this._input.validity,
        this._input.validationMessage,
        this._input,
      );
    }
  }

  #onKeyDown(event: KeyboardEvent) {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    this.#internals.form?.requestSubmit();
  }

  #onInput() {
    this.isDirty = true;
    this.#syncInputInternal();
  }

  render() {
    return html`
      <div class="relative">
        <slot name="prefix" @slotchange=${this._slotChangePrefix}></slot>
        <input
          @input=${this.#onInput}
          @keydown=${this.#onKeyDown}
          .autocomplete=${ifDefined(this.autocomplete)}
          ?required=${this.required}
          ?disabled=${this.disabled}
          ?readonly=${this.readonly}
          .name=${this.name}
          inputmode=${this.inputmode}
          .step=${this.step ?? nothing}
          .pattern=${this.pattern ?? nothing}
          .id=${this._id}
          .onChange=${this.onChange}
          .type=${this.type}
          .placeholder=${this.placeholder}
          .value=${this.value}
          class="${twMerge(
            'truncate block w-full py-2 text-gray-700 bg-white border border-gray-300 rounded-md outline-indigo-500',
            this.disabled
              ? 'border-transparent bg-gray-200 transition-colors placeholder-gray-400 text-gray-400 cursor-not-allowed'
              : '',
            this.readonly ? 'border-transparent text-gray-500' : '',
            this.class,
          )}"
        />
        <slot name="suffix" @slotchange=${this._slotChangeSuffix}></slot>
      </div>
    `;
  }
}
