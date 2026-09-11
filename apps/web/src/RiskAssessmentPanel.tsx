import type { RiskAssessment, TranslatedChatMessage } from "@custos/core";
import { presentMatch, presentRiskLevel, presentSummary } from "./riskPresentation.js";
import { Icon } from "./Icon.js";

function networkLabel(network: string): string {
  if (network === "tron") return "Tron (TRC-20)";
  if (network === "ethereum") return "Ethereum (ERC-20)";
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
      className={`glass-panel ${assessment.level >= 4 ? "glow-critical" : assessment.level >= 2 ? "glow-elevated" : "glow-safe"}`}
      style={{
        padding: "24px",
      }}
    >
      <h2
        id="risk-heading"
        style={{ margin: 0, fontSize: "18px", fontWeight: 800, color: "#ffffff", display: "flex", alignItems: "center", gap: "10px" }}
      >
        <Icon name={assessment.level >= 4 ? "block" : assessment.level >= 2 ? "warning" : "check_circle"} size={22} style={{ color: view.color }} />
        <span>{view.label}</span>
      </h2>
      
      <p style={{ marginTop: "8px", fontSize: "14px", color: "var(--upguard-text-body)" }}>
        {view.hint}
      </p>

      {network && (
        <span
          className="badge badge-tech"
          style={{ marginTop: "12px" }}
        >
          <Icon name="hub" size={12} />
          {networkLabel(network)} Detectada
        </span>
      )}

      {translated && (
        <div style={{
          marginTop: "12px",
          padding: "10px 14px",
          borderRadius: "var(--radius-input)",
          background: "var(--color-info-bg)",
          border: "1px solid var(--color-info-border)",
          fontSize: "12px",
          color: "var(--color-info)",
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}>
          <Icon name="translate" size={16} />
          <span>TranslatePsy On-Device: Idioma detectado ({translated.originalLanguage.toUpperCase()}) → Traducido localmente</span>
        </div>
      )}

      <p style={{ marginTop: "16px", fontSize: "14px", color: "#f8fafc", lineHeight: 1.5, fontWeight: 500 }}>
        {presentSummary(assessment)}
      </p>

      {assessment.matches.length > 0 && (
        <div style={{ marginTop: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
          <span style={{ fontSize: "12px", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.04em", color: "#94a3b8" }}>
            Coincidencias de Patrón Detectadas ({assessment.matches.length}):
          </span>

          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "12px" }}>
            {assessment.matches.map((match, index) => {
              const presented = presentMatch(match);
              return (
                <li
                  key={`${match.pattern.id}-${index}`}
                  style={{
                    padding: "14px 18px",
                    borderRadius: "var(--radius-card)",
                    background: "var(--upguard-layer-strong)",
                    border: "1px solid var(--upguard-border)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
                    <strong style={{ fontSize: "13px", color: "#f8fafc", display: "flex", alignItems: "center", gap: "8px" }}>
                      <Icon name="warning" size={16} style={{ color: view.color }} />
                      {presented.categoryLabel}
                    </strong>
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: "6px",
                        fontFamily: "var(--font-mono)",
                        fontSize: "11px",
                        fontWeight: 700,
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
                        marginTop: "4px",
                        fontFamily: "var(--font-mono)",
                        fontSize: "12px",
                        color: "var(--upguard-text-muted)",
                        background: "var(--upguard-bg)",
                        padding: "8px 12px",
                        borderRadius: "6px",
                        border: "1px solid var(--upguard-border)"
                      }}
                    >
                      "{presented.evidence}"
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}
