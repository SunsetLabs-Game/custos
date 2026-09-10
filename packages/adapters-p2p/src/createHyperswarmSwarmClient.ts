import Hyperswarm from "hyperswarm";
import type { P2pReportMessage, P2pSwarmClient } from "./HyperswarmRiskListAdapter.js";

const TOPIC_SEED = "custos-risk-list-v1";

async function topicHash(): Promise<Uint8Array> {
  const bytes = new TextEncoder().encode(TOPIC_SEED);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return new Uint8Array(digest);
}

function isReportMessage(value: unknown): value is P2pReportMessage {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<P2pReportMessage>;
  return (
    typeof candidate.value === "string" &&
    (candidate.network === "tron" || candidate.network === "ethereum" || candidate.network === "other") &&
    typeof candidate.reportedAt === "string"
  );
}

/**
 * Real Hyperswarm wiring for HyperswarmRiskListAdapter's P2pSwarmClient:
 * joins a fixed discovery topic, gossips `reportScam` reports as
 * newline-delimited JSON to connected peers, and forwards peer reports back
 * up to the adapter.
 *
 * Node/Bare only — Hyperswarm needs raw UDP/DHT access the browser doesn't
 * have. Do not import this file from Vite.
 */
export async function createHyperswarmSwarmClient(): Promise<{
  client: P2pSwarmClient;
  dispose: () => Promise<void>;
}> {
  const swarm = new Hyperswarm();
  const sockets = new Set<{ write(data: string): boolean }>();
  let onPeerReport: ((message: P2pReportMessage) => void) | undefined;

  swarm.on("connection", (socket) => {
    sockets.add(socket);
    let buffer = "";
    socket.on("data", (chunk: Uint8Array) => {
      buffer += new TextDecoder().decode(chunk);
      let newlineIndex: number;
      while ((newlineIndex = buffer.indexOf("\n")) >= 0) {
        const line = buffer.slice(0, newlineIndex);
        buffer = buffer.slice(newlineIndex + 1);
        if (!line) continue;
        try {
          const parsed: unknown = JSON.parse(line);
          if (isReportMessage(parsed)) onPeerReport?.(parsed);
        } catch {
          // ignore malformed peer messages
        }
      }
    });
    socket.on("close", () => sockets.delete(socket));
    socket.on("error", () => sockets.delete(socket));
  });

  swarm.join(await topicHash(), { server: true, client: true });

  const client: P2pSwarmClient = {
    broadcast(message) {
      const line = `${JSON.stringify(message)}\n`;
      for (const socket of sockets) socket.write(line);
    },
    onPeerReport(handler) {
      onPeerReport = handler;
    },
    async sync() {
      await swarm.flush();
    },
  };

  return {
    client,
    dispose: async () => {
      await swarm.destroy();
    },
  };
}
