import { useState } from "react";
import { Icon } from "../Icon.js";
import { analyzeScreenshot } from "../compositionRoot.js";
import { presentMatch } from "../riskPresentation.js";
import type { AnalyzeScreenshotResult } from "@custos/core";

export function VisionTab({
  onSelectScam,
}: {
  onSelectScam: (data: { address: string; context: string; amount: string }) => void;
}) {
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState<string>("");
  const [result, setResult] = useState<AnalyzeScreenshotResult | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setAnalyzing(true);
    setError(null);
    setResult(null);
    setProgress("Cargando modelo OCR…");

    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(file));

    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      setProgress("Reconociendo texto en el dispositivo…");
      setResult(await analyzeScreenshot.execute(bytes));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo procesar la imagen.");
    } finally {
      setAnalyzing(false);
      setProgress("");
    }
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
  };

  const firstAddress = result?.addressCandidates[0];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <section className="card-focus">
        <div className="section-head">
          <span className="eyebrow">VisionPsy · OCR</span>
          <h2>Analizar una captura de pantalla</h2>
          <p>
            Extrae el texto y las direcciones de una captura (chat, panel de inversión falso) y las
            pasa por el mismo detector de estafas. El reconocimiento corre en un Web Worker de este
            navegador: la imagen nunca se sube a ningún servidor.
          </p>
        </div>

        <label
          htmlFor="file-upload-input"
          style={{
            display: "block",
            border: "1px dashed var(--upguard-border-strong)",
            borderRadius: "var(--radius-card)",
            padding: "28px 20px",
            textAlign: "center",
            background: "var(--upguard-bg)",
            cursor: analyzing ? "default" : "pointer",
          }}
        >
          <input
            id="file-upload-input"
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={onInputChange}
            disabled={analyzing}
          />
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "var(--radius-input)",
              background: "var(--upguard-layer-strong)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 12px",
              color: "var(--upguard-text-headings)",
            }}
          >
            {analyzing ? <span className="spinner" /> : <Icon name="file_upload" size={20} />}
          </div>
          <strong style={{ fontSize: "13.5px", color: "var(--upguard-text-headings)", display: "block" }}>
            {analyzing ? progress || "Procesando…" : "Seleccione una captura de pantalla"}
          </strong>
          <span style={{ fontSize: "12px", color: "var(--upguard-text-muted)", marginTop: "4px", display: "block" }}>
            PNG, JPG o WebP · procesamiento local
          </span>
        </label>

        {error && (
          <p style={{ color: "var(--color-critical)", fontSize: "12px", marginTop: "12px" }}>{error}</p>
        )}
      </section>

      {result && (
        <section className="card-focus">
          <div className="section-head" style={{ marginBottom: "16px" }}>
            <h2 style={{ fontSize: "17px" }}>Resultado de la extracción</h2>
            <p>
              {result.extractedText.trim()
                ? `${result.extractedText.trim().split(/\s+/).length} palabras reconocidas · ${result.addressCandidates.length} dirección(es) detectada(s)`
                : "El OCR no encontró texto legible en esta imagen."}
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: preview ? "repeat(auto-fit, minmax(260px, 1fr))" : "1fr", gap: "20px", alignItems: "start" }}>
            {preview && (
              <img
                src={preview}
                alt="Captura analizada"
                style={{ width: "100%", borderRadius: "var(--radius-card)", border: "1px solid var(--upguard-border)" }}
              />
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "16px", minWidth: 0 }}>
              {result.addressCandidates.length > 0 && (
                <div>
                  <span className="eyebrow">Direcciones detectadas</span>
                  {result.addressCandidates.map((candidate) => (
                    <code
                      key={candidate}
                      className="mono"
                      style={{
                        display: "block",
                        fontSize: "12px",
                        color: "var(--color-info)",
                        wordBreak: "break-all",
                        padding: "8px 10px",
                        background: "var(--upguard-bg)",
                        borderRadius: "var(--radius-input)",
                        marginBottom: "6px",
                      }}
                    >
                      {candidate}
                    </code>
                  ))}
                </div>
              )}

              {result.matches.length > 0 && (
                <div>
                  <span className="eyebrow">Patrones de estafa encontrados</span>
                  {result.matches.map((match, i) => {
                    const view = presentMatch(match);
                    return (
                      <div
                        key={`${match.pattern.id}-${i}`}
                        style={{
                          padding: "10px 12px",
                          borderRadius: "var(--radius-input)",
                          background: "var(--color-critical-bg)",
                          marginBottom: "6px",
                        }}
                      >
                        <strong style={{ fontSize: "12.5px", color: "var(--color-critical)", display: "block" }}>
                          {view.categoryLabel}
                        </strong>
                        {view.evidence && (
                          <span className="mono" style={{ fontSize: "11px", color: "var(--upguard-text-body)" }}>
                            “{view.evidence}” · {view.confidenceLabel}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {result.extractedText.trim() && (
                <div>
                  <span className="eyebrow">Texto reconocido</span>
                  <pre
                    className="mono"
                    style={{
                      background: "var(--upguard-bg)",
                      padding: "12px",
                      borderRadius: "var(--radius-input)",
                      color: "var(--upguard-text-body)",
                      fontSize: "11.5px",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      maxHeight: "220px",
                      overflowY: "auto",
                      margin: 0,
                    }}
                  >
                    {result.extractedText}
                  </pre>
                </div>
              )}

              <button
                className="btn-upguard-primary"
                style={{ width: "100%" }}
                disabled={!firstAddress && !result.extractedText.trim()}
                onClick={() =>
                  onSelectScam({
                    address: firstAddress ?? "",
                    context: result.extractedText,
                    amount: "1",
                  })
                }
              >
                <Icon name="shield" size={17} />
                <span>Enviar al escudo de envíos</span>
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
