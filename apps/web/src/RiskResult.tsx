import type { RiskAssessment } from "@custos/core";
import { requiresHardBlock } from "@custos/core";
import { describeRiskLevel, describeScamCategory } from "./riskPresentation.js";

export function RiskResult({ assessment }: { assessment: RiskAssessment }) {
  const { label, color, icon } = describeRiskLevel(assessment.level);

  return (
    <div style={{ marginTop: 20, padding: 16, border: "2px solid", borderColor: color }}>
      <strong style={{ color }}>
        {icon} {label}
      </strong>
      <p>{assessment.summary}</p>
      {assessment.matches.length > 0 && (
        <ul style={{ paddingLeft: 20 }}>
          {assessment.matches.map((match, i) => (
            <li key={i}>
              {describeScamCategory(match.pattern.category)}
              {match.evidenceSnippet ? ` — ${match.evidenceSnippet}` : ""}
            </li>
          ))}
        </ul>
      )}
      {requiresHardBlock(assessment.level) && <p>This send would be blocked — WDK signing must not proceed.</p>}
    </div>
  );
}
