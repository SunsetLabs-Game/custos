import type { RiskAssessment, TranslatedChatMessage } from "@custos/core";
import { presentMatch, presentRiskLevel } from "./riskPresentation.js";
import { color, font, radius, space } from "./theme.js";

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
        marginTop: space.lg,
        padding: space.lg,
        borderRadius: radius.card,
        background: view.bg,
        border: `1px solid ${view.border}`,
        boxShadow: `0 0 0 1px ${view.border}`,
      }}
    >
      <h2
        id="risk-heading"
        style={{ margin: 0, fontFamily: font.body, fontSize: 16, fontWeight: 600, color: view.color }}
      >
        <span aria-hidden="true" style={{ marginRight: space.sm }}>
          {view.icon}
        </span>
        {view.label}
      </h2>
      <p style={{ marginTop: space.sm, fontFamily: font.body, fontSize: 14, color: color.textSecondary }}>
        {view.hint}
      </p>

      {network && (
        <span
          style={{
            display: "inline-block",
            marginTop: space.sm,
            padding: "2px 8px",
            borderRadius: radius.badge,
            fontFamily: font.mono,
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: color.onDevice,
            background: color.onDeviceBg,
            border: `1px solid ${color.onDeviceBorder}`,
          }}
        >
          {networkLabel(network)} detected
        </span>
      )}

      {translated && (
        <p style={{ marginTop: space.sm, fontFamily: font.body, fontSize: 13, color: color.textMuted }}>
          Translated on-device: {translated.originalLanguage} → {translated.targetLanguage}
        </p>
      )}

      <p style={{ marginTop: space.md, fontFamily: font.body, fontSize: 14, color: color.textPrimary }}>
        {assessment.summary}
      </p>

      {assessment.matches.length > 0 && (
        <ul style={{ listStyle: "none", margin: `${space.md}px 0 0`, padding: 0, display: "grid", gap: space.sm }}>
          {assessment.matches.map((match, index) => {
            const presented = presentMatch(match);
            return (
              <li
                key={`${match.pattern.id}-${index}`}
                style={{
                  padding: space.md,
                  borderRadius: radius.input,
                  background: color.surfaceRecessed,
                  border: `1px solid ${color.stroke}`,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: space.sm }}>
                  <strong style={{ fontFamily: font.body, fontSize: 13, color: color.textPrimary }}>
                    {presented.categoryLabel}
                  </strong>
                  <span
                    style={{
                      flexShrink: 0,
                      padding: "2px 8px",
                      borderRadius: radius.badge,
                      fontFamily: font.mono,
                      fontSize: 11,
                      color: view.color,
                      background: view.bg,
                      border: `1px solid ${view.border}`,
                    }}
                  >
                    {presented.confidenceLabel}
                  </span>
                </div>
                {presented.evidence && (
                  <div
                    style={{
                      marginTop: space.xs,
                      fontFamily: font.mono,
                      fontSize: 12,
                      color: color.textMuted,
                    }}
                  >
                    "{presented.evidence}"
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
