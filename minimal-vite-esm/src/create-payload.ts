import type { CreatePayloadProps } from "./types";

import { promiseWithError } from "./promise-with-error";
import { getSupportedIinDetails } from "./get-supported-iin-details";

export async function createPayload(props: CreatePayloadProps) {
  const { session, cardNumber, paymentDetails } = props;

  // get payment product from IIN details
  const { paymentProductId } = await getSupportedIinDetails(props);
  const paymentProduct = await promiseWithError(
    () => session.getPaymentProduct(paymentProductId, paymentDetails),
    "Failed getting payment product, check your credentials",
  );

  // update session payment request instance
  const paymentRequest = session.getPaymentRequest();
  paymentRequest.setPaymentProduct(paymentProduct);
  paymentRequest.setValue("cardNumber", cardNumber);
  paymentRequest.setValue("cvv", "123");
  paymentRequest.setValue("expiryDate", "04/25");
  paymentRequest.setValue("cardholderName", "John Doe");

  // validate payment request
  const errors = paymentRequest.validate();
  if (errors.length) {
    errors.forEach(({ errorMessageId, fieldId }) =>
      console.error(`Validation error ${fieldId}: ${errorMessageId}`),
    );
    return;
  }

  // encrypt the payment request
  const encryptor = session.getEncryptor();
  return promiseWithError(
    () => encryptor.encrypt(paymentRequest),
    "Failed encrypting the payload, check your credentials",
  );
}
