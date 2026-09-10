import { useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import type { Address, ChatMessage, PreparedTransfer, RiskAssessment, SendDecision, TranslatedChatMessage } from "@custos/core";
import { languageTag, parseDestinationAddress, requiresFriction, requiresHardBlock } from "@custos/core";
import { analyzeSendIntent, recordUserDecision, syncRiskList, translateAndAnalyzeMessage, walletPort } from "./compositionRoot.js";
import { RiskAssessmentPanel } from "./RiskAssessmentPanel.js";
import { color, font, radius, space } from "./theme.js";

function isTranslated(message: { text: string }): message is TranslatedChatMessage {
  return "originalText" in message;
}

function userLanguage() {
  const tag =
    typeof navigator !== "undefined" && navigator.language
      ? navigator.language.slice(0, 2)
      : "en";
  return languageTag(tag || "en");
}

const labelStyle: CSSProperties = {
  display: "block",
  marginTop: space.lg,
  fontFamily: font.body,
  fontSize: 13,
  fontWeight: 500,
  color: color.textSecondary,
};

const inputStyle: CSSProperties = {
  width: "100%",
  marginTop: space.xs,
  padding: "10px 12px",
  boxSizing: "border-box",
  borderRadius: radius.input,
  border: `1px solid ${color.stroke}`,
  background: color.surfaceRecessed,
  color: color.textPrimary,
  fontFamily: font.body,
  fontSize: 14,
};

const monoInputStyle: CSSProperties = { ...inputStyle, fontFamily: font.mono };

function TrustBadge({ children }: { children: ReactNode }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
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
      {children}
    </span>
  );
}

function Button({
  children,
  onClick,
  disabled,
  variant = "primary",
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: "primary" | "outline-warning" | "outline-danger" | "outline";
}) {
  const base: CSSProperties = {
    fontFamily: font.body,
    fontSize: 14,
    fontWeight: 600,
    padding: "12px 16px",
    minHeight: 44,
    borderRadius: radius.input,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
  };
  const variants: Record<string, CSSProperties> = {
    primary: { background: color.safe, color: color.canvas, border: "none" },
    "outline-warning": { background: "transparent", color: color.elevated, border: `1px solid ${color.elevatedBorder}` },
    "outline-danger": { background: color.criticalBg, color: color.critical, border: `1px solid ${color.criticalBorder}` },
    outline: { background: "transparent", color: color.textPrimary, border: `1px solid ${color.stroke}` },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{ ...base, ...variants[variant] }}>
      {children}
    </button>
  );
}

