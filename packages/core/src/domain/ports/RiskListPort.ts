import type { Address, AddressReputation } from "../entities/Address.js";

/**
 * Implemented by adapters-p2p (Hyperswarm/Pears) for the stretch goal, and by
 * a local-only in-memory/disk cache otherwise — AnalyzeSendIntent doesn't
 * care which. Local-only is a valid implementation of this port; it just
 * means `sync` is a no-op.
 */
/**
 * Why an address was flagged. Carried with the report so a peer receiving it
 * — or the user reviewing their own list later — can judge the claim instead
 * of seeing a bare address with no justification.
 */
export interface ScamReportReason {
  /** Scam category when the report came from an assessment, else "manual". */
  readonly category: string;
  /** Human-readable cause, in the reporter's words or the detector's. */
  readonly detail: string;
}

export interface RiskListPort {
  lookup(address: Address): Promise<AddressReputation>;
  reportScam(address: Address, reason?: ScamReportReason): Promise<void>;
  sync(): Promise<void>;
}
