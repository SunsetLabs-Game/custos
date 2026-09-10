import { MODEL_TYPES, OCR_LATIN, loadModel, ocr, unloadModel } from "@qvac/sdk";
import type { QvacVisionClient } from "./QvacVisionAdapter.js";

/** EasyOCR Latin — registry model resolves its detector (CRAFT) automatically. */
export const QVAC_VISION_MODEL_NAME = "EasyOCR Latin (g2)";
export const QVAC_VISION_MODEL_QUANTIZATION = "GGUF";

/**
 * On-device QVAC OCR pass (VisionPsy) for screenshots of fake trading
 * dashboards or a pasted QR/address image.
 *
 * Do not import this file from Vite.
 */
export async function createQvacVisionClient(): Promise<{
  client: QvacVisionClient;
  dispose: () => Promise<void>;
}> {
  const modelId = await loadModel({
    modelSrc: OCR_LATIN.src,
    modelType: MODEL_TYPES.ggmlOcr,
  });

  const client: QvacVisionClient = {
    async extractBlocks(imageBytes: Uint8Array) {
      // `ocr`'s Buffer type comes from `bare-buffer`, which the ambient global
      // `Buffer` here doesn't structurally match — the value is correct at
      // runtime, only the two packages' type declarations disagree.
      const params: Parameters<typeof ocr>[0] = {
        modelId,
        image: Buffer.from(imageBytes) as never,
        stream: false,
      };
      const { blocks } = ocr(params);
      return await blocks;
    },
  };

  return {
    client,
    dispose: async () => {
      await unloadModel({ modelId, clearStorage: false });
    },
  };
}
