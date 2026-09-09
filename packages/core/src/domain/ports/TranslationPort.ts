import type { LanguageTag } from "../value-objects/Language.js";
import type { TranslatedChatMessage } from "../entities/ChatMessage.js";

/**
 * Implemented by adapters-qvac using QVAC's TranslatePsy model. This is the
 * port that makes Track 02 (QVAC Psy) a first-class part of the main flow,
 * not a bolt-on — see TranslateAndAnalyzeMessage.
 */
export interface TranslationPort {
  detectLanguage(text: string): Promise<LanguageTag>;
  translate(text: string, targetLanguage: LanguageTag): Promise<TranslatedChatMessage>;
}
