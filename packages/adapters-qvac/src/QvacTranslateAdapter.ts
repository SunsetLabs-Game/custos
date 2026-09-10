import type { TranslationPort } from "@custos/core";
import { languageTag, type LanguageTag } from "@custos/core";
import type { TranslatedChatMessage } from "@custos/core";

export const FALLBACK_LANGUAGE: LanguageTag = languageTag("en");

export interface QvacTranslationClient {
  detectLanguage(text: string): Promise<string>;
  translate(text: string, from: string, to: string): Promise<string>;
}

/**
 * TranslationPort over QVAC `translate()` (and a detect pass). The real SDK
 * client is created by `createQvacTranslationClient` and must not be imported
 * from Vite. Without a client, `detectLanguage` returns English so the send
 * flow still analyzes the original paste instead of throwing.
 */
export class QvacTranslateAdapter implements TranslationPort {
  private lastDetect: { text: string; lang: LanguageTag } | undefined;

  constructor(private readonly client?: QvacTranslationClient) {}

  async detectLanguage(text: string): Promise<LanguageTag> {
    if (!this.client) return FALLBACK_LANGUAGE;
    const raw = (await this.client.detectLanguage(text)).trim().toLowerCase();
    const code = raw.slice(0, 2);
    const lang = languageTag(code.length === 2 ? code : "en");
    this.lastDetect = { text, lang };
    return lang;
  }

  async translate(text: string, targetLanguage: LanguageTag): Promise<TranslatedChatMessage> {
    const detected =
      this.lastDetect?.text === text ? this.lastDetect.lang : await this.detectLanguage(text);
    if (!this.client) {
      return {
        text,
        detectedLanguage: targetLanguage,
        originalText: text,
        originalLanguage: detected,
        targetLanguage,
      };
    }
    const translated = await this.client.translate(text, detected, targetLanguage);
    return {
      text: translated,
      detectedLanguage: targetLanguage,
      originalText: text,
      originalLanguage: detected,
      targetLanguage,
    };
  }
}
