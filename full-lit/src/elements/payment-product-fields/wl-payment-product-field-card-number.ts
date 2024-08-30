import type { PaymentProduct } from 'connect-sdk-client-js';

import { html, type PropertyValues } from 'lit';
import { Task } from '@lit/task';
import { customElement, eventOptions, query, state } from 'lit/decorators.js';
import { when } from 'lit/directives/when.js';
import { map } from 'lit/directives/map.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import {
  IinDetailsResponseError,
  ResponseError,
  IinDetailsStatus,
} from 'connect-sdk-client-js';

import { WlFieldElement } from '@/mixins';
import { WlDropdownOption, WlInput } from '@/elements';
import { SessionController } from '@/controllers';

/**
 * The `WlFieldCardNumber` component
 * is an exception to the default input field
 * as it requires additional logic to determine
 * the supported payment items
 */
@customElement('wl-payment-product-field-card-number')
export class WlPaymentProductFieldCardNumber extends WlFieldElement {
  static formAssociated = true;

  @state() private _paymentProduct?: PaymentProduct;
  @state() private _coBrandPaymentProducts: PaymentProduct[] = [];
  @query('wl-input') private _input!: WlInput;

  #sessionController = new SessionController(this);

  #unsubscribePaymentProductUpdate?: ReturnType<
    SessionController['subscribeToPaymentProductUpdate']
  >;

  #updateSupportedPaymentItemsTask = new Task(this, {
    args: () => [this.value],
    onError: (error) => {
      if (error instanceof ResponseError && error.status === 403) {
        return this.#sessionController.clearSession();
      }

      // the validation rules will already define the validity of the input
      // if the validation rules succeeded, but this error occurred,
      // we need to set the validity to `invalid creditcard number`
      if (this._input.validity.valid) {
        this._input.setCustomValidity('Invalid creditcard number');
      }

      // reset
      this._paymentProduct = undefined;
      if (this._coBrandPaymentProducts.length) {
        this._coBrandPaymentProducts = [];
      }

      // to prevent spamming console errors, we omit messages from the `getIinDetails` call
      const omitConsoleError =
        error instanceof IinDetailsResponseError ||
        (error instanceof ResponseError && error.status === 404);

      if (!omitConsoleError) console.error(error);
    },
    task: async ([value]) => {
      // prevent calling iin details when field is not interactive
      if (this.disabled || this.readonly) return;

      const { session, paymentDetails } = this.#sessionController;
      if (!(session && paymentDetails && value)) return;

      // get iin details
      const iinDetails = await session.getIinDetails(value, paymentDetails);

      // if the card is not supported, we need to set the validity of the input
      if (iinDetails.status !== IinDetailsStatus.SUPPORTED) {
        this._coBrandPaymentProducts = [];
        if (this._input.validity.valid) {
          this._input.setCustomValidity('This creditcard is not supported');
        }
        return;
      }

      // if the card is supported, we need to fetch the main payment item
      // @note: this payment product will be added to the payment request
      // in the lifecycle WlFieldCardNumber.willUpdate
      this._paymentProduct = await session.getPaymentProduct(
        iinDetails.paymentProductId,
        paymentDetails,
      );

      if (!iinDetails.coBrands) {
        this._coBrandPaymentProducts = [];
        return;
      }

      // set co-brand payment products
      this._coBrandPaymentProducts = await Promise.all(
        iinDetails.coBrands
          .filter((json) => json.isAllowedInContext)
          .map((json) =>
            session.getPaymentProduct(json.paymentProductId, paymentDetails),
          ),
      );
    },
  });

  connectedCallback() {
    super.connectedCallback();

    // set initial payment product from current payment request
    const session = this.#sessionController.session;
    this._paymentProduct ??= session?.getPaymentRequest()?.getPaymentProduct();

    // subscribe to updates for payment product in session payment request
    this.#unsubscribePaymentProductUpdate =
      this.#sessionController.subscribeToPaymentProductUpdate(
        (paymentProduct) => (this._paymentProduct = paymentProduct),
      );
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#unsubscribePaymentProductUpdate?.();
  }

  willUpdate(changedProperties: PropertyValues) {
    super.willUpdate(changedProperties);
    if (changedProperties.has('_paymentProduct') && this._paymentProduct) {
      this.#sessionController.setPaymentProduct(this._paymentProduct);
    }
  }

  /**
   * Callback handler
   * Set the payment product to the selected co-brand payment product
   */
  @eventOptions({ passive: true, capture: true })
  private _onPaymentProductChange(e: Event) {
    const option = e.target as WlDropdownOption;
    this._paymentProduct = this._coBrandPaymentProducts.find(
      ({ id }) => id === Number(option.value),
    );

    // Update payment product to payment request and inform all listeners
    if (this._paymentProduct) {
      this.#sessionController.setPaymentProduct(this._paymentProduct);
    }
  }

  /**
   * Render a single dropdown option of a co-brand payment product
   */
  #renderCoBrandDropdownOption(product: PaymentProduct) {
    const isSelected = product.id === this._paymentProduct?.id;
    const { logo, label } = product.displayHints;
    const suffixIcon = () =>
      html`<wl-icon-check
        class="w-6 h-6 text-green-600"
        slot="suffix"
      ></wl-icon-check>`;

    return html`<wl-dropdown-option value=${product.id} .selected=${isSelected}>
      <span slot="prefix">
        <img src="${logo}?size=37x37" alt="${label}" />
      </span>
      ${label} ${when(isSelected, suffixIcon)}
    </wl-dropdown-option>`;
  }

  render() {
    if (!this.paymentProductField) {
      throw new Error(
        `fieldData should be set to render <wl-payment-product-field-card-number> correctly`,
      );
    }

    const { displayHints, dataRestrictions, id } = this.paymentProductField;
    const icon = this.renderIcon();
    const tooltip = this.renderTooltip();

    return html`
      <wl-form-field
        label=${displayHints?.label}
        ?required=${dataRestrictions?.isRequired}
        ?disabled=${this.disabled || this.loading}
      >
        <wl-input
          ?disabled=${this.disabled || this.additionalInputProps?.disabled}
          ?readonly=${this.readonly || this.additionalInputProps?.readonly}
          inputmode=${ifDefined(
            this.additionalInputProps?.inputmode ?? this.inputMode,
          )}
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
          <span slot="suffix" class="text-gray-500">
            ${this.#updateSupportedPaymentItemsTask.render({
              pending: () => html`<wl-loading-spinner></wl-loading-spinner>`,
              complete: () => {
                if (!this._paymentProduct) return;
                const label = this._paymentProduct.displayHints?.label;
                const logo = this._paymentProduct.displayHints?.logo;
                return html`<img src="${logo}?size=37x37" alt="${label}" />`;
              },
            })}
            ${tooltip}
          </span>
        </wl-input>

        ${when(
          this._coBrandPaymentProducts.length > 0,
          () => html`
            <wl-dropdown @change=${this._onPaymentProductChange} tabindex="-1">
              <span class="underline text-sm" slot="button-label">
                Multiple payment options detected
              </span>
              ${map(
                this._coBrandPaymentProducts,
                this.#renderCoBrandDropdownOption.bind(this),
              )}
            </wl-dropdown>
          `,
        )}
      </wl-form-field>
    `;
  }
}
