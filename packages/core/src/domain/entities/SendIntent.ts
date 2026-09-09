import type { Address } from "./Address.js";
import type { ChatMessage } from "./ChatMessage.js";

/**
 * What the user is about to do, captured before WDK is asked to build and
 * sign anything. This is the object AnalyzeSendIntent operates on.
 */
export interface SendIntent {
  readonly destination: Address;
  readonly amountUsdt: number;
  /** Pasted scam-chat context, if the user provided any. Optional — address-only checks still run. */
  readonly context?: ChatMessage;
}

export type SendDecision =
  | { readonly kind: "proceed" }
  | { readonly kind: "proceed-with-acknowledged-risk" }
  | { readonly kind: "cancelled" };
