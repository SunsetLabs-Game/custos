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
    label: "Sin riesgo conocido",
    hint: "Ni la dirección ni el chat coinciden con un patrón de estafa conocido.",
    color: tokens.safe,
    bg: tokens.safeBg,
    border: tokens.safeBorder,
    icon: "✓",
  },
  [RiskLevel.Low]: {
    label: "Riesgo bajo",
    hint: "Solo señales débiles. Aun así conviene revisar antes de enviar.",
    color: tokens.safe,
    bg: tokens.safeBg,
    border: tokens.safeBorder,
    icon: "i",
  },
  [RiskLevel.Elevated]: {
    label: "Riesgo elevado — revise antes de enviar",
    hint: "Este envío necesita una comprobación explícita. No se apresure.",
    color: tokens.elevated,
    bg: tokens.elevatedBg,
    border: tokens.elevatedBorder,
    icon: "!",
  },
  [RiskLevel.High]: {
    label: "Riesgo alto",
    hint: "Coincidencia fuerte con un patrón de estafa. Continúe solo si confía plenamente en el destino.",
    color: tokens.elevated,
    bg: tokens.elevatedBg,
    border: tokens.elevatedBorder,
    icon: "!",
  },
  [RiskLevel.Critical]: {
    label: "Riesgo crítico — envío bloqueado",
    hint: "Custos no permite firmar esta transferencia.",
    color: tokens.critical,
    bg: tokens.criticalBg,
    border: tokens.criticalBorder,
    icon: "✕",
  },
};

export const SCAM_CATEGORY_LABELS: Record<ScamCategory, string> = {
  "pig-butchering": "Pig butchering (relación o inversión falsa)",
  "fake-support": "Soporte falso de wallet o exchange",
  "recovery-scam": "Falso agente de recuperación de fondos",
  "romance-scam": "Estafa romántica",
  "fake-investment-platform": "Plataforma de inversión falsa",
  "urgency-pressure": "Presión por urgencia o secreto",
  "address-poisoning": "Address poisoning (destino parecido)",
  "task-scam": "Estafa de tareas o empleo",
  "impersonation-authority": "Suplantación de autoridad",
  "airdrop-claim-fee": "Trampa de comisión por airdrop",
  "otc-escrow-scam": "Estafa de custodia OTC",
  "phishing-approval-drain": "Drenaje por aprobación de phishing",
};

export function presentRiskLevel(level: RiskLevel): RiskLevelView {
  return RISK_LEVEL_VIEW[level];
}

/**
 * Spanish one-liner for an assessment. Built here rather than read from
 * `assessment.summary` so the domain layer stays language-agnostic.
 */
export function presentSummary(assessment: {
  matches: readonly ScamMatch[];
  addressReputation?: { flagged: boolean };
}): string {
  if (assessment.addressReputation?.flagged) {
    return "La dirección de destino está en la lista de estafas conocidas.";
  }
  if (assessment.matches.length === 0) {
    return "No se detectó ningún patrón de estafa conocido.";
  }
  const top = [...assessment.matches].sort((a, b) => b.confidence - a.confidence)[0]!;
  return `Coincide con “${SCAM_CATEGORY_LABELS[top.pattern.category]}” (${Math.round(
    top.confidence * 100,
  )}% de confianza).`;
}

export function presentMatch(match: ScamMatch): MatchView {
  return {
    categoryLabel: SCAM_CATEGORY_LABELS[match.pattern.category],
    evidence: match.evidenceSnippet,
    confidenceLabel: `${Math.round(match.confidence * 100)}% de confianza`,
  };
}
