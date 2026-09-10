import { useState } from "react";
import type { Address, ChatMessage, PreparedTransfer, RiskAssessment, SendDecision, TranslatedChatMessage } from "@custos/core";
import { languageTag, parseDestinationAddress, requiresFriction, requiresHardBlock } from "@custos/core";
import { analyzeSendIntent, recordUserDecision, syncRiskList, translateAndAnalyzeMessage, walletPort } from "./compositionRoot.js";
import { RiskAssessmentPanel } from "./RiskAssessmentPanel.js";

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
    <main style={{ maxWidth: 560, margin: "2rem auto", fontFamily: "system-ui" }}>
      <h1>Custos</h1>
      <p>Paste the destination address and, if you have it, the scammer's chat text — everything below runs on-device.</p>

      <label style={{ display: "block", marginTop: 16 }}>
        Destination address
        <input
          value={address}
          onChange={(e) => {
            setAddress(e.target.value);
            setError(null);
          }}
          style={{ width: "100%", padding: 8 }}
          placeholder="TXyz... / 0x..."
          aria-invalid={error !== null}
          aria-describedby={error ? "address-error" : undefined}
        />
      </label>
      {error && (
        <p id="address-error" role="alert" style={{ color: "#c0392b", marginTop: 8 }}>
          {error}
        </p>
      )}

      <label style={{ display: "block", marginTop: 12 }}>
        Amount (USDT)
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          style={{ width: "100%", padding: 8 }}
          type="number"
        />
      </label>

      <label style={{ display: "block", marginTop: 12 }}>
        Chat context (optional — paste in any language, TranslatePsy handles it once wired)
        <textarea
          value={context}
          onChange={(e) => setContext(e.target.value)}
          style={{ width: "100%", padding: 8, minHeight: 100 }}
        />
      </label>

      <button
        onClick={handleCheck}
        disabled={busy || !address}
        style={{ marginTop: 16, padding: "12px 16px", minHeight: 44, minWidth: 44 }}
      >
        {busy ? "Analyzing on-device..." : "Check before sending"}
      </button>

      {assessment && (
        <>
          <RiskAssessmentPanel assessment={assessment} translated={translated} />

          {!decision && (
            <div style={{ marginTop: 16 }}>
              {requiresHardBlock(assessment.level) ? (
                <>
                  <p role="alert" style={{ color: "#c0392b" }}>
                    This send is blocked — Critical-risk sends can only be cancelled, never confirmed.
                  </p>
                  <button onClick={() => handleDecision("cancelled")} disabled={deciding} style={{ padding: "8px 16px" }}>
                    Cancel send
                  </button>
                </>
              ) : (
                <>
                  {requiresFriction(assessment.level) && (
                    <p role="alert" style={{ color: "#e67e22" }}>
                      Elevated risk — review the details above before continuing.
                    </p>
                  )}
                  <button
                    onClick={() =>
                      handleDecision(requiresFriction(assessment.level) ? "proceed-with-acknowledged-risk" : "proceed")
                    }
                    disabled={deciding || (walletPort !== null && !preparedTransfer)}
                    style={{ marginRight: 8, padding: "8px 16px" }}
                  >
                    {deciding ? "Sending..." : requiresFriction(assessment.level) ? "Send anyway" : "Confirm send"}
                  </button>
                  <button onClick={() => handleDecision("cancelled")} disabled={deciding} style={{ padding: "8px 16px" }}>
                    Cancel
                  </button>
                </>
              )}
              {!walletPort && (
                <p style={{ marginTop: 8, fontStyle: "italic" }}>
                  Wallet not connected in this demo build — the decision is still recorded, no funds move.
                </p>
              )}
              {walletError && (
                <p role="alert" style={{ color: "#c0392b", marginTop: 8 }}>
                  {walletError}
                </p>
              )}
            </div>
          )}

          {decision && (
            <p style={{ marginTop: 16 }}>
              {decision === "cancelled"
                ? "Send cancelled — recorded in the local audit log."
                : txHash
                  ? `Sent — tx ${txHash}`
                  : "Decision recorded in the local audit log."}
            </p>
          )}

          <button
            onClick={handleReportScam}
            disabled={reporting || reported}
            style={{ marginTop: 12, padding: "8px 16px" }}
          >
            {reported ? "Reported — added to local risk list" : reporting ? "Reporting..." : "Report as scam"}
          </button>
        </>
      )}
    </main>
  );
}
