import type { RiskListPort, Address, AddressReputation } from "@custos/core";
import { LocalRiskListAdapter } from "./LocalRiskListAdapter.js";

/**
 * TODO(sdk-integration): stretch goal. Wraps LocalRiskListAdapter as the
 * on-disk cache and adds Hyperswarm (Pears Stack) gossip on top:
 *   - join a fixed discovery topic (hash of e.g. "custos-risk-list-v1")
 *   - on reportScam(), broadcast {address, network, reportedAt} to connected peers
 *   - on receiving a peer broadcast, persist it into the local cache with
 *     source: "p2p-sync" (see AddressReputation)
 *   - sync() should be a best-effort peer discovery pass, not a blocking call
 * See Pears Stack / Hyperswarm docs before implementing the wire protocol —
 * do not invent a custom transport when Hyperswarm already provides discovery.
 */
export class HyperswarmRiskListAdapter implements RiskListPort {
  constructor(private readonly local: LocalRiskListAdapter = new LocalRiskListAdapter()) {}

  async lookup(address: Address): Promise<AddressReputation> {
    return this.local.lookup(address);
  }

  async reportScam(address: Address): Promise<void> {
    await this.local.reportScam(address);
    // TODO(sdk-integration): broadcast to the Hyperswarm topic.
  }

  async sync(): Promise<void> {
    // TODO(sdk-integration): join the swarm, pull peer-reported addresses
    // into `this.local` via a local method exposed for this purpose.
  }
}
