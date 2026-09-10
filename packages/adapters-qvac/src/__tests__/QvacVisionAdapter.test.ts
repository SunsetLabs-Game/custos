import { describe, expect, it } from "vitest";
import { QvacVisionAdapter } from "../QvacVisionAdapter.js";

const fakeImage = new Uint8Array([0, 1, 2, 3]);

describe("QvacVisionAdapter", () => {
  it("returns empty results when no QVAC client is wired, so a screenshot paste degrades gracefully", async () => {
    const adapter = new QvacVisionAdapter();
    expect(await adapter.extractText(fakeImage)).toBe("");
    expect(await adapter.extractAddressCandidates(fakeImage)).toEqual([]);
  });

  it("joins OCR blocks into extractText", async () => {
    const adapter = new QvacVisionAdapter({
      extractBlocks: async () => [{ text: "Send USDT to" }, { text: "TXyzScamAddress000000000000000000" }],
    });
    expect(await adapter.extractText(fakeImage)).toBe("Send USDT to\nTXyzScamAddress000000000000000000");
  });

  it("extracts Tron and Ethereum address candidates from OCR'd text, deduplicated", async () => {
    const adapter = new QvacVisionAdapter({
      extractBlocks: async () => [
        { text: "scan to pay TLyqzVGLV1srkB7dToTAEqgDSfPtXRJZYH" },
        { text: "or 0xABCDEF0123456789abcdef0123456789ABCDEF01" },
        { text: "TLyqzVGLV1srkB7dToTAEqgDSfPtXRJZYH again" },
      ],
    });
    expect(await adapter.extractAddressCandidates(fakeImage)).toEqual([
      "TLyqzVGLV1srkB7dToTAEqgDSfPtXRJZYH",
      "0xABCDEF0123456789abcdef0123456789ABCDEF01",
    ]);
  });

  it("returns no candidates when OCR finds no address-shaped text", async () => {
    const adapter = new QvacVisionAdapter({
      extractBlocks: async () => [{ text: "just a caption, no address here" }],
    });
    expect(await adapter.extractAddressCandidates(fakeImage)).toEqual([]);
  });
});
