import { type PaymentDetails, type Session } from "connect-sdk-client-js";

export type CreatePayloadProps = {
  session: Session;
  cardNumber: string;
  paymentDetails: PaymentDetails;
};
