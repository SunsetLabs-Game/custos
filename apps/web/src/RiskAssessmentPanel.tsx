import type { RiskAssessment, TranslatedChatMessage } from "@custos/core";
import { presentMatch, presentRiskLevel } from "./riskPresentation.js";

function networkLabel(network: string): string {
  if (network === "tron") return "Tron";
  if (network === "ethereum") return "Ethereum";
  return network;
}

export function RiskAssessmentPanel({
  assessment,
  translated,
}: {
  assessment: RiskAssessment;
  translated?: TranslatedChatMessage | null;
}) {
  const view = presentRiskLevel(assessment.level);
  const network = assessment.addressReputation?.address.network;

  return (
    <section
      aria-labelledby="risk-heading"
      style={{
        marginTop: 20,
        padding: 16,
        border: "2px solid",
        borderColor: view.color,
        borderRadius: 8,
      }}
    >
      <h2 id="risk-heading" style={{ margin: 0, fontSize: "1.1rem", color: view.color }}>
        <span aria-hidden="true" style={{ marginRight: 8 }}>
          {view.icon}
        </span>
        {view.label}
      </h2>
      <p style={{ marginTop: 8 }}>{view.hint}</p>
      {network && <p>Detected network: {networkLabel(network)}</p>}
      {translated && (
        <p>
          Translated on-device from {translated.originalLanguage} to {translated.targetLanguage}.
        </p>
      )}
      <p>{assessment.summary}</p>
      {assessment.matches.length > 0 && (
        <ul style={{ margin: "12px 0 0", paddingLeft: 20 }}>
          {assessment.matches.map((match, index) => {
            const presented = presentMatch(match);
            return (
              <li key={`${match.pattern.id}-${index}`} style={{ marginTop: 8 }}>
                <strong>{presented.categoryLabel}</strong>
                <span> ({presented.confidenceLabel})</span>
                {presented.evidence && (
                  <div style={{ marginTop: 4, color: "#333" }}>
                    Evidence: "{presented.evidence}"
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
