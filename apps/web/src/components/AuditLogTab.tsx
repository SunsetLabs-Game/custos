import { useState, useEffect } from "react";
import { Icon } from "../Icon.js";
import { auditLog } from "../compositionRoot.js";
import type { AuditLogEntry } from "@custos/adapters-storage";
import { presentSummary } from "../riskPresentation.js";

const DECISION_LABEL: Record<string, string> = {
  cancelled: "Cancelado",
  "proceed-with-acknowledged-risk": "Enviado con riesgo",
  proceed: "Enviado",
};

export function AuditLogTab({ onClear }: { onClear?: () => void }) {
  const [entries, setEntries] = useState<readonly AuditLogEntry[]>([]);

  const refreshLogs = () => setEntries(auditLog.list());

  useEffect(() => {
    refreshLogs();
  }, []);

  const handleClear = () => {
    auditLog.clear();
    refreshLogs();
    if (onClear) onClear();
  };

  return (
    <section className="card-focus">
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
        <div className="section-head" style={{ marginBottom: "20px" }}>
          <span className="eyebrow">Auditoría local</span>
          <h2>Decisiones registradas en este dispositivo</h2>
          <p>
            Cada evaluación y su desenlace quedan solo en memoria de este navegador. No se envía
            telemetría a ningún servidor.
          </p>
        </div>

        {entries.length > 0 && (
          <button className="btn-secondary" style={{ fontSize: "12px" }} onClick={handleClear}>
            <Icon name="delete_sweep" size={15} />
            <span>Limpiar</span>
          </button>
        )}
      </div>

      {entries.length === 0 ? (
        <p style={{ fontSize: "13px", color: "var(--upguard-text-muted)", padding: "32px 0", textAlign: "center" }}>
          Todavía no hay registros. Analice un envío en el escudo para generar el primero.
        </p>
      ) : (
        <div>
          {entries.map((entry, index) => {
            const level = entry.assessment.level;
            const isCritical = level === 4;
            const isElevated = level === 2 || level === 3;
            const color = isCritical
              ? "var(--color-critical)"
              : isElevated
              ? "var(--color-elevated)"
              : "var(--color-safe)";

            return (
              <div className="row-item" key={index}>
                <div style={{ display: "flex", alignItems: "center", gap: "14px", minWidth: 0 }}>
                  <Icon
                    name={isCritical ? "block" : isElevated ? "warning" : "check"}
                    size={17}
                    style={{ color, flexShrink: 0 }}
                  />
                  <div style={{ minWidth: 0 }}>
                    <strong style={{ fontSize: "13px", color: "var(--upguard-text-headings)", display: "block" }}>
                      {presentSummary(entry.assessment)}
                    </strong>
                    <span className="mono" style={{ fontSize: "11px", color: "var(--upguard-text-muted)" }}>
                      {new Date(entry.recordedAt).toLocaleString("es-ES")} · nivel {level} ·{" "}
                      {entry.assessment.matches.length} coincidencia(s)
                    </span>
                  </div>
                </div>

                <span
                  className="mono"
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    color: entry.decision.kind === "cancelled" ? "var(--color-critical)" : "var(--color-safe)",
                  }}
                >
                  {DECISION_LABEL[entry.decision.kind] ?? entry.decision.kind}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
