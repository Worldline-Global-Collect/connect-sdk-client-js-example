import type { Context } from '@/context';
import type { Field } from '@/types';

import { html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { when } from 'lit/directives/when.js';
import { map } from 'lit/directives/map.js';
import { Task, TaskStatus } from '@lit/task';

// data for rendering the fields
import sessionDetailsFields from './data/session-details-fields.json' assert { type: 'json' };
import paymentContextFields from './data/payment-context-fields.json' assert { type: 'json' };
import paymentDetailsCheckboxes from './data/payment-details-checkboxes.json' assert { type: 'json' };

import { TailwindElement } from '@/mixins';
import { WlInput } from '@/elements';
import { RouteViewComponentName } from '@/routes';

type ProcessFormResponse = NonNullable<Context>;

/**
 * Ignore errors being thrown by `ApplePaySession.canMakePayments()`
 */
function isApplePayAvailable(): boolean {
  try {
    return (
      Object.hasOwn(window, 'ApplePaySession') &&
      ApplePaySession.canMakePayments()
    );
  } catch (err) {
    return false;
  }
}

/**
 * Render payment detail field
 * When Apple Pay is not available, disable Apple Pay related fields
 */
function paymentDetailField(field: Field) {
  const { component, name } = field;
  const isApplePayCheckBox = component === 'checkbox' && name === 'applePay';
  if (!(isApplePayCheckBox && !isApplePayAvailable())) return field;

  field.alert = `
    Apple Pay is not available in this browser. 
    For more information on how to use Apple Pay on the web, read the 
    <a 
      class="underline text-red-700 font-semibold" 
      href="https://developer.apple.com/documentation/apple_pay_on_the_web/#2110131" 
      target="_blank" 
      rel="noreferrer noopener"
    >
      Apple Pay requirements
    </a>.
  `;

  field.fields = field.fields?.map((f) => ({ ...f, disabled: true }));
  return field;
}

/**
 * Renders the form for retrieving the session- and payment details
 * + some additional data for the payment and dispatch this data as event `context`
 * which is caught in the `wl-view` and used to navigate to the next view.
 */
@customElement('wl-view-details')
export class WlViewDetailsForm extends TailwindElement {
  #processForm = new Task<[Record<string, string>], ProcessFormResponse>(this, {
    autoRun: false,
    onError: console.error,
    onComplete: (context) => {
      const eventOptions = { bubbles: true, composed: true };
      const contextEvent = new CustomEvent('context', {
        ...eventOptions,
        detail: context,
      });
      const viewUpdateEvent = new CustomEvent('view-update', {
        ...eventOptions,
        detail: { view: RouteViewComponentName.PaymentMethodSelection },
      });
      this.dispatchEvent(contextEvent);
      this.dispatchEvent(viewUpdateEvent);
    },
    task: async ([context]) => ({
      groupPaymentProducts: !!context.groupPaymentProducts,
      googlePay: context.googlePay === 'on',
      applePay: context.applePay === 'on',
      gatewayMerchantId: context.gatewayMerchantId,
      merchantId: context.merchantId,
      merchantName: context.merchantName,
      sessionDetails: {
        clientSessionId: context.clientSessionId,
        assetUrl: context.assetUrl,
        clientApiUrl: context.clientApiUrl,
        customerId: context.customerId,
      },
      paymentDetails: {
        totalAmount: Number(context.totalAmount),
        countryCode: context.countryCode,
        currency: context.currency,
        locale: context.locale,
        isRecurring: context.isRecurring === 'on',
      },
    }),
  });

  protected createRenderRoot() {
    return this;
  }

  #onSubmit(e: Event) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget as HTMLFormElement);
    const data = Object.fromEntries(fd.entries()) as Record<string, string>;
    this.#processForm.run([data]).catch(console.error);
  }

  #parseFieldValues(context: Partial<Context>) {
    const _parseField = (name: string, value: unknown) => {
      const query = `wl-input[name="${name}"], select[name="${name}"], input[type="checkbox"][name="${name}"], input[type="radio"][name="${name}"][value="${value}"]`;
      const input = this.renderRoot.querySelector<
        WlInput | HTMLSelectElement | HTMLInputElement
      >(query);
      if (!input) return;

      if (input instanceof HTMLInputElement) {
        input.checked = !!value;
        input.dispatchEvent(new Event('change'));
      } else {
        input.value = value as string;
      }
    };

    // session details
    if (context.sessionDetails) {
      const entries: Array<[string, string]> = Object.entries(
        context.sessionDetails,
      );
      entries.forEach(([k, v]) => _parseField(k, v));
    }

    // payment details
    if (context.paymentDetails) {
      const entries = Object.entries(context.paymentDetails);
      entries.forEach(([k, v]) => _parseField(k, v));
    }

    ['groupPaymentProducts', 'paymentType'].forEach((k) => {
      if (!(k in context)) return;
      _parseField(k, context[k as keyof typeof context]);
    });
  }

  #onPasteJSONResponse(e: CustomEvent) {
    const fd = new FormData(e.detail as HTMLFormElement);
    const clientSessionJsonResponse = fd.get('clientSessionJsonResponse');
    if (typeof clientSessionJsonResponse !== 'string') return;
    try {
      const context = { sessionDetails: JSON.parse(clientSessionJsonResponse) };
      this.#parseFieldValues(context);
    } catch (err) {
      console.error(err);
    }
  }

  protected firstUpdated() {
    const cache = sessionStorage.getItem('context');
    if (!cache) return;
    try {
      setTimeout(() => this.#parseFieldValues(JSON.parse(cache)), 0);
    } catch (err) {
      console.error(err);
    }
  }

  #renderFields(fields: Field[]) {
    const disabled = this.#processForm.status === TaskStatus.PENDING;
    return map(
      fields.map((field) => ({ ...field, disabled })),
      (field) => html`<wl-data-field .data=${field}></wl-data-field>`,
    );
  }

  render() {
    const isPending = this.#processForm.status === TaskStatus.PENDING;
    const error = this.#processForm.error;

    return html`
      <form @submit=${this.#onSubmit} class="flex flex-col gap-8">
        <div class="flex flex-col gap-2 text-pretty">
          <wl-alert>
            <p>
              To process the payment using the services provided by Worldline
              Global Collect, the following information must be provided as a
              merchant. After providing the information requested below, this
              example can process a payment.
            </p>
          </wl-alert>
        </div>

        ${when(
          error instanceof Error,
          () =>
            html`<div class="text-red-500">${(error as Error).message}</div>`,
        )}

        <div class="flex flex-col md:flex-row gap-8 md:[&>*]:basis-1/2">
          <fieldset class="flex flex-col gap-4 flex-grow">
            <legend class="text-2xl font-bold leading-none mb-4">
              Client session details
            </legend>
            ${this.#renderFields(sessionDetailsFields as Field[])}
            <wl-dialog-confirm
              submit-label="Use JSON Response"
              dialog-title="Paste JSON"
              @submit=${this.#onPasteJSONResponse}
            >
              <wl-button
                type="button"
                slot="summary"
                variant="secondary"
                size="xs"
                title="Paste JSON Response from server"
                class="w-fit flex ml-auto md:inline-flex"
                ?disabled=${isPending}
                >Paste client session JSON response</wl-button
              >
              <div class="flex flex-col gap-4">
                <p class="text-pretty text-gray-600">
                  Please paste the full JSON response body as received via the
                  <span class="text-nowrap">"Create Client Session API."</span>
                </p>
                <wl-form-field label="Client Session JSON response">
                  <textarea
                    autofocus
                    required
                    name="clientSessionJsonResponse"
                    title="Client Session JSON Response"
                    id="textarea-session-details-json-response"
                    cols="50"
                    rows="15"
                    class="text-gray-500 text-sm border border-gray-300 rounded-md w-full p-4 font-mono"
                  ></textarea>
                </wl-form-field>
              </div>
            </wl-dialog-confirm>
          </fieldset>

          <fieldset class="flex flex-col gap-4 flex-grow">
            <legend class="text-2xl font-bold leading-none mb-4">
              Payment details
            </legend>
            ${this.#renderFields(paymentContextFields as Field[])}

            <div class="flex flex-col gap-1">
              ${this.#renderFields(
                (paymentDetailsCheckboxes as Field[]).map(paymentDetailField),
              )}
            </div>
          </fieldset>
        </div>

        <wl-button
          .loading=${isPending}
          ?disabled=${isPending}
          class="text-lg md:w-fit md:mx-auto md:mt-8"
        >
          Start secure payment
        </wl-button>
      </form>
    `;
  }
}
