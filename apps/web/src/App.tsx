import { useState } from "react";
import type { ChatMessage, RiskAssessment, TranslatedChatMessage } from "@custos/core";
import { languageTag, parseDestinationAddress } from "@custos/core";
import { analyzeSendIntent, translateAndAnalyzeMessage } from "./compositionRoot.js";
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
  const [assessment, setAssessment] = useState<RiskAssessment | null>(null);
  const [translated, setTranslated] = useState<TranslatedChatMessage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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
      const result = await analyzeSendIntent.execute(
        {
          destination: parsed.address,
          amountUsdt: Number(amount) || 0,
          context: contextPayload,
        },
        { textMatches },
      );
      setAssessment(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed.");
    } finally {
      setBusy(false);
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

      {assessment && <RiskAssessmentPanel assessment={assessment} translated={translated} />}
    </main>
  );
}
