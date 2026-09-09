import type { SendIntent } from "../entities/SendIntent.js";

export interface PreparedTransfer {
  readonly id: string;
  readonly intent: SendIntent;
  /** Opaque handle the adapter uses internally to actually sign/broadcast. */
  readonly handle: unknown;
}

/**
 * Implemented by adapters-wdk. `prepare` builds but does not sign — this is
 * the seam where AnalyzeSendIntent's risk assessment must run before `commit`
 * is ever called, so the friction/block screen sits strictly between the two.
 */
export interface WalletPort {
  prepare(intent: SendIntent): Promise<PreparedTransfer>;
  commit(transfer: PreparedTransfer): Promise<{ readonly txHash: string }>;
}
