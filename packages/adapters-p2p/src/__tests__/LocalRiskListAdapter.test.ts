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

describe("list", () => {
  it("preserves the original address casing (Tron base58 is case-sensitive)", async () => {
    const adapter = new LocalRiskListAdapter();
    const address = { value: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t", network: "tron" } as const;
    await adapter.reportScam(address);

    expect(adapter.list()).toHaveLength(1);
    expect(adapter.list()[0]!.address.value).toBe("TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t");
  });

  it("still looks up case-insensitively", async () => {
    const adapter = new LocalRiskListAdapter();
    await adapter.reportScam({ value: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t", network: "tron" });

    const lower = await adapter.lookup({ value: "tr7nhqjekqxgtci8q8zy4pl8otszgjlj6t", network: "tron" });
    expect(lower.flagged).toBe(true);
  });
});

describe("report reasons", () => {
  it("keeps the cause so a flagged address can be audited later", async () => {
    const adapter = new LocalRiskListAdapter();
    const address = { value: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t", network: "tron" } as const;

    await adapter.reportScam(address, {
      category: "pig-butchering",
      detail: 'Detectado en el análisis: "% diario"',
    });

    const [entry] = adapter.list();
    expect(entry!.reason?.category).toBe("pig-butchering");
    expect(entry!.reason?.detail).toContain("% diario");
  });

  it("keeps an existing reason when a later peer report carries none", async () => {
    const adapter = new LocalRiskListAdapter();
    const address = { value: "TKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", network: "tron" } as const;

    adapter.recordReport(address, "p2p-sync", new Date(), {
      category: "fake-support",
      detail: "Reportada por un par",
    });
    adapter.recordReport(address, "p2p-sync", new Date());

    expect(adapter.list()[0]!.reason?.category).toBe("fake-support");
  });
});
