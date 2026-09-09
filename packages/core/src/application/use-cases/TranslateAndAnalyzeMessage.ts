import type { TranslationPort } from "../../domain/ports/TranslationPort.js";
import type { ScamDetectionPort } from "../../domain/ports/ScamDetectionPort.js";
import type { ChatMessage, TranslatedChatMessage } from "../../domain/entities/ChatMessage.js";
import type { ScamMatch } from "../../domain/entities/ScamPattern.js";
import type { LanguageTag } from "../../domain/value-objects/Language.js";

export interface TranslateAndAnalyzeMessageDeps {
  readonly translation: TranslationPort;
  readonly scamDetection: ScamDetectionPort;
}

export interface TranslateAndAnalyzeResult {
  readonly message: ChatMessage | TranslatedChatMessage;
  readonly matches: readonly ScamMatch[];
}

/**
 * This is where TranslatePsy is load-bearing: cross-border scam scripts are
 * frequently pasted in a language the victim doesn't read, so translation
 * runs before pattern detection rather than being an optional add-on.
 */
export class TranslateAndAnalyzeMessage {
  constructor(private readonly deps: TranslateAndAnalyzeMessageDeps) {}

  async execute(text: string, userLanguage: LanguageTag): Promise<TranslateAndAnalyzeResult> {
    const detected = await this.deps.translation.detectLanguage(text);

    if (detected === userLanguage) {
      const matches = await this.deps.scamDetection.analyzeText(text);
      return { message: { text, detectedLanguage: detected }, matches };
    }

    const translated = await this.deps.translation.translate(text, userLanguage);
    const matches = await this.deps.scamDetection.analyzeText(translated.text);
    return { message: translated, matches };
  }
}
