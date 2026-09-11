import { useState, useEffect, useCallback } from "react";
import type { Address, ChatMessage, PreparedTransfer, RiskAssessment, SendDecision, TranslatedChatMessage } from "@custos/core";
import { languageTag, parseDestinationAddress, requiresFriction, requiresHardBlock, detectChainNetwork, detectAddressPoisoning } from "@custos/core";
import { analyzeSendIntent, recordUserDecision, syncRiskList, translateAndAnalyzeMessage, tronWallet } from "../compositionRoot.js";
import { RiskAssessmentPanel } from "../RiskAssessmentPanel.js";
import { Icon } from "../Icon.js";
import { WalletStrip } from "./WalletStrip.js";
import type { FeeEstimate, WalletSnapshot } from "../wallet/TronUsdtWalletAdapter.js";
import { getDemoCounterpartyAddress } from "../wallet/demoWallet.js";
import { NILE_EXPLORER_TX } from "../wallet/tronNetwork.js";

function isTranslated(message: { text: string }): message is TranslatedChatMessage {
  return "originalText" in message;
}

function userLanguage() {
  const tag = typeof navigator !== "undefined" && navigator.language ? navigator.language.slice(0, 2) : "en";
  return languageTag(tag || "en");
}

export function ProtectorTab({
  initialAddress = "",
  initialContext = "",
  initialAmount = "1",
  onDecisionRecorded,
}: {
  initialAddress?: string;
  initialContext?: string;
  initialAmount?: string;
  onDecisionRecorded?: () => void;
}) {
  const [address, setAddress] = useState(initialAddress);
  const [amount, setAmount] = useState(initialAmount);
  const [context, setContext] = useState(initialContext);

  const [destination, setDestination] = useState<Address | null>(null);
  const [assessment, setAssessment] = useState<RiskAssessment | null>(null);
  const [translated, setTranslated] = useState<TranslatedChatMessage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [analysisStep, setAnalysisStep] = useState<string>("");

  const [reporting, setReporting] = useState(false);
  const [reported, setReported] = useState(false);

  const [preparedTransfer, setPreparedTransfer] = useState<PreparedTransfer | null>(null);
  const [fee, setFee] = useState<FeeEstimate | null>(null);
  const [decision, setDecision] = useState<SendDecision["kind"] | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txCopied, setTxCopied] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [deciding, setDeciding] = useState(false);

  const [wallet, setWallet] = useState<WalletSnapshot | null>(null);
  const [walletLoading, setWalletLoading] = useState(true);
  const [walletLoadError, setWalletLoadError] = useState<string | null>(null);

  const refreshWallet = useCallback(async () => {
    setWalletLoading(true);
    setWalletLoadError(null);
    try {
      setWallet(await tronWallet.snapshot());
    } catch (err) {
      setWalletLoadError(err instanceof Error ? err.message : "No se pudo leer la cuenta on-chain.");
    } finally {
      setWalletLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshWallet();
  }, [refreshWallet]);

  useEffect(() => {
    if (initialAddress) setAddress(initialAddress);
    if (initialContext) setContext(initialContext);
    if (initialAmount) setAmount(initialAmount);
  }, [initialAddress, initialContext, initialAmount]);

  const parsedAddressObj = parseDestinationAddress(address.trim());
  const destinationObj = parsedAddressObj.ok ? parsedAddressObj.address : null;
  const detectedChain = destinationObj ? destinationObj.network : (address.trim() ? detectChainNetwork(address.trim()) : null);

  // Stands in for the wallet's own send history, which is what the poisoning
  // check compares against. Seeded so the lookalike case is demonstrable.
  const recentRecipients: Address[] = [
    { value: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t", network: "tron" },
    { value: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045", network: "ethereum" },
  ];
  const poisoningMatch = destinationObj ? detectAddressPoisoning(destinationObj, recentRecipients) : null;

  async function useTestDestination() {
    setAddress(await getDemoCounterpartyAddress());
    setError(null);
  }

  async function handleCheck() {
    const parsed = parseDestinationAddress(address);
    if (!parsed.ok) {
      setError(
        parsed.reason === "empty"
          ? "Ingrese una dirección de destino."
          : "La dirección no es un formato válido de Tron (T...) o Ethereum (0x...)."
      );
      setAssessment(null);
      return;
    }

    setBusy(true);
    setError(null);
    setAssessment(null);
    setTranslated(null);
    setReported(false);
    setPreparedTransfer(null);
    setFee(null);
    setDecision(null);
    setTxHash(null);
    setWalletError(null);

    try {
      const pasted = context.trim();
      let contextPayload: ChatMessage | undefined;
      let textMatches;

      if (pasted) {
        setAnalysisStep("Traduciendo texto en el dispositivo…");
        const ta = await translateAndAnalyzeMessage.execute(pasted, userLanguage());
        contextPayload = { text: ta.message.text, detectedLanguage: ta.message.detectedLanguage };
        textMatches = ta.matches;
        setTranslated(isTranslated(ta.message) ? ta.message : null);
      }

      setAnalysisStep("Evaluando heurísticas y reputación P2P…");
      const intent = {
        destination: parsed.address,
        amountUsdt: Number(amount) || 0,
        context: contextPayload,
        // Without this the assessment silently skips the poisoning check.
        recentRecipients,
      };

      const result = await analyzeSendIntent.execute(intent, { textMatches });
      setDestination(parsed.address);
      setAssessment(result);

      // Only quote when the send could actually proceed — a hard block never
      // touches the chain.
      if (!requiresHardBlock(result.level) && parsed.address.network === "tron") {
        setAnalysisStep("Cotizando comisión real en Nile…");
        try {
          const [prepared, estimate] = await Promise.all([
            tronWallet.prepare(intent),
            tronWallet
              .estimateFee(intent)
              .catch((err): FeeEstimate => ({ kind: "unavailable", reason: String(err).slice(0, 160) })),
          ]);
          setPreparedTransfer(prepared);
          setFee(estimate);
        } catch (err) {
          setWalletError(err instanceof Error ? err.message : "No se pudo preparar la transferencia.");
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error durante el análisis.");
    } finally {
      setBusy(false);
      setAnalysisStep("");
    }
  }

  async function handleDecision(kind: SendDecision["kind"]) {
    if (!assessment) return;
    setDeciding(true);
    setWalletError(null);
    try {
      if (kind !== "cancelled" && preparedTransfer) {
        const { txHash: hash } = await tronWallet.commit(preparedTransfer);
        setTxHash(hash);
        void refreshWallet();
      }
      await recordUserDecision.execute(assessment, { kind });
      setDecision(kind);
      if (onDecisionRecorded) onDecisionRecorded();
    } catch (err) {
      setWalletError(err instanceof Error ? err.message : "No se pudo completar el envío.");
    } finally {
      setDeciding(false);
    }
  }

  async function handleReportScam() {
    if (!destination) return;
    setReporting(true);
    try {
      // Carry why it was flagged, so the entry isn't a bare address later.
      const top = assessment?.matches.length
        ? [...assessment.matches].sort((a, b) => b.confidence - a.confidence)[0]!
        : null;
      const reason = top
        ? {
            category: top.pattern.category,
            detail: top.evidenceSnippet
              ? `Detectado en el análisis: “${top.evidenceSnippet}” (${Math.round(top.confidence * 100)}% de confianza)`
              : `Detectado en el análisis con ${Math.round(top.confidence * 100)}% de confianza`,
          }
        : { category: "manual", detail: "Reportada por el usuario desde una evaluación sin coincidencias" };

      await syncRiskList.reportScam(destination, reason);
      setReported(true);
    } finally {
      setReporting(false);
    }
  }

  // A send needs TRX for gas *and* enough USDT — otherwise the contract reverts
  // on-chain, so the button stays disabled rather than promising a transfer.
  const requestedUsdt = Number(amount) || 0;
  const hasGas = wallet?.funded ?? false;
  const hasUsdt = (wallet?.usdtBalance ?? 0) >= requestedUsdt && requestedUsdt > 0;
  const canSend = preparedTransfer !== null && hasGas && hasUsdt;

  const blockedReason = !hasGas
    ? "La wallet de demo no tiene TRX para pagar el gas."
    : !hasUsdt
    ? `La wallet de demo tiene ${(wallet?.usdtBalance ?? 0).toFixed(2)} USDT y este envío pide ${requestedUsdt}.`
    : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <WalletStrip
        wallet={wallet}
        loading={walletLoading}
        error={walletLoadError}
        onRefresh={() => void refreshWallet()}
      />

      <section className="card-focus">
        <div className="section-head" style={{ marginBottom: "20px" }}>
          <span className="eyebrow">Escudo de envíos</span>
          <h2>Verificar antes de firmar</h2>
          <p>
            La dirección y el chat se analizan en este dispositivo. Si el riesgo es crítico, la firma
            se deshabilita y no se envía nada a la red.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <div className="form-label">
              <span>Dirección de destino</span>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                {detectedChain && (
                  <span className="mono" style={{ fontSize: "10px", color: "var(--upguard-text-muted)", textTransform: "none", letterSpacing: "0.04em" }}>
                    {detectedChain === "tron" ? "TRON · TRC-20" : "ETHEREUM · ERC-20"}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => void useTestDestination()}
                  style={{
                    background: "transparent",
                    border: "none",
                    padding: 0,
                    color: "var(--color-info)",
                    fontSize: "11px",
                    fontWeight: 600,
                    cursor: "pointer",
                    textTransform: "none",
                    letterSpacing: 0,
                  }}
                >
                  Usar destino de prueba
                </button>
              </div>
            </div>
            <input
              type="text"
              className="form-input mono"
              value={address}
              onChange={(e) => {
                setAddress(e.target.value);
                setError(null);
              }}
              placeholder="TXyz… / 0x…"
              aria-invalid={error !== null}
            />
            {error && (
              <p style={{ color: "var(--color-critical)", fontSize: "12px", marginTop: "6px", display: "flex", alignItems: "center", gap: "4px" }}>
                <Icon name="error" size={14} />
                {error}
              </p>
            )}

            {poisoningMatch && (
              <div style={{
                marginTop: "8px",
                padding: "8px 12px",
                borderRadius: "var(--radius-input)",
                background: "var(--color-elevated-bg)",
                color: "var(--color-elevated)",
                fontSize: "12px",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}>
                <Icon name="warning" size={16} />
                <span>
                  <strong>Address poisoning:</strong> {poisoningMatch.evidenceSnippet || "Esta dirección se parece mucho a un destinatario previo."}
                </span>
              </div>
            )}
          </div>

          <div>
            <div className="form-label">
              <span>Monto (USDT)</span>
              <div style={{ display: "flex", gap: "6px" }}>
                {["0.5", "1", "2"].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setAmount(amt)}
                    style={{
                      background: amount === amt ? "var(--color-info-bg)" : "transparent",
                      border: `1px solid ${amount === amt ? "var(--color-info-border)" : "var(--upguard-border)"}`,
                      color: amount === amt ? "var(--color-info)" : "var(--upguard-text-muted)",
                      borderRadius: "var(--radius-badge)",
                      padding: "2px 8px",
                      fontSize: "11px",
                      cursor: "pointer",
                      textTransform: "none",
                      letterSpacing: 0,
                    }}
                  >
                    {amt}
                  </button>
                ))}
              </div>
            </div>
            <input
              type="number"
              className="form-input mono"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="100"
            />
          </div>

          <div>
            <div className="form-label">
              <span>Chat sospechoso <span style={{ color: "var(--upguard-text-muted)", textTransform: "none", fontWeight: 400 }}>(opcional)</span></span>
              <span style={{ fontSize: "11px", color: "var(--upguard-text-muted)", textTransform: "none", letterSpacing: 0 }}>
                Cualquier idioma
              </span>
            </div>
            <textarea
              className="form-input"
              style={{ minHeight: "88px", resize: "vertical" }}
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Pegue aquí el mensaje del remitente…"
            />
          </div>

          <button
            type="button"
            className="btn-upguard-primary"
            style={{ width: "100%", height: "44px", marginTop: "4px" }}
            onClick={handleCheck}
            disabled={busy || !address.trim()}
          >
            {busy ? (
              <>
                <span className="spinner" />
                <span>{analysisStep || "Analizando…"}</span>
              </>
            ) : (
              <>
                <Icon name="shield" size={17} />
                <span>Analizar riesgo</span>
              </>
            )}
          </button>
        </div>
      </section>

      {assessment && (
        <section
          className={`glass-panel ${
            requiresHardBlock(assessment.level) ? "glow-critical" : requiresFriction(assessment.level) ? "glow-elevated" : "glow-safe"
          }`}
          style={{ padding: "24px" }}
        >
          <RiskAssessmentPanel assessment={assessment} translated={translated} />

          {/* Real on-chain quote — only present when the send isn't blocked */}
          {preparedTransfer && (
            <dl style={{ margin: "20px 0 0", borderTop: "1px solid var(--upguard-border)", paddingTop: "8px" }}>
              <div className="kv">
                <dt>Monto</dt>
                <dd>{amount || 0} USDT</dd>
              </div>
              <div className="kv">
                <dt>Comisión de red (simulada en el nodo)</dt>
                <dd
                  style={{
                    color: fee?.kind === "ok" ? "var(--upguard-text-headings)" : "var(--color-elevated)",
                    fontSize: fee?.kind === "ok" ? undefined : "11px",
                  }}
                >
                  {fee === null && "calculando…"}
                  {fee?.kind === "ok" && `${fee.feeTrx.toFixed(2)} TRX · ${fee.energyUsed.toLocaleString("es")} energía`}
                  {fee?.kind === "insufficient-usdt" && "saldo USDT insuficiente"}
                  {fee?.kind === "unavailable" && "no disponible"}
                </dd>
              </div>
              <div className="kv">
                <dt>Red</dt>
                <dd>Tron Nile · testnet</dd>
              </div>
            </dl>
          )}

          {!decision && (
            <div style={{ marginTop: "20px" }}>
              {requiresHardBlock(assessment.level) ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div style={{
                    padding: "12px 16px",
                    borderRadius: "var(--radius-input)",
                    background: "var(--color-critical-bg)",
                    color: "var(--color-critical)",
                    fontSize: "13px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                  }}>
                    <Icon name="block" size={18} />
                    <span>
                      <strong>Bloqueo crítico:</strong> no se preparó ninguna transacción. No hay nada que firmar.
                    </span>
                  </div>
                  <button className="btn-danger" onClick={() => handleDecision("cancelled")} disabled={deciding}>
                    <Icon name="close" size={17} />
                    <span>Descartar este envío</span>
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {requiresFriction(assessment.level) && (
                    <div style={{
                      padding: "10px 14px",
                      borderRadius: "var(--radius-input)",
                      background: "var(--color-elevated-bg)",
                      color: "var(--color-elevated)",
                      fontSize: "13px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px"
                    }}>
                      <Icon name="warning" size={17} />
                      <span>Riesgo elevado — revise la evidencia antes de continuar.</span>
                    </div>
                  )}

                  {blockedReason && (
                    <div style={{
                      padding: "10px 14px",
                      borderRadius: "var(--radius-input)",
                      background: "var(--color-info-bg)",
                      color: "var(--color-info)",
                      fontSize: "12.5px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px"
                    }}>
                      <Icon name="error" size={16} style={{ flexShrink: 0 }} />
                      <span>{blockedReason} Fondéela en el faucet para firmar de verdad.</span>
                    </div>
                  )}

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "12px" }}>
                    <button
                      className={requiresFriction(assessment.level) ? "btn-warning" : "btn-primary"}
                      onClick={() =>
                        handleDecision(requiresFriction(assessment.level) ? "proceed-with-acknowledged-risk" : "proceed")
                      }
                      disabled={deciding || !canSend}
                      title={!canSend ? "Se necesita saldo TRX para pagar el gas" : undefined}
                    >
                      {deciding ? <span className="spinner" /> : <Icon name="check_circle" size={17} />}
                      <span>
                        {deciding
                          ? "Firmando y enviando…"
                          : requiresFriction(assessment.level)
                          ? "Enviar de todos modos"
                          : "Firmar y enviar USDT"}
                      </span>
                    </button>
                    <button className="btn-secondary" onClick={() => handleDecision("cancelled")} disabled={deciding}>
                      <Icon name="close" size={17} />
                      <span>Cancelar</span>
                    </button>
                  </div>
                </div>
              )}

              {walletError && (
                <p style={{ color: "var(--color-critical)", marginTop: "10px", fontSize: "13px" }}>{walletError}</p>
              )}
            </div>
          )}

          {decision && (
            <div style={{
              marginTop: "20px",
              padding: "14px 16px",
              borderRadius: "var(--radius-input)",
              background: decision === "cancelled" ? "var(--color-critical-bg)" : "var(--color-safe-bg)",
              color: decision === "cancelled" ? "var(--color-critical)" : "var(--color-safe)",
              display: "flex",
              alignItems: "flex-start",
              gap: "10px",
            }}>
              <Icon name={decision === "cancelled" ? "cancel" : "task_alt"} size={19} style={{ flexShrink: 0, marginTop: "1px" }} />
              <div style={{ minWidth: 0 }}>
                <strong style={{ fontSize: "13px" }}>
                  {decision === "cancelled" ? "Envío cancelado" : "Transacción enviada a la red"}
                </strong>
                <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--upguard-text-body)" }}>
                  {decision === "cancelled"
                    ? "No se firmó nada. La decisión quedó en la auditoría local."
                    : "Firmada con la wallet de demo y difundida en Tron Nile."}
                </p>
              </div>
            </div>
          )}

          {/* The payoff: a real, verifiable transaction hash */}
          {txHash && (
            <div
              style={{
                marginTop: "12px",
                padding: "16px",
                borderRadius: "var(--radius-card)",
                background: "var(--upguard-bg)",
                border: "1px solid var(--color-safe-border)",
              }}
            >
              <span className="eyebrow" style={{ marginBottom: "8px" }}>
                Hash de la transacción
              </span>

              <code
                className="mono"
                style={{
                  display: "block",
                  fontSize: "12px",
                  color: "var(--upguard-text-headings)",
                  wordBreak: "break-all",
                  lineHeight: 1.5,
                  marginBottom: "12px",
                }}
              >
                {txHash}
              </code>

              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <a
                  href={`${NILE_EXPLORER_TX}${txHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-upguard-primary"
                  style={{ textDecoration: "none", fontSize: "12.5px", padding: "9px 16px" }}
                >
                  <Icon name="hub" size={14} />
                  <span>Ver en Tronscan ↗</span>
                </a>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ fontSize: "12.5px" }}
                  onClick={() => {
                    void navigator.clipboard.writeText(txHash).then(
                      () => setTxCopied(true),
                      () => undefined,
                    );
                    setTimeout(() => setTxCopied(false), 2000);
                  }}
                >
                  <Icon name={txCopied ? "check" : "content_copy"} size={14} />
                  <span>{txCopied ? "Copiado" : "Copiar hash"}</span>
                </button>
              </div>
            </div>
          )}

          <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid var(--upguard-border)" }}>
            <button
              className="btn-secondary"
              style={{ width: "100%" }}
              onClick={handleReportScam}
              disabled={reporting || reported}
            >
              <Icon name="share" size={15} />
              <span>
                {reported
                  ? "Reportada en el directorio P2P local"
                  : reporting
                  ? "Reportando…"
                  : "Reportar esta dirección como estafa"}
              </span>
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
