import { useState } from "react";
import type { RiskAssessment } from "@custos/core";
import { parseDestinationAddress, requiresFriction, requiresHardBlock } from "@custos/core";
import { analyzeSendIntent } from "./compositionRoot.js";

export function App() {
  const [address, setAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [context, setContext] = useState("");
  const [assessment, setAssessment] = useState<RiskAssessment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleCheck() {
    setBusy(true);
    setError(null);
    setAssessment(null);
    try {
      const parsed = parseDestinationAddress(address);
      if (!parsed.ok) {
        setError(
          parsed.reason === "empty"
            ? "Enter a destination address."
            : "That is not a Tron (T...) or Ethereum (0x...) address.",
        );
        return;
      }
      const result = await analyzeSendIntent.execute({
        destination: parsed.address,
        amountUsdt: Number(amount) || 0,
        context: context ? { text: context } : undefined,
      });
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

      <button onClick={handleCheck} disabled={busy || !address} style={{ marginTop: 16, padding: "8px 16px" }}>
        {busy ? "Analyzing on-device..." : "Check before sending"}
      </button>

      {assessment && (
        <div
          style={{
            marginTop: 20,
            padding: 16,
            border: "2px solid",
            borderColor: requiresHardBlock(assessment.level) ? "#c0392b" : requiresFriction(assessment.level) ? "#e67e22" : "#27ae60",
          }}
        >
          <strong>Risk level: {assessment.level}</strong>
          {assessment.addressReputation && (
            <p>
              Detected network: {assessment.addressReputation.address.network === "tron" ? "Tron" : "Ethereum"}
            </p>
          )}
          <p>{assessment.summary}</p>
          {requiresHardBlock(assessment.level) && <p>This send would be blocked — WDK signing must not proceed.</p>}
        </div>
      )}
    </main>
  );
}
