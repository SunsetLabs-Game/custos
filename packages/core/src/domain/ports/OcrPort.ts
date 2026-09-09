/**
 * Implemented by adapters-qvac using QVAC's VisionPsy model. Stretch goal:
 * extract text/addresses from a pasted screenshot (fake trading dashboard,
 * QR code) so the same scam detector can run on image-borne scams.
 */
export interface OcrPort {
  extractText(imageBytes: Uint8Array): Promise<string>;
  extractAddressCandidates(imageBytes: Uint8Array): Promise<readonly string[]>;
}
