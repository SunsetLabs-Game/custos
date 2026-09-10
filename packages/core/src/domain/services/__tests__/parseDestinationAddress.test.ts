import { describe, expect, it } from "vitest";
import { parseDestinationAddress } from "../parseDestinationAddress.js";

describe("parseDestinationAddress", () => {
  it("detects a Tron base58 address", () => {
    const result = parseDestinationAddress("TLyqzVGLV1srkB7dToTAEqgDSfPtXRJZYH");

    expect(result).toEqual({
      ok: true,
      address: { value: "TLyqzVGLV1srkB7dToTAEqgDSfPtXRJZYH", network: "tron" },
    });
  });

  it("detects an Ethereum hex address regardless of checksum casing", () => {
    const result = parseDestinationAddress("0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6");

    expect(result).toEqual({
      ok: true,
      address: { value: "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6", network: "ethereum" },
    });
  });

  it("trims surrounding whitespace before matching", () => {
    const result = parseDestinationAddress("  TLyqzVGLV1srkB7dToTAEqgDSfPtXRJZYH\n");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.address.value).toBe("TLyqzVGLV1srkB7dToTAEqgDSfPtXRJZYH");
    }
  });

  it("rejects an empty or whitespace-only value", () => {
    expect(parseDestinationAddress("")).toEqual({ ok: false, reason: "empty" });
    expect(parseDestinationAddress("   ")).toEqual({ ok: false, reason: "empty" });
  });

  it("rejects formats that are neither Tron nor Ethereum instead of defaulting to tron", () => {
    expect(parseDestinationAddress("bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq")).toEqual({
      ok: false,
      reason: "unrecognized",
    });
    expect(parseDestinationAddress("Tshort")).toEqual({ ok: false, reason: "unrecognized" });
    expect(parseDestinationAddress("0xdead")).toEqual({ ok: false, reason: "unrecognized" });
    expect(parseDestinationAddress("742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6")).toEqual({
      ok: false,
      reason: "unrecognized",
    });
  });
});
