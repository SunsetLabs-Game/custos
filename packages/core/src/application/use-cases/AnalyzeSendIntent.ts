import type { ScamDetectionPort } from "../../domain/ports/ScamDetectionPort.js";
import type { RiskListPort } from "../../domain/ports/RiskListPort.js";
import type { SendIntent } from "../../domain/entities/SendIntent.js";
import type { RiskAssessment } from "../../domain/entities/RiskAssessment.js";
import type { ScamMatch } from "../../domain/entities/ScamPattern.js";
import { RiskLevel } from "../../domain/value-objects/RiskLevel.js";
import { detectAddressPoisoning } from "../../domain/services/detectAddressPoisoning.js";

export interface AnalyzeSendIntentDeps {
  readonly scamDetection: ScamDetectionPort;
  readonly riskList: RiskListPort;
  /** injected for deterministic ids/timestamps in tests */
  readonly now?: () => Date;
  readonly newId?: () => string;
}

export interface AnalyzeSendIntentOptions {
  /**
   * When TranslateAndAnalyzeMessage already ran detection on (translated)
   * text, pass those matches so the model is not invoked a second time.
   */
  readonly textMatches?: readonly ScamMatch[];
}

/**
 * The central use case: given what the user is about to send, and to whom,
 * decide how much friction to introduce before WDK is allowed to sign.
 * Text analysis and address reputation are independent signals — either one
 * alone can raise the risk level.
 */
export class AnalyzeSendIntent {
  constructor(private readonly deps: AnalyzeSendIntentDeps) {}

  async execute(intent: SendIntent, options: AnalyzeSendIntentOptions = {}): Promise<RiskAssessment> {
    const now = this.deps.now?.() ?? new Date();
    const newId = this.deps.newId ?? (() => crypto.randomUUID());

    const [textMatches, addressReputation] = await Promise.all([
      options.textMatches
        ? Promise.resolve(options.textMatches)
        : intent.context
          ? this.deps.scamDetection.analyzeText(intent.context.text)
          : Promise.resolve<readonly ScamMatch[]>([]),
      this.deps.riskList.lookup(intent.destination),
    ]);

    const poisoningMatch = detectAddressPoisoning(intent.destination, intent.recentRecipients ?? []);
    const matches = poisoningMatch ? [...textMatches, poisoningMatch] : textMatches;

    const level = deriveRiskLevel(matches, addressReputation.flagged);

    return {
      id: newId(),
      createdAt: now,
      level,
      matches,
      addressReputation,
      summary: summarize(level, matches, addressReputation.flagged),
    };
  }
}

function deriveRiskLevel(matches: readonly ScamMatch[], addressFlagged: boolean): RiskLevel {
  if (addressFlagged) return RiskLevel.Critical;

  const strongest = matches.reduce((max, m) => Math.max(max, m.confidence), 0);
  if (strongest >= 0.85) return RiskLevel.Critical;
  if (strongest >= 0.6) return RiskLevel.High;
  if (strongest >= 0.35) return RiskLevel.Elevated;
  if (strongest > 0) return RiskLevel.Low;
  return RiskLevel.None;
}

function summarize(level: RiskLevel, matches: readonly ScamMatch[], addressFlagged: boolean): string {
  if (addressFlagged) return "Destination address is on the known-scam list.";
  if (matches.length === 0) return "No known scam pattern detected.";
  const top = [...matches].sort((a, b) => b.confidence - a.confidence)[0]!;
  return `Matches "${top.pattern.category}" pattern (${Math.round(top.confidence * 100)}% confidence).`;
}
