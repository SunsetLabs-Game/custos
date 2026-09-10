import { describe, expect, it } from "vitest";
import { TranslateAndAnalyzeMessage } from "../TranslateAndAnalyzeMessage.js";
import { languageTag } from "../../../domain/value-objects/Language.js";
import type { TranslationPort } from "../../../domain/ports/TranslationPort.js";
import type { ScamDetectionPort } from "../../../domain/ports/ScamDetectionPort.js";

const en = languageTag("en");
const es = languageTag("es");

describe("TranslateAndAnalyzeMessage", () => {
  it("skips translation and analyzes the original text when languages match", async () => {
    const analyzed: string[] = [];
    const translation: TranslationPort = {
      detectLanguage: async () => en,
      translate: async () => {
        throw new Error("translate should not run");
      },
    };
    const scamDetection: ScamDetectionPort = {
      analyzeText: async (text) => {
        analyzed.push(text);
        return [];
      },
    };

    const result = await new TranslateAndAnalyzeMessage({ translation, scamDetection }).execute(
      "hello",
      en,
    );

    expect(analyzed).toEqual(["hello"]);
    expect(result.message).toEqual({ text: "hello", detectedLanguage: en });
  });

  it("translates first, then analyzes the translated text", async () => {
    const analyzed: string[] = [];
    const translation: TranslationPort = {
      detectLanguage: async () => es,
      translate: async (text, target) => ({
        text: "guaranteed 30% weekly returns",
        detectedLanguage: target,
        originalText: text,
        originalLanguage: es,
        targetLanguage: target,
      }),
    };
    const scamDetection: ScamDetectionPort = {
      analyzeText: async (text) => {
        analyzed.push(text);
        return [];
      },
    };

    const result = await new TranslateAndAnalyzeMessage({ translation, scamDetection }).execute(
      "rendimientos semanales garantizados",
      en,
    );

    expect(analyzed).toEqual(["guaranteed 30% weekly returns"]);
    expect("originalText" in result.message).toBe(true);
  });
});
