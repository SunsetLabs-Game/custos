import type { RiskListPort, Address, AddressReputation, ScamReportReason } from "@custos/core";

interface FlaggedEntry {
  readonly firstSeenAt: Date;
  readonly source: "local-user-report" | "p2p-sync";
  /** Why it was flagged. Undefined for reports made before reasons existed. */
  readonly reason?: ScamReportReason;
  /**
   * The address exactly as reported. The map key is lowercased for
   * case-insensitive lookup, but Tron base58 is case-sensitive, so the
   * original casing has to be kept for display.
   */
  readonly address: Address;
}

export interface FlaggedAddress {
  readonly address: Address;
  readonly source: "local-user-report" | "p2p-sync";
  readonly firstSeenAt: Date;
  readonly reason?: ScamReportReason;
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

  async reportScam(address: Address, reason?: ScamReportReason): Promise<void> {
    this.recordReport(address, "local-user-report", new Date(), reason);
  }

  async sync(): Promise<void> {
    // no-op — see HyperswarmRiskListAdapter for the P2P-backed implementation.
  }

  /** Every address currently in the cache, newest first. */
  list(): readonly FlaggedAddress[] {
    return [...this.flagged.values()]
      .map((entry) => ({
        address: entry.address,
        source: entry.source,
        firstSeenAt: entry.firstSeenAt,
        reason: entry.reason,
      }))
      .sort((a, b) => b.firstSeenAt.getTime() - a.firstSeenAt.getTime());
  }

  /**
   * Exposed so HyperswarmRiskListAdapter can persist peer-sourced reports
   * into the same cache without claiming they're the local user's own
   * report. A local report is never downgraded by a later peer report for
   * the same address — provenance of the more-trusted source sticks.
   */
  recordReport(
    address: Address,
    source: "local-user-report" | "p2p-sync",
    at: Date = new Date(),
    reason?: ScamReportReason,
  ): void {
    const key = this.key(address);
    const existing = this.flagged.get(key);
    if (existing?.source === "local-user-report") return;
    this.flagged.set(key, {
      firstSeenAt: existing?.firstSeenAt ?? at,
      source,
      address: existing?.address ?? address,
      reason: reason ?? existing?.reason,
    });
  }

  private key(address: Address): string {
    return `${address.network}:${address.value.toLowerCase()}`;
  }
}
