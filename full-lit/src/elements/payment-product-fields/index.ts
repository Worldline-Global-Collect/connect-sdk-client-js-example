import type { TailwindElement, WlFieldElement } from '@/mixins';
import type { PaymentProductFieldElement } from '@/types';
import type { PaymentProductField } from 'connect-sdk-client-js';

export * from './wl-payment-product-field-default-input';
export * from './wl-payment-product-field-card-number';

import {
  WlIconUser,
  WlIconCard,
  WlIconLock,
  WlIconCalendar,
} from '@/elements/icons';
import {
  WlPaymentProductFieldDefaultInput,
  WlPaymentProductFieldCardNumber,
} from '.';

export type AdditionalInputProps = {
  autocomplete?: HTMLInputElement['autocomplete'];
  autofocus?: HTMLInputElement['autofocus'];
  disabled?: HTMLInputElement['disabled'];
  readonly?: HTMLInputElement['readOnly'];
  inputmode?: HTMLInputElement['inputMode'];
};

export const fieldMap = new Map([
  ['cardNumber', WlPaymentProductFieldCardNumber],
]) satisfies Map<string, typeof WlFieldElement>;

export const DefaultField = WlPaymentProductFieldDefaultInput;

export const iconMap = new Map([
  ['cardNumber', WlIconCard],
  ['expiryDate', WlIconCalendar],
  ['cvv', WlIconLock],
  ['cardholderName', WlIconUser],
]) satisfies Map<string, typeof TailwindElement>;

export const additionalPropsMap = new Map([
  ['cardNumber', { autocomplete: 'cc-number' }],
  ['expiryDate', { autocomplete: 'cc-exp' }],
  ['cvv', { autocomplete: 'cc-csc' }],
  ['cardholderName', { autocomplete: 'cc-name' }],
]) satisfies Map<string, AdditionalInputProps>;

/**
 * Render payment product paymentProductFields
 */
export function renderPaymentProductFields(
  fields: PaymentProductField[],
): PaymentProductFieldElement[] {
  return fields.map((field) => {
    const FieldComponent = fieldMap.get(field.id) || DefaultField;
    const fieldInstance = new FieldComponent();
    fieldInstance.paymentProductField = field;
    return fieldInstance;
  });
}
