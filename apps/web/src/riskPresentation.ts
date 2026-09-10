import { RiskLevel, type ScamCategory, type ScamMatch } from "@custos/core";
import { color as tokens } from "./theme.js";

export interface RiskLevelView {
  readonly label: string;
  readonly hint: string;
  readonly color: string;
  readonly bg: string;
  readonly border: string;
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
    color: tokens.safe,
    bg: tokens.safeBg,
    border: tokens.safeBorder,
    icon: "✓",
  },
  [RiskLevel.Low]: {
    label: "Low",
    hint: "Weak signals only. Still worth a second look before you send.",
    color: tokens.safe,
    bg: tokens.safeBg,
    border: tokens.safeBorder,
    icon: "i",
  },
  [RiskLevel.Elevated]: {
    label: "Elevated - review before sending",
    hint: "This send needs an explicit check. Do not rush.",
    color: tokens.elevated,
    bg: tokens.elevatedBg,
    border: tokens.elevatedBorder,
    icon: "!",
  },
  [RiskLevel.High]: {
    label: "High",
    hint: "Strong scam-pattern match. Only continue if you fully trust the destination.",
    color: tokens.elevated,
    bg: tokens.elevatedBg,
    border: tokens.elevatedBorder,
    icon: "!",
  },
  [RiskLevel.Critical]: {
    label: "Critical - send blocked",
    hint: "Custos will not let this transfer be signed.",
    color: tokens.critical,
    bg: tokens.criticalBg,
    border: tokens.criticalBorder,
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
