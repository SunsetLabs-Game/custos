import { describe, expect, it } from "vitest";
import type { Address } from "@custos/core";
import { LocalRiskListAdapter } from "../LocalRiskListAdapter.js";

const address: Address = { value: "TXyzScamAddress000000000000000000", network: "tron" };

describe("LocalRiskListAdapter", () => {
  it("reports an address as not flagged until reportScam is called", async () => {
    const adapter = new LocalRiskListAdapter();
    expect((await adapter.lookup(address)).flagged).toBe(false);

    await adapter.reportScam(address);
    const reputation = await adapter.lookup(address);
    expect(reputation.flagged).toBe(true);
    expect(reputation.source).toBe("local-user-report");
    expect(reputation.firstSeenAt).toBeInstanceOf(Date);
  });

  it("looks up by network:value regardless of address casing", async () => {
    const adapter = new LocalRiskListAdapter();
    await adapter.reportScam({ value: "0xABCDEF0123456789abcdef0123456789ABCDEF01", network: "ethereum" });
    const reputation = await adapter.lookup({
      value: "0xabcdef0123456789ABCDEF0123456789abcdef01",
      network: "ethereum",
    });
    expect(reputation.flagged).toBe(true);
  });

  it("records a peer-sourced report via recordReport with source p2p-sync", async () => {
    const adapter = new LocalRiskListAdapter();
    adapter.recordReport(address, "p2p-sync");
    const reputation = await adapter.lookup(address);
    expect(reputation.flagged).toBe(true);
    expect(reputation.source).toBe("p2p-sync");
  });

  it("never downgrades a local report's provenance when a later peer report arrives", async () => {
    const adapter = new LocalRiskListAdapter();
    await adapter.reportScam(address);
    adapter.recordReport(address, "p2p-sync");
    expect((await adapter.lookup(address)).source).toBe("local-user-report");
  });
});
