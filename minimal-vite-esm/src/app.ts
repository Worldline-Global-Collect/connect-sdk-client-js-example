import {
  type PaymentDetails,
  type SessionDetails,
  Session,
} from "connect-sdk-client-js";
import { createPayload } from "./create-payload";

const root = document.querySelector<HTMLDivElement>("#app")!;

const sessionDetails: SessionDetails = {
  assetUrl: import.meta.env.VITE_ASSET_URL,
  clientApiUrl: import.meta.env.VITE_CLIENT_API_URL,
  clientSessionId: import.meta.env.VITE_CLIENT_SESSION_ID,
  customerId: import.meta.env.VITE_CUSTOMER_ID,
};

const paymentDetails: PaymentDetails = {
  totalAmount: 10_000,
  countryCode: "NL",
  locale: "nl_NL",
  currency: "EUR",
  isRecurring: false,
};

try {
  root.innerHTML = `Processing...`;

  const paymentHash = await createPayload({
    session: new Session(sessionDetails),
    cardNumber: "4567 3500 0042 7977",
    paymentDetails,
  });

  root.innerHTML = `Encrypted to: ${paymentHash}`;
} catch (err) {
  console.error(err);
  if (err instanceof Error) {
    root.innerHTML = err.message;
  }
}
