export type ScamCategory =
  | "pig-butchering"
  | "fake-support"
  | "recovery-scam"
  | "romance-scam"
  | "fake-investment-platform"
  | "urgency-pressure"
  | "address-poisoning";

export interface ScamPattern {
  readonly id: string;
  readonly category: ScamCategory;
  readonly description: string;
  /** Short phrases/regex-ish hints used as a cheap pre-filter before the LLM pass. */
  readonly heuristics: readonly string[];
}

export interface ScamMatch {
  readonly pattern: ScamPattern;
  /** 0..1 confidence from the detector, not a business-severity score — see RiskLevel for that. */
  readonly confidence: number;
  readonly evidenceSnippet?: string;
}
