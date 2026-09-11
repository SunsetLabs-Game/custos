import type { QvacVisionClient, QvacVisionTextBlock } from "@custos/adapters-qvac";

/**
 * Real in-browser OCR for the VisionPsy path, standing in for QVAC's native
 * VisionPsy model (which needs a Bare/Expo runtime Vite can't load).
 *
 * The privacy claim still holds: tesseract.js runs the recognition in a Web
 * Worker on this device, so the screenshot bytes never leave the browser.
 * tesseract.js is several MB, so it is imported only when an image is actually
 * scanned.
 */
export class TesseractVisionClient implements QvacVisionClient {
  private workerPromise: Promise<any> | null = null;

  constructor(private readonly onProgress?: (status: string, progress: number) => void) {}

  private async worker(): Promise<any> {
    if (!this.workerPromise) {
      this.workerPromise = (async () => {
        const { createWorker } = await import("tesseract.js");
        return createWorker("eng", 1, {
          logger: (m: { status: string; progress: number }) => {
            this.onProgress?.(m.status, m.progress);
          },
        });
      })();
    }
    return this.workerPromise;
  }

  async extractBlocks(imageBytes: Uint8Array): Promise<readonly QvacVisionTextBlock[]> {
    const worker = await this.worker();
    const blob = new Blob([imageBytes as unknown as BlobPart]);
    const url = URL.createObjectURL(blob);
    try {
      const { data } = await worker.recognize(url);
      const lines: { text: string; confidence: number }[] = data.lines ?? [];
      if (lines.length > 0) {
        return lines
          .map((line) => ({ text: line.text.trim(), confidence: line.confidence / 100 }))
          .filter((block) => block.text.length > 0);
      }
      const text = (data.text ?? "").trim();
      return text ? [{ text, confidence: (data.confidence ?? 0) / 100 }] : [];
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  async dispose(): Promise<void> {
    if (!this.workerPromise) return;
    const worker = await this.workerPromise;
    await worker.terminate();
    this.workerPromise = null;
  }
}
