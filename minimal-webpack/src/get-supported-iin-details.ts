import type { CreatePayloadProps } from "./types";

import {
  IinDetailsStatus,
  IinDetailsResponseError,
  ResponseError,
} from "connect-sdk-client-js";

const errorMessage = new Map([
  [IinDetailsStatus.UNKNOWN, "Unknown error"],
  [
    IinDetailsStatus.NOT_ENOUGH_DIGITS,
    "Card number does not contains enough digits",
  ],
]);

async function getIinDetails({
  session,
  paymentDetails,
  cardNumber,
}: CreatePayloadProps) {
  const iinDetailsResponse = await session.getIinDetails(
    cardNumber,
    paymentDetails,
  );
  if (iinDetailsResponse.status !== IinDetailsStatus.SUPPORTED) {
    throw new Error(`Failed getting IinDetails, check your credentials`);
  }
  return iinDetailsResponse;
}

/**
 * Get IIN details where status is SUPPORTED
 * And throw correct error messages if promise is rejected
 */
export async function getSupportedIinDetails(props: CreatePayloadProps) {
  try {
    return await getIinDetails(props);
  } catch (err) {
    if (err instanceof IinDetailsResponseError) {
      throw new Error(`Card check error: ${errorMessage.get(err.status)}`);
    }
    if (err instanceof ResponseError) {
      throw new Error(`Failed getting IinDetails, check your credentials`);
    }
    throw err;
  }
}
