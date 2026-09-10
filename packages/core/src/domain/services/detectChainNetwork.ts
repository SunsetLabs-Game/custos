import type { ChainNetwork } from "../entities/Address.js";

const TRON_ADDRESS = /^T[1-9A-HJ-NP-Za-km-z]{33}$/;
const ETHEREUM_ADDRESS = /^0x[0-9a-fA-F]{40}$/;

/**
 * Infers the chain network from an address's format alone. Returns "other"
 * for anything matching neither Tron base58 nor Ethereum hex — callers must
 * not treat "other" as a safe default, since `RiskListPort.lookup` keys on
 * `network:value` and a wrong network silently skips the real risk list.
 */
export function detectChainNetwork(value: string): ChainNetwork {
  if (TRON_ADDRESS.test(value)) return "tron";
  if (ETHEREUM_ADDRESS.test(value)) return "ethereum";
  return "other";
}
