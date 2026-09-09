import type { Address } from "../entities/Address.js";

/** Tron base58check: 34 characters, T prefix, no 0/O/I/l. */
const TRON_ADDRESS_RE = /^T[1-9A-HJ-NP-Za-km-z]{33}$/;

/** Ethereum account: 0x plus 20 bytes hex. Checksum casing is not required. */
const ETHEREUM_ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;

export type ParseDestinationAddressResult =
  | { readonly ok: true; readonly address: Address }
  | { readonly ok: false; readonly reason: "empty" | "unrecognized" };

/**
 * Infers `ChainNetwork` from the address format so callers never have to
 * hardcode `"tron"`. Addresses that match neither Tron nor Ethereum are
 * rejected instead of being silently treated as Tron (risk-list keys are
 * `network:value`, so a wrong network is a missed lookup).
 */
export function parseDestinationAddress(raw: string): ParseDestinationAddressResult {
  const value = raw.trim();
  if (value.length === 0) {
    return { ok: false, reason: "empty" };
  }
  if (TRON_ADDRESS_RE.test(value)) {
    return { ok: true, address: { value, network: "tron" } };
  }
  if (ETHEREUM_ADDRESS_RE.test(value)) {
    return { ok: true, address: { value, network: "ethereum" } };
  }
  return { ok: false, reason: "unrecognized" };
}
