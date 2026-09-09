import { describe, expect, it } from "vitest";
import { detectChainNetwork } from "../detectChainNetwork.js";

describe("detectChainNetwork", () => {
  it("detects a Tron base58 address", () => {
    expect(detectChainNetwork("TAbc123456789abcdefghjkmnpqrstuvwx")).toBe("tron");
  });

  it("detects an Ethereum hex address", () => {
    expect(detectChainNetwork("0x1234567890abcdef1234567890abcdef12345678")).toBe("ethereum");
  });

  it("detects an Ethereum hex address with uppercase digits", () => {
    expect(detectChainNetwork("0xABCDEF1234567890ABCDEF1234567890ABCDEF12")).toBe("ethereum");
  });

  it("returns other for an address matching neither format", () => {
    expect(detectChainNetwork("not-a-real-address")).toBe("other");
  });

  it("returns other for a Tron-like address of the wrong length", () => {
    expect(detectChainNetwork("TAbc123")).toBe("other");
  });

  it("returns other for an Ethereum-like address missing the 0x prefix", () => {
    expect(detectChainNetwork("1234567890abcdef1234567890abcdef12345678")).toBe("other");
  });

  it("returns other for an empty string", () => {
    expect(detectChainNetwork("")).toBe("other");
  });
});
