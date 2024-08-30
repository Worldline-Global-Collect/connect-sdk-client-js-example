import type { LitElement, PropertyValues, TemplateResult } from 'lit';
import type { ValidationRule, ValidationRuleType } from 'connect-sdk-client-js';
import type { Constructor } from '@/types';
import type { AdditionalInputProps } from '@/elements';

import { html, nothing } from 'lit';
import { eventOptions, property } from 'lit/decorators.js';
import { PaymentProductField } from 'connect-sdk-client-js';

import { TailwindElement } from '@/mixins';
import { additionalPropsMap, iconMap, WlInput } from '@/elements';

export const validationMessages = new Map<
  ValidationRuleType | 'required' | string,
  (data: { rule: ValidationRule; value: string }) => string
>([
  ['emailAddress', () => 'Please enter a valid email address'],
  ['expirationDate', () => 'Please enter a valid expiration date'],
  ['iban', () => 'Please enter valid iban'],
  ['luhn', () => 'Please enter a valid credit card number'],
  ['required', () => 'This field is required'],
  ['regularExpression', () => 'Please enter valid data'],
  [
    'length',
    ({ rule }) => {
      const attributes = rule.json.attributes;
      if (!attributes || typeof attributes !== 'object') {
        return 'Invalid length';
      }
      const minLength = 'minLength' in attributes ? attributes.minLength : null;
      const maxLength = 'maxLength' in attributes ? attributes.maxLength : null;
      return minLength === maxLength
        ? `Please enter a value of length ${minLength}`
        : `Please enter a valid length between ${minLength} and ${maxLength}`;
    },
  ],
]);

declare class WlFieldMixinInterface {
  value?: string;
  autofocus: boolean;
  disabled: boolean;
  readonly: boolean;
  loading: boolean;
  paymentProductField: PaymentProductField;
  validate(input: WlInput): void;
  protected additionalInputProps?: AdditionalInputProps;
  protected onChangeInput(e: Event): void;
  protected renderTooltip(): TemplateResult | typeof nothing;
  protected renderIcon(): LitElement | typeof nothing;
}

/**
 * This mixin binds the PaymentProductField data to form field
 * and can be used to wrap a payment-product-field element
 */
export const WlFieldMixin = <T extends Constructor<LitElement>>(
  superClass: T,
) => {
  class WlFieldMixinClass extends superClass {
    protected additionalInputProps?: AdditionalInputProps;

    @property({ type: String, reflect: true }) value = '';
    @property({ type: Boolean, reflect: true }) autofocus = false;
    @property({ type: Boolean, reflect: true }) disabled = false;
    @property({ type: Boolean, reflect: true }) readonly = false;
    @property({ type: Boolean, reflect: true }) loading = false;

    @property({ type: String, reflect: true, attribute: 'inputmode' })
    inputMode = 'text';

    @property({ type: Object, attribute: 'field-data' })
    paymentProductField!: PaymentProductField;

    @property({ type: String, attribute: 'field-id', reflect: true })
    fieldId!: string;

    protected createRenderRoot() {
      return this;
    }

    protected willUpdate(changedProperties: PropertyValues) {
      super.willUpdate(changedProperties);
      if (changedProperties.has('paymentProductField')) {
        const id = this.paymentProductField.id;
        const preferredInputType =
          this.paymentProductField.displayHints?.preferredInputType;
        this.additionalInputProps = additionalPropsMap.get(id);
        this.fieldId = id;
        this.inputMode =
          preferredInputType === 'IntegerKeyboard' ? 'numeric' : 'text';
      }
    }

    /**
     * Render icon based on fieldData
     */
    protected renderIcon() {
      const IconComponent = iconMap.get(this.paymentProductField.id);
      if (!IconComponent) return nothing;

      const iconInstance = new IconComponent();
      iconInstance.classList.add('w-6', 'h-6');
      return iconInstance;
    }

    /**
     * Render tooltip based on displayHints from fieldData
     */
    protected renderTooltip() {
      const tooltip = this.paymentProductField.displayHints?.tooltip;
      if (!tooltip) return nothing;

      return html`<wl-info-tooltip class="flex" tabindex="-1">
        <div class="max-w-[240px]">
          <h3 class="font-semibold mb-4 text-balance">${tooltip.label}</h3>
          <img
            src="${tooltip.image}?size=240x160"
            class="max-w-full"
            width="240"
            height="160"
            alt="${tooltip.label}"
          />
        </div>
      </wl-info-tooltip>`;
    }

    /**
     * Apply mask to the input field
     */
    applyMask({ _input: input }: WlInput) {
      const { value, selectionStart } = input;

      const beforeCursor = this.paymentProductField.applyMask(
        value.slice(0, selectionStart ?? 0),
      ).formattedValue;

      const maskedValue = this.paymentProductField.applyMask(
        beforeCursor + value.slice(selectionStart ?? 0),
      ).formattedValue;

      const updatedCursorPosition = beforeCursor.length;
      this.value = input.value = maskedValue;
      input.setSelectionRange(updatedCursorPosition, updatedCursorPosition);
    }

    /**
     * Validate the unmasked input value against all validation rules
     */
    protected validate(input: WlInput) {
      const validationRules =
        this.paymentProductField.dataRestrictions?.validationRules || [];
      const unmaskedValue = this.paymentProductField.removeMask(this.value);

      for (const rule of validationRules) {
        const isValid = rule.validate(unmaskedValue);
        if (isValid) continue;

        const validationMessageFn = validationMessages.get(rule.type);
        const arg = { rule, value: unmaskedValue };
        const error = validationMessageFn?.(arg) || 'Invalid value';
        input.setCustomValidity(error);
        return;
      }

      // clear all validity errors
      input.setValidity();
    }

    /**
     * Event handler used when a WlInput Input element
     * changes value, example:
     *
     * ```html
     * <wl-input @input=${this.onChangeInput} ... />
     * ```
     */
    @eventOptions({ passive: true, capture: true })
    protected onChangeInput(e: Event) {
      const input = e.currentTarget as WlInput;
      this.applyMask(input);
      setTimeout(() => this.validate(input), 0);
    }
  }

  return WlFieldMixinClass as unknown as Constructor<WlFieldMixinInterface> & T;
};

export const WlFieldElement = WlFieldMixin(TailwindElement);
