import type { OcrPort } from "../../domain/ports/OcrPort.js";
import type { ScamDetectionPort } from "../../domain/ports/ScamDetectionPort.js";
import type { ScamMatch } from "../../domain/entities/ScamPattern.js";

export interface AnalyzeScreenshotDeps {
  readonly ocr: OcrPort;
  readonly scamDetection: ScamDetectionPort;
}

export interface AnalyzeScreenshotResult {
  readonly extractedText: string;
  readonly addressCandidates: readonly string[];
  readonly matches: readonly ScamMatch[];
}

/**
 * Stretch goal (VisionPsy). Handles screenshots of fake trading dashboards
 * or QR codes pasted before a send, so the same detector isn't limited to
 * text the user retyped by hand.
 */
export class AnalyzeScreenshot {
  constructor(private readonly deps: AnalyzeScreenshotDeps) {}

  async execute(imageBytes: Uint8Array): Promise<AnalyzeScreenshotResult> {
    const [extractedText, addressCandidates] = await Promise.all([
      this.deps.ocr.extractText(imageBytes),
      this.deps.ocr.extractAddressCandidates(imageBytes),
    ]);
    const matches = extractedText ? await this.deps.scamDetection.analyzeText(extractedText) : [];
    return { extractedText, addressCandidates, matches };
  }
}
