import type { OcrPort } from "@custos/core";

/** Loose token match over OCR'd text — full validation happens in parseDestinationAddress. */
const ADDRESS_TOKEN_RE = /(T[1-9A-HJ-NP-Za-km-z]{33}|0x[0-9a-fA-F]{40})/g;

export interface QvacVisionTextBlock {
  readonly text: string;
  readonly confidence?: number;
}

export interface QvacVisionClient {
  extractBlocks(imageBytes: Uint8Array): Promise<readonly QvacVisionTextBlock[]>;
}

/**
 * OcrPort over QVAC's on-device OCR pass (VisionPsy). The real client is
 * created by `createQvacVisionClient` and must not be imported from Vite.
 * Without a client, both methods return empty results instead of throwing,
 * so a pasted screenshot degrades to "nothing extracted" rather than
 * crashing the send flow.
 */
export class QvacVisionAdapter implements OcrPort {
  constructor(private readonly client?: QvacVisionClient) {}

  async extractText(imageBytes: Uint8Array): Promise<string> {
    if (!this.client) return "";
    const blocks = await this.client.extractBlocks(imageBytes);
    return blocks.map((block) => block.text).join("\n");
  }

  async extractAddressCandidates(imageBytes: Uint8Array): Promise<readonly string[]> {
    const text = await this.extractText(imageBytes);
    const matches = text.match(ADDRESS_TOKEN_RE) ?? [];
    return [...new Set(matches)];
  }
}
