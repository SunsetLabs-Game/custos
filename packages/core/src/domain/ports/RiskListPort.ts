import type { Address, AddressReputation } from "../entities/Address.js";

/**
 * Implemented by adapters-p2p (Hyperswarm/Pears) for the stretch goal, and by
 * a local-only in-memory/disk cache otherwise — AnalyzeSendIntent doesn't
 * care which. Local-only is a valid implementation of this port; it just
 * means `sync` is a no-op.
 */
export interface RiskListPort {
  lookup(address: Address): Promise<AddressReputation>;
  reportScam(address: Address): Promise<void>;
  sync(): Promise<void>;
}
