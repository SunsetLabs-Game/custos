import type { OcrPort } from "@custos/core";

/**
 * TODO(sdk-integration): stretch goal — wire QVAC's VisionPsy model. Only
 * pick this up after ScamDetectionPort and TranslationPort (the two
 * required-for-submission adapters) are working end to end.
 */
export class QvacVisionAdapter implements OcrPort {
  async extractText(_imageBytes: Uint8Array): Promise<string> {
    throw new Error("QvacVisionAdapter.extractText not implemented — wire VisionPsy per qvac.tether.io");
  }

  async extractAddressCandidates(_imageBytes: Uint8Array): Promise<readonly string[]> {
    throw new Error(
      "QvacVisionAdapter.extractAddressCandidates not implemented — wire VisionPsy per qvac.tether.io",
    );
  }
}
