import type { RiskListPort, Address, AddressReputation } from "@custos/core";

interface FlaggedEntry {
  readonly firstSeenAt: Date;
  readonly source: "local-user-report" | "p2p-sync";
}

/**
 * Local-only implementation of RiskListPort — no network, no Hyperswarm.
 * This is a fully valid MVP implementation (RiskListPort.sync is allowed to
 * be a no-op) and is what apps/web should use until HyperswarmRiskListAdapter
 * is wired up. Keeps the app demoable even if the P2P stretch goal slips.
 */
export class LocalRiskListAdapter implements RiskListPort {
  private readonly flagged = new Map<string, FlaggedEntry>();

  async lookup(address: Address): Promise<AddressReputation> {
    const entry = this.flagged.get(this.key(address));
    return {
      address,
      flagged: entry !== undefined,
      source: entry?.source ?? "none",
      firstSeenAt: entry?.firstSeenAt,
    };
  }

  async reportScam(address: Address): Promise<void> {
    this.recordReport(address, "local-user-report");
  }

  async sync(): Promise<void> {
    // no-op — see HyperswarmRiskListAdapter for the P2P-backed implementation.
  }

  /**
   * Exposed so HyperswarmRiskListAdapter can persist peer-sourced reports
   * into the same cache without claiming they're the local user's own
   * report. A local report is never downgraded by a later peer report for
   * the same address — provenance of the more-trusted source sticks.
   */
  recordReport(address: Address, source: "local-user-report" | "p2p-sync", at: Date = new Date()): void {
    const key = this.key(address);
    const existing = this.flagged.get(key);
    if (existing?.source === "local-user-report") return;
    this.flagged.set(key, { firstSeenAt: existing?.firstSeenAt ?? at, source });
  }

  private key(address: Address): string {
    return `${address.network}:${address.value.toLowerCase()}`;
  }
}
