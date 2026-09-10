/**
 * `hyperswarm` ships no types (Holepunch/Pears ecosystem package). This
 * declares only the slice `createHyperswarmSwarmClient` actually calls —
 * not a full port of the package's API.
 */
declare module "hyperswarm" {
  export interface HyperswarmSocket {
    write(data: string): boolean;
    on(event: "data", listener: (chunk: Uint8Array) => void): this;
    on(event: "close" | "error", listener: (...args: unknown[]) => void): this;
  }

  export interface HyperswarmOptions {
    maxPeers?: number;
  }

  export interface JoinOptions {
    server?: boolean;
    client?: boolean;
  }

  export default class Hyperswarm {
    constructor(opts?: HyperswarmOptions);
    join(topic: Uint8Array, opts?: JoinOptions): unknown;
    leave(topic: Uint8Array): Promise<void>;
    flush(): Promise<void>;
    destroy(): Promise<void>;
    on(event: "connection", listener: (socket: HyperswarmSocket, peerInfo: unknown) => void): this;
  }
}
