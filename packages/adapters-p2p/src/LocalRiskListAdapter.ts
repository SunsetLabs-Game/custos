import type { RiskListPort, Address, AddressReputation } from "@custos/core";

/**
 * Local-only implementation of RiskListPort — no network, no Hyperswarm.
 * This is a fully valid MVP implementation (RiskListPort.sync is allowed to
 * be a no-op) and is what apps/web should use until HyperswarmRiskListAdapter
 * is wired up. Keeps the app demoable even if the P2P stretch goal slips.
 */
export class LocalRiskListAdapter implements RiskListPort {
  private readonly flagged = new Map<string, Date>();

  async lookup(address: Address): Promise<AddressReputation> {
    const firstSeenAt = this.flagged.get(this.key(address));
    return {
      address,
      flagged: firstSeenAt !== undefined,
      source: firstSeenAt !== undefined ? "local-user-report" : "none",
      firstSeenAt,
    };
  }

  async reportScam(address: Address): Promise<void> {
    this.flagged.set(this.key(address), new Date());
  }

  async sync(): Promise<void> {
    // no-op — see HyperswarmRiskListAdapter for the P2P-backed implementation.
  }

  private key(address: Address): string {
    return `${address.network}:${address.value.toLowerCase()}`;
  }
}