export function App() {
  const [address, setAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [context, setContext] = useState("");
  const [destination, setDestination] = useState<Address | null>(null);
  const [assessment, setAssessment] = useState<RiskAssessment | null>(null);
  const [translated, setTranslated] = useState<TranslatedChatMessage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [reported, setReported] = useState(false);

  const [preparedTransfer, setPreparedTransfer] = useState<PreparedTransfer | null>(null);
  const [decision, setDecision] = useState<SendDecision["kind"] | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [deciding, setDeciding] = useState(false);

  async function handleCheck() {
    const parsed = parseDestinationAddress(address);
    if (!parsed.ok) {
      setError(
        parsed.reason === "empty"
          ? "Enter a destination address."
          : "That is not a Tron (T...) or Ethereum (0x...) address.",
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
    setDecision(null);
    setTxHash(null);
    setWalletError(null);
    try {
      const pasted = context.trim();
      let contextPayload: ChatMessage | undefined;
      let textMatches;
      if (pasted) {
        const ta = await translateAndAnalyzeMessage.execute(pasted, userLanguage());
        contextPayload = { text: ta.message.text, detectedLanguage: ta.message.detectedLanguage };
        textMatches = ta.matches;
        setTranslated(isTranslated(ta.message) ? ta.message : null);
      }
      const intent = {
        destination: parsed.address,
        amountUsdt: Number(amount) || 0,
        context: contextPayload,
      };
      const result = await analyzeSendIntent.execute(intent, { textMatches });
      setDestination(parsed.address);
      setAssessment(result);

      if (walletPort) {
        try {
          setPreparedTransfer(await walletPort.prepare(intent));
        } catch (err) {
          setWalletError(err instanceof Error ? err.message : "Could not prepare this transfer.");
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDecision(kind: SendDecision["kind"]) {
    if (!assessment) return;
    setDeciding(true);
    setWalletError(null);
    try {
      if (kind !== "cancelled" && walletPort && preparedTransfer) {
        const { txHash: hash } = await walletPort.commit(preparedTransfer);
        setTxHash(hash);
      }
      await recordUserDecision.execute(assessment, { kind });
      setDecision(kind);
    } catch (err) {
      setWalletError(err instanceof Error ? err.message : "Could not complete the send.");
    } finally {
      setDeciding(false);
    }
  }

  async function handleReportScam() {
    if (!destination) return;
    setReporting(true);
    try {
      await syncRiskList.reportScam(destination);
      setReported(true);
    } finally {
      setReporting(false);
    }
  }

  return (
    <main
      style={{
        maxWidth: 480,
        margin: "0 auto",
        minHeight: "100vh",
        padding: `${space.xl}px ${space.lg}px ${space.xl * 2}px`,
        background: color.canvas,
        fontFamily: font.body,
        color: color.textPrimary,
        boxSizing: "border-box",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: space.sm }}>
          <span aria-hidden="true" style={{ fontSize: 20, color: color.safe }}>
            ◆
          </span>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>Custos</h1>
        </div>
        <TrustBadge>On-device · Zero telemetry</TrustBadge>
      </div>

      <p style={{ marginTop: space.sm, fontSize: 14, color: color.textSecondary }}>
        Paste the destination address and, if you have it, the scammer's chat text — everything below runs on-device.
      </p>

      <label style={labelStyle} htmlFor="address">
        Destination address
      </label>
      <input
        id="address"
        value={address}
        onChange={(e) => {
          setAddress(e.target.value);
          setError(null);
        }}
        style={monoInputStyle}
        placeholder="TXyz... / 0x..."
        aria-invalid={error !== null}
        aria-describedby={error ? "address-error" : undefined}
      />
      {error && (
        <p
          id="address-error"
          role="alert"
          style={{ color: color.critical, marginTop: space.xs, fontSize: 13 }}
        >
          {error}
        </p>
      )}

      <label style={labelStyle} htmlFor="amount">
        Amount (USDT)
      </label>
      <input id="amount" value={amount} onChange={(e) => setAmount(e.target.value)} style={monoInputStyle} type="number" />

      <label style={labelStyle} htmlFor="context">
        Chat context <span style={{ fontWeight: 400, color: color.textMuted }}>(optional — any language, translated on-device)</span>
      </label>
      <textarea
        id="context"
        value={context}
        onChange={(e) => setContext(e.target.value)}
        style={{ ...inputStyle, minHeight: 96, resize: "vertical" }}
      />

      <div style={{ marginTop: space.lg }}>
        <Button onClick={handleCheck} disabled={busy || !address}>
          {busy ? "Analyzing on-device..." : "Check before sending"}
        </Button>
      </div>

      {assessment && (
        <>
          <RiskAssessmentPanel assessment={assessment} translated={translated} />

          {!decision && (
            <div style={{ marginTop: space.lg }}>
              {requiresHardBlock(assessment.level) ? (
                <>
                  <p role="alert" style={{ color: color.critical, fontSize: 13, marginBottom: space.sm }}>
                    This send is blocked — Critical-risk sends can only be cancelled, never confirmed.
                  </p>
                  <Button onClick={() => handleDecision("cancelled")} disabled={deciding} variant="outline-danger">
                    Cancel send
                  </Button>
                </>
              ) : (
                <>
                  {requiresFriction(assessment.level) && (
                    <p role="alert" style={{ color: color.elevated, fontSize: 13, marginBottom: space.sm }}>
                      Elevated risk — review the details above before continuing.
                    </p>
                  )}
                  <div style={{ display: "flex", gap: space.sm }}>
                    <Button
                      onClick={() =>
                        handleDecision(requiresFriction(assessment.level) ? "proceed-with-acknowledged-risk" : "proceed")
                      }
                      disabled={deciding || (walletPort !== null && !preparedTransfer)}
                      variant={requiresFriction(assessment.level) ? "outline-warning" : "primary"}
                    >
                      {deciding ? "Sending..." : requiresFriction(assessment.level) ? "Send anyway" : "Confirm send"}
                    </Button>
                    <Button onClick={() => handleDecision("cancelled")} disabled={deciding} variant="outline">
                      Cancel
                    </Button>
                  </div>
                </>
              )}
              {!walletPort && (
                <p style={{ marginTop: space.sm, fontSize: 12, fontStyle: "italic", color: color.textMuted }}>
                  Wallet not connected in this demo build — the decision is still recorded, no funds move.
                </p>
              )}
              {walletError && (
                <p role="alert" style={{ color: color.critical, marginTop: space.sm, fontSize: 13 }}>
                  {walletError}
                </p>
              )}
            </div>
          )}

          {decision && (
            <p style={{ marginTop: space.lg, fontSize: 13, color: color.safe }}>
              {decision === "cancelled"
                ? "Send cancelled — recorded in the local audit log."
                : txHash
                  ? `Sent — tx ${txHash}`
                  : "Decision recorded in the local audit log."}
            </p>
          )}

          <div style={{ marginTop: space.md }}>
            <Button onClick={handleReportScam} disabled={reporting || reported} variant="outline">
              {reported ? "Reported — added to local risk list" : reporting ? "Reporting..." : "Report as scam"}
            </Button>
          </div>
        </>
      )}
    </main>
  );
}
