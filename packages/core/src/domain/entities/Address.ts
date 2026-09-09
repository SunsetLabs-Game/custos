export type ChainNetwork = "tron" | "ethereum" | "other";

export interface Address {
  readonly value: string;
  readonly network: ChainNetwork;
}

export interface AddressReputation {
  readonly address: Address;
  /** true if this address is present in the local risk cache (self-reported or P2P-synced). */
  readonly flagged: boolean;
  /** how the flag entered the local cache — provenance matters for trust. */
  readonly source: "local-user-report" | "p2p-sync" | "none";
  readonly firstSeenAt?: Date;
}
