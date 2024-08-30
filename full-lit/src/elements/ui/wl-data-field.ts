import type { TemplateResult } from 'lit';
import type { Checkbox, Field, Input, RadioGroup, Select } from '@/types';

import { customElement, property, state } from 'lit/decorators.js';
import { html, nothing } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { when } from 'lit/directives/when.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { map } from 'lit/directives/map.js';
import { repeat } from 'lit/directives/repeat.js';

import { TailwindElement } from '@/mixins';

/**
 * Renders a form field based on the provided data
 */
@customElement('wl-data-field')
export class WlDataField extends TailwindElement {
  @property() data!: Field;
  @property({ type: String, attribute: false }) radioGroupValue = '';
  @state() private _checkboxChecked: boolean = false;

  protected createRenderRoot(): HTMLElement | DocumentFragment {
    return this;
  }

  #renderInput(data: Input): TemplateResult {
    const {
      type,
      autofocus,
      step,
      value,
      name,
      description,
      required,
      disabled,
      label,
      autocomplete,
    } = data;

    return html`<wl-input
      ?required=${required}
      ?disabled=${disabled}
      ?autofocus="${autofocus}"
      type=${type || nothing}
      name=${name}
      placeholder=${label}
      step=${step || nothing}
      value=${value || nothing}
      autocomplete=${ifDefined(autocomplete)}
    >
      ${when(
        description,
        () => html`
          <wl-info-tooltip slot="suffix" tabindex="-1">
            <div>${description}</div>
          </wl-info-tooltip>
        `,
      )}
    </wl-input>`;
  }

  #renderSelect({
    name,
    disabled,
    required,
    selected,
    autofocus,
    autocomplete,
    options = [],
  }: Select): TemplateResult {
    return html`<select
      name=${name}
      ?autofocus=${autofocus}
      ?required=${required}
      ?disabled=${disabled}
      autocomplete=${ifDefined(autocomplete)}
      class="appearance-none pr-8 bg-[length:.6em] bg-no-repeat bg-[position:calc(100%_-_1em)_50%] bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%3E%3Ctitle%3Edown-arrow%3C%2Ftitle%3E%3Cg%20fill%3D%22%23000000%22%3E%3Cpath%20d%3D%22M10.293%2C3.293%2C6%2C7.586%2C1.707%2C3.293A1%2C1%2C0%2C0%2C0%2C.293%2C4.707l5%2C5a1%2C1%2C0%2C0%2C0%2C1.414%2C0l5-5a1%2C1%2C0%2C1%2C0-1.414-1.414Z%22%20fill%3D%22%23000000%22%3E%3C%2Fpath%3E%3C%2Fg%3E%3C%2Fsvg%3E')] w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500 ${disabled
        ? 'border-transparent bg-gray-200 transition-colors placeholder-gray-400 text-gray-400 cursor-not-allowed'
        : 'bg-white'}"
    >
      ${options.map(
        ({ value, label }) => html`
          <option ?selected=${selected === value} value=${value}>
            ${label}
          </option>
        `,
      )}
    </select>`;
  }

  #renderCheckbox({
    name,
    label,
    autofocus,
    description,
    fields,
    alert,
  }: Checkbox): TemplateResult {
    const checked = fields?.length > 0 && this._checkboxChecked;
    const _fields = fields?.map((field) => ({
      ...field,
      required: checked ? field.required : false,
      disabled: checked ? field.disabled : true,
    }));

    return html`<div>
      <label class="flex items-center gap-2 cursor-pointer" id="label_${name}">
        <input
          role="button"
          aria-label="${label}"
          aria-expanded="${checked}"
          aria-controls="content_${name}"
          type="checkbox"
          name=${name}
          ?autofocus=${autofocus}
          @change=${(e: Event) => {
            this._checkboxChecked = (e.target as HTMLInputElement).checked;
          }}
        />
        <span>${label}</span>
        ${when(
          description,
          () => html`
            <wl-info-tooltip class="inline-flex" slot="suffix" tabindex="-1">
              <div>${description}</div>
            </wl-info-tooltip>
          `,
        )}
      </label>
      ${when(
        fields?.length > 0 || !!alert,
        () =>
          html`<wl-disclosure
            ?open=${checked}
            id="content_${name}"
            aria-labelledby="label_${name}"
          >
            <div class="mt-3 mb-6 flex flex-col gap-4 ml-6 p-[1px]">
              ${when(
                alert,
                () =>
                  html`<p class="text-balance text-sm text-red-600">
                    ${unsafeHTML(alert)}
                  </p>`,
              )}
              ${when(
                fields.length > 0,
                () => html`
                  ${repeat(
                    _fields,
                    (field) => `${name}:${field.name}`,
                    (field) => this.#renderField(field),
                  )}
                `,
              )}
            </div>
          </wl-disclosure>`,
      )}
    </div>`;
  }

  #renderRadioGroup(data: RadioGroup): TemplateResult {
    const { label, options, name } = data;
    const fields =
      options.find((option) => option.value === this.radioGroupValue)?.fields ||
      [];

    return html`<div class="flex flex-col gap-4">
      <h3 class="font-semibold text-lg">${label}</h3>
      <div class="flex gap-4">
        ${map(
          options,
          (option) => html`
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                type="radio"
                name=${name}
                .value=${option.value}
                ?checked=${option.checked}
                @change=${(e: Event) => {
                  this.radioGroupValue = (
                    e.currentTarget as HTMLInputElement
                  ).value;
                }}
              />
              ${option.label}
            </label>
          `,
        )}
      </div>

      ${when(
        fields.length > 0,
        () => html`
          <div class="flex flex-col gap-4">
            ${repeat(
              fields,
              (field) => `${this.radioGroupValue}:${field.name}`,
              (field) => this.#renderField(field),
            )}
          </div>
        `,
      )}
    </div>`;
  }

  #renderField(field: Field) {
    switch (field.component) {
      case 'input':
        return html`
          <wl-form-field
            label=${field.label}
            ?required=${field.required}
            ?disabled=${field.disabled}
          >
            ${this.#renderInput(field)}
          </wl-form-field>
        `;
      case 'select':
        return html`
          <wl-form-field
            label=${field.label}
            ?required=${field.required}
            ?disabled=${field.disabled}
          >
            ${this.#renderSelect(field)}
          </wl-form-field>
        `;
      case 'checkbox':
        return this.#renderCheckbox(field);
      case 'radio-group':
        return this.#renderRadioGroup(field);
    }
  }

  render() {
    return this.#renderField(this.data);
  }
}
