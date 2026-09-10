import { useState } from "react";
import type { Address, RiskAssessment } from "@custos/core";
import { requiresFriction, requiresHardBlock } from "@custos/core";
import { analyzeSendIntent, syncRiskList } from "./compositionRoot.js";

export function App() {
  const [address, setAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [context, setContext] = useState("");
  const [destination, setDestination] = useState<Address | null>(null);
  const [assessment, setAssessment] = useState<RiskAssessment | null>(null);
  const [busy, setBusy] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [reported, setReported] = useState(false);

  async function handleCheck() {
    setBusy(true);
    setReported(false);
    try {
      const checkedDestination: Address = { value: address, network: "tron" };
      const result = await analyzeSendIntent.execute({
        destination: checkedDestination,
        amountUsdt: Number(amount) || 0,
        context: context ? { text: context } : undefined,
      });
      setDestination(checkedDestination);
      setAssessment(result);
    } finally {
      setBusy(false);
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
          <button onClick={handleReportScam} disabled={reporting || reported} style={{ marginTop: 12, padding: "8px 16px" }}>
            {reported ? "Reported — added to local risk list" : reporting ? "Reporting..." : "Report as scam"}
          </button>
        </div>
      )}
    </main>
  );
}
