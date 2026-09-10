import { RiskLevel } from "@custos/core";
import type { ScamCategory } from "@custos/core";

export interface RiskLevelPresentation {
  readonly label: string;
  readonly color: string;
  readonly icon: string;
}

const RISK_LEVEL_PRESENTATION: Record<RiskLevel, RiskLevelPresentation> = {
  [RiskLevel.None]: { label: "No known risk", color: "#27ae60", icon: "✅" },
  [RiskLevel.Low]: { label: "Low — minor signals detected", color: "#16a085", icon: "ℹ️" },
  [RiskLevel.Elevated]: { label: "Elevated — review before sending", color: "#e67e22", icon: "⚠️" },
  [RiskLevel.High]: { label: "High — strong scam signals", color: "#d35400", icon: "🔶" },
  [RiskLevel.Critical]: { label: "Critical — send blocked", color: "#c0392b", icon: "🛑" },
};

export function describeRiskLevel(level: RiskLevel): RiskLevelPresentation {
  return RISK_LEVEL_PRESENTATION[level];
}

const SCAM_CATEGORY_LABEL: Record<ScamCategory, string> = {
  "pig-butchering": "Pig-butchering scam",
  "fake-support": "Fake support impersonation",
  "recovery-scam": "Fund recovery scam",
  "romance-scam": "Romance scam",
  "fake-investment-platform": "Fake investment platform",
  "urgency-pressure": "Urgency/pressure tactics",
  "address-poisoning": "Lookalike address (poisoning attempt)",
  "task-scam": "Task/job scam",
  "impersonation-authority": "Authority impersonation",
  "airdrop-claim-fee": "Fake airdrop claim fee",
  "otc-escrow-scam": "OTC escrow scam",
  "phishing-approval-drain": "Phishing / approval drain",
};

export function describeScamCategory(category: ScamCategory): string {
  return SCAM_CATEGORY_LABEL[category];
}
