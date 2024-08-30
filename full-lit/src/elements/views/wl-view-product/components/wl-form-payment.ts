import type { PropertyValues } from 'lit';
import type { AccountOnFile, PaymentProductField } from 'connect-sdk-client-js';
import type { PaymentProductFieldElement } from '@/types';
import type { WlInput } from '@/elements';

import { html } from 'lit';
import { customElement, eventOptions, property } from 'lit/decorators.js';
import { when } from 'lit/directives/when.js';
import { Task, TaskStatus } from '@lit/task';
import { EncryptError } from 'connect-sdk-client-js';

import { TailwindElement } from '@/mixins';
import { renderPaymentProductFields } from '@/elements';
import { SessionController } from '@/controllers';

import rememberCheckboxData from '../data/checkbox-remember.json' assert { type: 'json' };
import { RouteViewComponentName } from '@/routes';

@customElement('wl-form-payment')
export class WlFormPayment extends TailwindElement {
  #sessionController = new SessionController(this);
  #unsubscribePaymentProductUpdate?: ReturnType<
    SessionController['subscribeToPaymentProductUpdate']
  >;

  /**
   * Encrypt payload task
   */
  #encryptTask = new Task<[Record<string, string>, boolean], string>(this, {
    autoRun: false,
    onError: console.error,
    onComplete: (payload) => {
      this.dispatchEvent(
        new CustomEvent('view-update', {
          bubbles: true,
          composed: true,
          detail: {
            view: RouteViewComponentName.EncryptedPayload,
            params: { payload },
          },
        }),
      );
    },
    task: async ([data, remember = false]) => {
      try {
        return this.#sessionController.encryptPaymentRequest(data, remember);
      } catch (err) {
        if (err instanceof EncryptError) {
          err.validationErrors.forEach(({ fieldId }) =>
            this.#forceValidateFieldById(fieldId),
          );
        }
        throw err;
      }
    },
  });

  /**
   * disable/enable fields based in encrypt task status
   */
  #fieldsDisabledTask = new Task(this, {
    args: () => [this.#encryptTask.status],
    task: ([status]) => {
      this.fieldElements?.forEach((field) => {
        field.loading = status === TaskStatus.PENDING;
      });
    },
  });

  /**
   * List of payment product field elements
   */
  fieldElements?: PaymentProductFieldElement[];

  /**
   * Payment product fields data
   * The `fieldElements` are rendered based on this data
   */
  @property() paymentProductFields?: PaymentProductField[];

  /**
   * Optional account on file data
   * If set, the form will be pre-filled with the account on file data
   */
  @property({ type: Object }) accountOnFile?: AccountOnFile;

  /**
   * If set to true, the form will automatically tokenize the payment request
   */
  @property({ type: Boolean, attribute: 'auto-tokenized' })
  autoTokenized?: boolean;

  /**
   * If set to true, the form will allow tokenization
   */
  @property({ type: Boolean, attribute: 'allows-tokenization' })
  allowsTokenization?: boolean;

  /**
   * Subscribe to payment product updates
   * and set the payment product fields accordingly
   */
  connectedCallback() {
    super.connectedCallback();
    this.#unsubscribePaymentProductUpdate =
      this.#sessionController.subscribeToPaymentProductUpdate(
        (paymentProduct) => {
          this.paymentProductFields = paymentProduct.paymentProductFields;
        },
      );
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#unsubscribePaymentProductUpdate?.();
  }

  protected createRenderRoot() {
    return this;
  }

  /**
   * Force validate input field by field id
   * This will force running all validation rules for the given field
   */
  #forceValidateFieldById(fieldId: string) {
    const fieldElement = this.fieldElements?.find(
      (f) => f.paymentProductField.id === fieldId,
    );
    if (!fieldElement) throw new Error(`Field with id ${fieldId} not found`);
    const input = fieldElement.querySelector<WlInput>('wl-input');
    if (!input) throw new Error(`Input field with id ${fieldId} not found`);
    fieldElement!.validate(input);
  }

  /**
   * Returns new field elements where the given payment product
   * fields are merged into the existing field elements
   */
  #mergePaymentProductFieldsInFieldElements(
    paymentProductFields: PaymentProductField[],
  ): PaymentProductFieldElement[] {
    if (!this.fieldElements) {
      throw new Error(
        'Can not merge payment product fields in field elements, field elements is not set yet.',
      );
    }

    // create map/set for lookup and comparison
    const ppfMap = Map.groupBy(paymentProductFields, (field) => field.id);
    const feIds = new Set(
      this.fieldElements.map(
        ({ paymentProductField }) => paymentProductField.id,
      ),
    );
    const ppfIds = new Set(paymentProductFields.map(({ id }) => id));

    // update existing fields
    this.fieldElements = this.fieldElements
      .filter(({ paymentProductField }) => ppfIds.has(paymentProductField.id))
      .map((fe) => {
        fe.paymentProductField = ppfMap.get(fe.paymentProductField.id)![0];
        return fe;
      });

    // add new fields
    const newFields = paymentProductFields
      .filter(({ id }) => !feIds.has(id))
      .map((_ppf) => {
        return renderPaymentProductFields([_ppf])[0];
      });

    // sort by displayOrder
    return [...this.fieldElements, ...newFields].toSorted(
      (
        { paymentProductField: { displayHints: a } },
        { paymentProductField: { displayHints: b } },
      ) => {
        return (a?.displayOrder ?? 0) - (b?.displayOrder ?? 0);
      },
    );
  }

  /**
   * Update field elements to apply AccountOnFile attributes
   * such as value, disabled and readonly properties
   */
  #applyAccountOnFileToFieldElements() {
    const attributes = this.accountOnFile?.attributes || [];
    for (const { key, status, value } of attributes) {
      const fieldElement = this.fieldElements?.find(
        (fieldElement) => fieldElement.paymentProductField.id === key,
      );
      if (!fieldElement) continue;

      const isReadonly = status === 'READ_ONLY';
      const isWriteable = this.#fieldIsWriteable(key);

      fieldElement.readonly = isReadonly;
      fieldElement.disabled = !isWriteable && !isReadonly;
      fieldElement.value = isWriteable
        ? fieldElement.paymentProductField.applyMask(value).formattedValue
        : fieldElement.paymentProductField.applyWildcardMask(value)
            .formattedValue;
    }
  }

  /**
   * Lifecycle hook
   * Update field elements and handle "account on file"
   */
  protected willUpdate(changedProperties: PropertyValues) {
    super.willUpdate(changedProperties);
    const session = this.#sessionController.session;
    const ppf = this.paymentProductFields;

    if (changedProperties.has('paymentProductFields') && ppf) {
      this.fieldElements = !this.fieldElements
        ? renderPaymentProductFields(ppf)
        : this.#mergePaymentProductFieldsInFieldElements(ppf);
    }

    if (changedProperties.has('accountOnFile') && this.accountOnFile) {
      this.#applyAccountOnFileToFieldElements();
      session?.getPaymentRequest().setAccountOnFile(this.accountOnFile);
    }
  }

  /**
   * Focus the first interactive field when the form is rendered
   * @note: Normally we should use the attribute "autofocus" but
   * this works only on page load, not on dynamic content
   */
  firstUpdated(changedProperties: PropertyValues) {
    super.firstUpdated(changedProperties);
    setTimeout(() => {
      const fieldElement = this.fieldElements?.find(
        ({ readonly, disabled }) => !(readonly || disabled),
      );
      const input = fieldElement?.querySelector<WlInput>('wl-input');
      if (input) input.focus();
    }, 0);
  }

  /**
   * Returns true if field is writeable
   */
  #fieldIsWriteable(fieldId: string): boolean {
    // lookup field map by field id
    const fieldMap = Map.groupBy(
      this.fieldElements || [],
      (field) => field.paymentProductField.id,
    );

    // lookup AccountOnFile attribute map by field id
    const accountAttributeMap = Map.groupBy(
      this.accountOnFile?.attributes || [],
      (attr) => attr.key,
    );

    const field = fieldMap.get(fieldId)?.[0];
    const attribute = accountAttributeMap.get(fieldId)?.[0];

    return attribute
      ? ['CAN_WRITE', 'MUST_WRITE'].includes(attribute.status)
      : !field?.disabled;
  }

  @eventOptions({ capture: true })
  private _onSubmit(event: SubmitEvent) {
    event.preventDefault();
    event.stopPropagation();
    const fd = new FormData(event.target as HTMLFormElement);
    const { remember, ...data } = Object.fromEntries(
      Array.from(fd.entries()).filter(([k]) => this.#fieldIsWriteable(k)),
    ) as Record<string, string>;
    this.#encryptTask.run([data, !!remember]).catch(console.error);
  }

  /**
   * Returns true, whether the "remember me" checkbox should be shown
   */
  #showRememberMe(): boolean {
    const isRecurring = !!this.#sessionController.paymentDetails?.isRecurring;
    return !isRecurring && !!this.allowsTokenization && !this.autoTokenized;
  }

  render() {
    const encryptPending = this.#encryptTask.status === TaskStatus.PENDING;
    const showRememberMe = this.#showRememberMe();

    return html`<form
      class="flex flex-col gap-8 max-w-xl mx-auto"
      @submit=${this._onSubmit}
    >
      <fieldset class="grid gap-4">${this.fieldElements}</fieldset>
      ${when(
        showRememberMe,
        () =>
          html`<wl-data-field .data=${rememberCheckboxData}></wl-data-field>`,
      )}
      <div class="flex flex-col gap-4">
        <wl-button
          type="submit"
          ?loading=${encryptPending}
          ?disabled=${encryptPending}
        >
          Pay now
        </wl-button>
        <wl-link
          href="/"
          class="w-fit self-center"
          class-anchor="px-2 hover:underline"
          >Cancel</wl-link
        >
      </div>
    </form>`;
  }
}
