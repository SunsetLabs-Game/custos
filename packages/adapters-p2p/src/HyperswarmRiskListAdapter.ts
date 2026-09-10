import type { RiskListPort, Address, AddressReputation, ChainNetwork } from "@custos/core";
import { LocalRiskListAdapter } from "./LocalRiskListAdapter.js";

export interface P2pReportMessage {
  readonly value: string;
  readonly network: ChainNetwork;
  readonly reportedAt: string;
}

/**
 * The gossip transport HyperswarmRiskListAdapter needs — nothing more. Real
 * wiring lives in `createHyperswarmSwarmClient` (Node/Bare only, must not be
 * imported from Vite); tests inject a fake so this class never touches a
 * real socket.
 */
export interface P2pSwarmClient {
  broadcast(message: P2pReportMessage): void;
  onPeerReport(handler: (message: P2pReportMessage) => void): void;
  sync(): Promise<void>;
}

/**
 * Wraps LocalRiskListAdapter as the on-disk cache and adds Hyperswarm (Pears
 * Stack) gossip on top via an injectable P2pSwarmClient. Without a client,
 * this behaves exactly like LocalRiskListAdapter — a fully valid MVP, just
 * without peer sync — so it's safe to construct in apps/web even where the
 * real Hyperswarm transport can't run (the browser has no raw UDP/DHT
 * access).
 */
export class HyperswarmRiskListAdapter implements RiskListPort {
  constructor(
    private readonly local: LocalRiskListAdapter = new LocalRiskListAdapter(),
    private readonly swarm?: P2pSwarmClient,
  ) {
    this.swarm?.onPeerReport((message) => {
      this.local.recordReport(
        { value: message.value, network: message.network },
        "p2p-sync",
        new Date(message.reportedAt),
      );
    });
  }

  async lookup(address: Address): Promise<AddressReputation> {
    return this.local.lookup(address);
  }

  async reportScam(address: Address): Promise<void> {
    await this.local.reportScam(address);
    this.swarm?.broadcast({
      value: address.value,
      network: address.network,
      reportedAt: new Date().toISOString(),
    });
  }

  async sync(): Promise<void> {
    await this.swarm?.sync();
  }
}
