import { useState, useEffect, useCallback } from "react";
import { Icon } from "../Icon.js";
import { riskList, syncRiskList } from "../compositionRoot.js";
import { parseDestinationAddress } from "@custos/core";
import type { FlaggedAddress } from "@custos/adapters-p2p";
import { SCAM_CATEGORY_LABELS } from "../riskPresentation.js";

function shorten(value: string): string {
  return value.length > 20 ? `${value.slice(0, 10)}…${value.slice(-8)}` : value;
}

/** Categories offered for a manual report, plus a catch-all. */
const REASON_OPTIONS: { value: string; label: string }[] = [
  ...Object.entries(SCAM_CATEGORY_LABELS).map(([value, label]) => ({ value, label })),
  { value: "manual", label: "Otro motivo" },
];

function reasonLabel(category: string): string {
  return SCAM_CATEGORY_LABELS[category as keyof typeof SCAM_CATEGORY_LABELS] ?? "Otro motivo";
}

export function P2pSwarmTab() {
  const [reportAddr, setReportAddr] = useState("");
  const [reportCategory, setReportCategory] = useState("fake-support");
  const [reportDetail, setReportDetail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [entries, setEntries] = useState<readonly FlaggedAddress[]>([]);

  const refresh = useCallback(() => {
    setEntries(riskList.list());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleManualReport = async () => {
    const parsed = parseDestinationAddress(reportAddr);
    if (!parsed.ok) {
      setErr(
        parsed.reason === "empty"
          ? "Ingrese una dirección para reportar."
          : "Dirección inválida. Debe ser de Tron (T…) o Ethereum (0x…)."
      );
      return;
    }

    setSubmitting(true);
    setErr(null);
    setMessage(null);

    try {
      await syncRiskList.reportScam(parsed.address, {
        category: reportCategory,
        detail: reportDetail.trim() || `Reportada manualmente como ${reasonLabel(reportCategory).toLowerCase()}`,
      });
      setMessage(
        `${shorten(parsed.address.value)} quedó reportada. Cualquier envío a esta dirección se bloqueará.`
      );
      setReportAddr("");
      setReportDetail("");
      refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error al registrar el reporte.");
    } finally {
      setSubmitting(false);
    }
  };

  const localReports = entries.filter((e) => e.source === "local-user-report").length;
  const peerReports = entries.filter((e) => e.source === "p2p-sync").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <section className="card-focus">
        <div className="section-head">
          <span className="eyebrow">Reportes de direcciones</span>
          <h2>Direcciones que marcaste como estafa</h2>
          <p>
            Reportar una dirección es la señal más fuerte del sistema. A diferencia del análisis de
            texto, que solo eleva el riesgo y pide confirmación, una dirección reportada pasa
            directamente a <strong style={{ color: "var(--color-critical)" }}>riesgo crítico</strong>: el
            escudo deja de preparar la transacción y no hay nada que firmar.
          </p>
        </div>

        {/* What a report does, end to end */}
        <ol
          style={{
            listStyle: "none",
            margin: "0 0 22px",
            padding: 0,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
            gap: "14px",
          }}
        >
          {[
            { n: "1", title: "Reportas una dirección", body: "Desde aquí, o desde el resultado de una evaluación." },
            { n: "2", title: "Entra en el caché local", body: "Se guarda en este dispositivo, junto a su origen y fecha." },
            { n: "3", title: "Bloquea envíos futuros", body: "El escudo la marca como crítica antes de preparar nada." },
          ].map((step) => (
            <li key={step.n} style={{ display: "flex", gap: "10px" }}>
              <span
                className="mono"
                style={{
                  fontSize: "10px",
                  color: "var(--upguard-text-muted)",
                  border: "1px solid var(--upguard-border)",
                  borderRadius: "50%",
                  width: 20,
                  height: 20,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {step.n}
              </span>
              <div>
                <strong style={{ fontSize: "12.5px", color: "var(--upguard-text-headings)", display: "block", marginBottom: "2px" }}>
                  {step.title}
                </strong>
                <span style={{ fontSize: "12px", color: "var(--upguard-text-body)", lineHeight: 1.45 }}>{step.body}</span>
              </div>
            </li>
          ))}
        </ol>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: "1px",
            background: "var(--upguard-border)",
            borderRadius: "var(--radius-card)",
            overflow: "hidden",
          }}
        >
          {[
            { label: "Reportadas en total", value: String(entries.length), color: "var(--upguard-text-headings)" },
            { label: "Reportes propios", value: String(localReports), color: "var(--upguard-text-headings)" },
            { label: "Recibidos de pares", value: String(peerReports), color: "var(--upguard-text-headings)" },
          ].map((stat) => (
            <div key={stat.label} style={{ padding: "16px", background: "var(--upguard-layer-soft)" }}>
              <span
                style={{ fontSize: "10px", color: "var(--upguard-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block" }}
              >
                {stat.label}
              </span>
              <strong className="mono" style={{ fontSize: "20px", color: stat.color, display: "block", marginTop: "4px" }}>
                {stat.value}
              </strong>
            </div>
          ))}
          <div style={{ padding: "16px", background: "var(--upguard-layer-soft)" }}>
            <span
              style={{ fontSize: "10px", color: "var(--upguard-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block" }}
            >
              Sincronización P2P
            </span>
            <strong style={{ fontSize: "13px", color: "var(--color-elevated)", display: "block", marginTop: "7px" }}>
              No disponible
            </strong>
          </div>
        </div>

        <p style={{ margin: "14px 0 0", fontSize: "12px", color: "var(--upguard-text-muted)", lineHeight: 1.55 }}>
          <Icon name="error" size={13} style={{ verticalAlign: "-2px", marginRight: "6px" }} />
          El gossip Hyperswarm necesita UDP/DHT sin restricciones, que el navegador no expone: aquí
          los reportes son solo tuyos y viven en este dispositivo. El mismo adaptador sí sincroniza
          con otros pares cuando corre sobre Bare o Node.
        </p>
      </section>

      <section className="card-focus">
        <div className="section-head" style={{ marginBottom: "16px" }}>
          <h2 style={{ fontSize: "17px" }}>Reportar una dirección</h2>
          <p>Úsalo si ya identificaste una dirección de estafa y no quieres poder enviarle nada por error.</p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div>
            <div className="form-label">
              <span>Dirección</span>
            </div>
            <input
              type="text"
              className="form-input mono"
              value={reportAddr}
              onChange={(e) => {
                setReportAddr(e.target.value);
                setErr(null);
              }}
              placeholder="T… / 0x…"
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
            <div>
              <div className="form-label">
                <span>Motivo</span>
              </div>
              <select
                className="form-input"
                value={reportCategory}
                onChange={(e) => setReportCategory(e.target.value)}
                style={{ appearance: "none", cursor: "pointer" }}
              >
                {REASON_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="form-label">
                <span>
                  Detalle <span style={{ color: "var(--upguard-text-muted)", textTransform: "none", fontWeight: 400 }}>(opcional)</span>
                </span>
              </div>
              <input
                type="text"
                className="form-input"
                value={reportDetail}
                onChange={(e) => setReportDetail(e.target.value)}
                placeholder="Ej.: me pidió un depósito para liberar un retiro"
              />
            </div>
          </div>

          <button
            className="btn-upguard-primary"
            onClick={handleManualReport}
            disabled={submitting || !reportAddr.trim()}
            style={{ width: "100%" }}
          >
            {submitting ? <span className="spinner" /> : <Icon name="share" size={15} />}
            <span>Reportar dirección</span>
          </button>
        </div>

        {err && <p style={{ color: "var(--color-critical)", fontSize: "12px", marginTop: "10px" }}>{err}</p>}
        {message && <p style={{ color: "var(--color-safe)", fontSize: "12px", marginTop: "10px" }}>{message}</p>}
      </section>

      <section className="card-focus">
        <div className="section-head" style={{ marginBottom: "8px" }}>
          <h2 style={{ fontSize: "17px" }}>
            Reportadas {entries.length > 0 && <span className="mono" style={{ color: "var(--upguard-text-muted)", fontSize: "14px" }}>({entries.length})</span>}
          </h2>
        </div>

        {entries.length === 0 ? (
          <div style={{ padding: "28px 0", textAlign: "center" }}>
            <p style={{ fontSize: "13px", color: "var(--upguard-text-body)", margin: "0 0 4px" }}>
              Todavía no has reportado ninguna dirección.
            </p>
            <p style={{ fontSize: "12px", color: "var(--upguard-text-muted)", margin: 0 }}>
              Repórtalas desde el formulario de arriba o desde el resultado de una evaluación en el escudo.
            </p>
          </div>
        ) : (
          <div>
            {entries.map((entry) => (
              <div
                className="row-item"
                key={`${entry.address.network}:${entry.address.value}`}
                style={{ alignItems: "flex-start" }}
              >
                <div style={{ minWidth: 0 }}>
                  <code className="mono" style={{ fontSize: "12.5px", color: "var(--color-critical)", wordBreak: "break-all" }}>
                    {entry.address.value}
                  </code>

                  {/* The cause — so the entry is a claim you can judge, not a bare address */}
                  {entry.reason && (
                    <div style={{ display: "flex", alignItems: "center", gap: "7px", marginTop: "6px", flexWrap: "wrap" }}>
                      <span
                        className="mono"
                        style={{
                          fontSize: "10px",
                          color: "var(--color-critical)",
                          background: "var(--color-critical-bg)",
                          borderRadius: "var(--radius-badge)",
                          padding: "3px 7px",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                        }}
                      >
                        {reasonLabel(entry.reason.category)}
                      </span>
                      <span style={{ fontSize: "11.5px", color: "var(--upguard-text-body)" }}>
                        {entry.reason.detail}
                      </span>
                    </div>
                  )}

                  <span style={{ fontSize: "11px", color: "var(--upguard-text-muted)", display: "block", marginTop: "5px" }}>
                    {entry.address.network === "tron" ? "Tron · TRC-20" : "Ethereum · ERC-20"} ·{" "}
                    {entry.source === "local-user-report" ? "lo reportaste tú" : "recibido de un par"} · bloquea el envío
                  </span>
                </div>
                <span className="mono" style={{ fontSize: "11px", color: "var(--upguard-text-muted)", whiteSpace: "nowrap" }}>
                  {entry.firstSeenAt.toLocaleString("es-ES")}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
