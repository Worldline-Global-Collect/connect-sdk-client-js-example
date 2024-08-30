import { html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';

import { WlFieldElement } from '@/mixins';

/**
 * Default input for payment product field
 * Connects PaymentProductField to the input field
 */
@customElement('wl-payment-product-field-default-input')
export class WlPaymentProductFieldDefaultInput extends WlFieldElement {
  static formAssociated = true;

  render() {
    if (!this.paymentProductField) {
      throw new Error(
        `fieldData should be set to render <wl-payment-product-field-default-input> correctly`,
      );
    }

    const { id, displayHints, dataRestrictions } = this.paymentProductField;

    const icon = this.renderIcon();
    const tooltip = this.renderTooltip();

    return html`
      <wl-form-field
        label=${displayHints?.label}
        ?required=${dataRestrictions?.isRequired}
        ?disabled=${this.disabled || this.loading}
      >
        <wl-input
          inputmode=${ifDefined(
            this.additionalInputProps?.inputmode ?? this.inputMode,
          )}
          ?disabled=${this.disabled || this.additionalInputProps?.disabled}
          ?readonly=${this.readonly || this.additionalInputProps?.readonly}
          autocomplete=${ifDefined(this.additionalInputProps?.autocomplete)}
          @input=${this.onChangeInput}
          ?autofocus=${this.additionalInputProps?.autofocus ?? this.autofocus}
          ?required=${dataRestrictions?.isRequired}
          name=${id}
          id=${id}
          .type=${this.paymentProductField.type}
          .placeholder=${displayHints?.placeholderLabel}
          .value=${this.value}
        >
          <span slot="prefix" class="text-gray-500">${icon}</span>
          <span slot="suffix">${tooltip}</span>
        </wl-input>
      </wl-form-field>
    `;
  }
}
