import { describe, expect, it } from "vitest";
import { languageTag } from "@custos/core";
import { FALLBACK_LANGUAGE, QvacTranslateAdapter } from "../QvacTranslateAdapter.js";

describe("QvacTranslateAdapter", () => {
  it("returns the fallback language when no QVAC client is wired, so the web demo still analyzes", async () => {
    const adapter = new QvacTranslateAdapter();
    expect(await adapter.detectLanguage("hola")).toBe(FALLBACK_LANGUAGE);
  });

  it("detectLanguage and translate both call the injected QVAC client", async () => {
    const calls: string[] = [];
    const adapter = new QvacTranslateAdapter({
      detectLanguage: async (text) => {
        calls.push(`detect:${text}`);
        return "es";
      },
      translate: async (text, from, to) => {
        calls.push(`translate:${from}->${to}:${text}`);
        return "guaranteed 30% weekly returns";
      },
    });

    const detected = await adapter.detectLanguage("rendimientos semanales");
    expect(detected).toBe(languageTag("es"));

    const translated = await adapter.translate("rendimientos semanales", languageTag("en"));
    expect(translated.text).toBe("guaranteed 30% weekly returns");
    expect(translated.originalText).toBe("rendimientos semanales");
    expect(translated.originalLanguage).toBe(languageTag("es"));
    expect(translated.targetLanguage).toBe(languageTag("en"));
    expect(calls[0]).toBe("detect:rendimientos semanales");
    expect(calls.some((c) => c.startsWith("translate:es->en:"))).toBe(true);
  });
});
