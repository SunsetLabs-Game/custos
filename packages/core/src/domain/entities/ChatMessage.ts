import type { LanguageTag } from "../value-objects/Language.js";

/**
 * Raw text the user pastes from a chat with a counterparty, before any
 * on-device translation or analysis. Never persisted verbatim — only the
 * resulting RiskAssessment is logged (see AuditLogPort).
 */
export interface ChatMessage {
  readonly text: string;
  readonly detectedLanguage?: LanguageTag;
}

export interface TranslatedChatMessage extends ChatMessage {
  readonly originalText: string;
  readonly originalLanguage: LanguageTag;
  readonly targetLanguage: LanguageTag;
}
