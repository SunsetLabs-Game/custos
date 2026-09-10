import { useState } from "react";
import type { RiskAssessment } from "@custos/core";
import { requiresFriction, requiresHardBlock, detectChainNetwork } from "@custos/core";
import { analyzeSendIntent } from "./compositionRoot.js";

export function App() {
  const [address, setAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [context, setContext] = useState("");
  const [assessment, setAssessment] = useState<RiskAssessment | null>(null);
  const [busy, setBusy] = useState(false);
  const [unrecognizedNetwork, setUnrecognizedNetwork] = useState(false);

  async function handleCheck() {
    const network = detectChainNetwork(address);
    if (network === "other") {
      setUnrecognizedNetwork(true);
      setAssessment(null);
      return;
    }

    setUnrecognizedNetwork(false);
    setBusy(true);
    try {
      const result = await analyzeSendIntent.execute({
        destination: { value: address, network },
        amountUsdt: Number(amount) || 0,
        context: context ? { text: context } : undefined,
      });
      setAssessment(result);
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
          onChange={(e) => setAddress(e.target.value)}
          style={{ width: "100%", padding: 8 }}
          placeholder="TXyz... / 0x..."
        />
      </label>

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

      {unrecognizedNetwork && (
        <p style={{ marginTop: 12, color: "#c0392b" }}>
          Unrecognized address format — doesn't match Tron or Ethereum. Double-check it before sending.
        </p>
      )}

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
          <p>{assessment.summary}</p>
          {requiresHardBlock(assessment.level) && <p>This send would be blocked — WDK signing must not proceed.</p>}
        </div>
      )}
    </main>
  );
}
