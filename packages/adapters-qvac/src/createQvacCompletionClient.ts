import { completion, LLAMA_3_2_1B_INST_Q4_0, loadModel, unloadModel } from "@qvac/sdk";
import type { QvacCompletionClient } from "./QvacScamDetectionAdapter.js";

/** Registry constant used for scam-text classification. Documented in docs/performance-log.md. */
export const QVAC_SCAM_MODEL_NAME = "Llama 3.2 1B Instruct";
export const QVAC_SCAM_MODEL_QUANTIZATION = "Q4_0";

/**
 * Loads the on-device QVAC LLM used as the second pass of
 * `QvacScamDetectionAdapter`. Inference is local (`completion()`); this
 * function must not be imported from `apps/web` until the host runtime is
 * Node, Bare, or Expo (Vite cannot load `@qvac/sdk`).
 */
export async function createQvacCompletionClient(): Promise<{
  client: QvacCompletionClient;
  dispose: () => Promise<void>;
}> {
  const modelId = await loadModel({
    modelSrc: LLAMA_3_2_1B_INST_Q4_0,
    modelType: "llm",
  });

  const client: QvacCompletionClient = {
    async complete(prompt: string) {
      const result = completion({
        modelId,
        history: [{ role: "user", content: prompt }],
        stream: true,
      });
      let text = "";
      for await (const token of result.tokenStream) {
        text += token;
      }
      return text;
    },
  };

  return {
    client,
    dispose: async () => {
      await unloadModel({ modelId, clearStorage: false });
    },
  };
}
