import { RiskLevel, type ScamCategory, type ScamMatch } from "@custos/core";

export interface RiskLevelView {
  readonly label: string;
  readonly hint: string;
  readonly color: string;
  readonly icon: string;
}

export interface MatchView {
  readonly categoryLabel: string;
  readonly evidence: string | undefined;
  readonly confidenceLabel: string;
}

const RISK_LEVEL_VIEW: Record<RiskLevel, RiskLevelView> = {
  [RiskLevel.None]: {
    label: "No known risk",
    hint: "Nothing in the address or chat matched a known scam pattern.",
    color: "#1e8449",
    icon: "✓",
  },
  [RiskLevel.Low]: {
    label: "Low",
    hint: "Weak signals only. Still worth a second look before you send.",
    color: "#2e86c1",
    icon: "i",
  },
  [RiskLevel.Elevated]: {
    label: "Elevated - review before sending",
    hint: "This send needs an explicit check. Do not rush.",
    color: "#d68910",
    icon: "!",
  },
  [RiskLevel.High]: {
    label: "High",
    hint: "Strong scam-pattern match. Only continue if you fully trust the destination.",
    color: "#ca6f1e",
    icon: "!",
  },
  [RiskLevel.Critical]: {
    label: "Critical - send blocked",
    hint: "Custos will not let this transfer be signed.",
    color: "#c0392b",
    icon: "✕",
  },
};

const SCAM_CATEGORY_LABELS: Record<ScamCategory, string> = {
  "pig-butchering": "Pig-butchering (fake relationship / investment)",
  "fake-support": "Fake wallet or exchange support",
  "recovery-scam": "Recovery-agent scam",
  "romance-scam": "Romance scam",
  "fake-investment-platform": "Fake investment platform",
  "urgency-pressure": "Urgency or secrecy pressure",
  "address-poisoning": "Address poisoning (lookalike destination)",
  "task-scam": "Task / job scam",
  "impersonation-authority": "Authority impersonation",
  "airdrop-claim-fee": "Airdrop claim-fee trap",
  "otc-escrow-scam": "OTC escrow scam",
  "phishing-approval-drain": "Phishing approval drain",
};

export function presentRiskLevel(level: RiskLevel): RiskLevelView {
  return RISK_LEVEL_VIEW[level];
}

export function presentMatch(match: ScamMatch): MatchView {
  return {
    categoryLabel: SCAM_CATEGORY_LABELS[match.pattern.category],
    evidence: match.evidenceSnippet,
    confidenceLabel: `${Math.round(match.confidence * 100)}% confidence`,
  };
}
