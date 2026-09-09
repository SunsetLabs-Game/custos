import type { TranslationPort } from "@custos/core";
import { languageTag, type LanguageTag } from "@custos/core";
import type { TranslatedChatMessage } from "@custos/core";

/**
 * TODO(sdk-integration): wire QVAC's TranslatePsy model. This port is
 * central to the Track 02 story (see README "Where each Psy model is
 * actually load-bearing") — do not stub this one out for the submission,
 * it needs a real implementation, unlike OcrPort which is a stretch goal.
 */
export class QvacTranslateAdapter implements TranslationPort {
  async detectLanguage(_text: string): Promise<LanguageTag> {
    throw new Error(
      "QvacTranslateAdapter.detectLanguage not implemented — wire TranslatePsy per qvac.tether.io",
    );
  }

  async translate(text: string, targetLanguage: LanguageTag): Promise<TranslatedChatMessage> {
    throw new Error(
      `QvacTranslateAdapter.translate not implemented — wire TranslatePsy per qvac.tether.io (target=${targetLanguage}, textLength=${text.length})`,
    );
  }
}

// Convenience for callers who need a placeholder tag during local dev without a device.
export const FALLBACK_LANGUAGE: LanguageTag = languageTag("en");
