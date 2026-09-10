import { describe, expect, it } from "vitest";
import type { Address } from "@custos/core";
import { HyperswarmRiskListAdapter, type P2pReportMessage, type P2pSwarmClient } from "../HyperswarmRiskListAdapter.js";
import { LocalRiskListAdapter } from "../LocalRiskListAdapter.js";

const address: Address = { value: "TXyzScamAddress000000000000000000", network: "tron" };

function fakeSwarm() {
  const broadcasts: P2pReportMessage[] = [];
  let peerHandler: ((message: P2pReportMessage) => void) | undefined;
  let syncCalls = 0;
  const client: P2pSwarmClient = {
    broadcast: (message) => broadcasts.push(message),
    onPeerReport: (handler) => {
      peerHandler = handler;
    },
    sync: async () => {
      syncCalls += 1;
    },
  };
  return {
    client,
    broadcasts,
    syncCalls: () => syncCalls,
    emitPeerReport: (message: P2pReportMessage) => peerHandler?.(message),
  };
}

describe("HyperswarmRiskListAdapter", () => {
  it("behaves like LocalRiskListAdapter when no swarm client is wired", async () => {
    const adapter = new HyperswarmRiskListAdapter();
    await adapter.reportScam(address);
    expect((await adapter.lookup(address)).flagged).toBe(true);
    await expect(adapter.sync()).resolves.toBeUndefined();
  });

  it("broadcasts reportScam to the swarm", async () => {
    const swarm = fakeSwarm();
    const adapter = new HyperswarmRiskListAdapter(new LocalRiskListAdapter(), swarm.client);

    await adapter.reportScam(address);

    expect(swarm.broadcasts).toHaveLength(1);
    expect(swarm.broadcasts[0]).toMatchObject({ value: address.value, network: address.network });
  });

  it("persists an incoming peer report into the local cache with source p2p-sync", async () => {
    const swarm = fakeSwarm();
    const adapter = new HyperswarmRiskListAdapter(new LocalRiskListAdapter(), swarm.client);

    swarm.emitPeerReport({ value: address.value, network: address.network, reportedAt: new Date().toISOString() });

    const reputation = await adapter.lookup(address);
    expect(reputation.flagged).toBe(true);
    expect(reputation.source).toBe("p2p-sync");
  });

  it("delegates sync() to the swarm client", async () => {
    const swarm = fakeSwarm();
    const adapter = new HyperswarmRiskListAdapter(new LocalRiskListAdapter(), swarm.client);

    await adapter.sync();

    expect(swarm.syncCalls()).toBe(1);
  });
});
