import { completion, LLAMA_3_2_1B_INST_Q4_0, loadModel, translate, unloadModel } from "@qvac/sdk";
import type { QvacTranslationClient } from "./QvacTranslateAdapter.js";

export const QVAC_TRANSLATE_MODEL_NAME = "Llama 3.2 1B Instruct";
export const QVAC_TRANSLATE_MODEL_QUANTIZATION = "Q4_0";

/**
 * On-device QVAC `translate()` + a detect pass via `completion()`.
 * TranslatePsy-AfriSLM is in the registry as `AFRICAN_4B_TRANSLATION_Q4_K_M`;
 * this factory uses Llama 3.2 1B so the ES/EN/ZH pig-butchering demo actually
 * translates. Swap `modelSrc` when the demo language set is African.
 *
 * Do not import this file from Vite.
 */
export async function createQvacTranslationClient(): Promise<{
  client: QvacTranslationClient;
  dispose: () => Promise<void>;
}> {
  const modelId = await loadModel({
    modelSrc: LLAMA_3_2_1B_INST_Q4_0,
    modelType: "llm",
  });

  const client: QvacTranslationClient = {
    async detectLanguage(text: string) {
      const result = completion({
        modelId,
        history: [
          {
            role: "user",
            content: `Reply with only the ISO 639-1 language code of this text.\n${text}`,
          },
        ],
        stream: true,
      });
      let raw = "";
      for await (const token of result.tokenStream) {
        raw += token;
      }
      return raw;
    },
    async translate(text: string, from: string, to: string) {
      const result = translate({
        modelId,
        text,
        from,
        to,
        modelType: "llm",
        stream: false,
      });
      return await result.text;
    },
  };

  return {
    client,
    dispose: async () => {
      await unloadModel({ modelId, clearStorage: false });
    },
  };
}
