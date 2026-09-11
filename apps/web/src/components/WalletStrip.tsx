import { useState } from "react";
import { Icon } from "../Icon.js";
import type { WalletSnapshot } from "../wallet/TronUsdtWalletAdapter.js";
import { NILE_FAUCET_URL } from "../wallet/tronNetwork.js";

/**
 * Shows the auto-generated demo wallet and its real on-chain balances, so the
 * user can see the send path is backed by an actual account rather than a
 * simulation — and can copy the address to fund it at the faucet.
 */
export function WalletStrip({
  wallet,
  loading,
  error,
  onRefresh,
}: {
  wallet: WalletSnapshot | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const copyAddress = async () => {
    if (!wallet) return;
    try {
      await navigator.clipboard.writeText(wallet.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked (insecure context / denied) — the address is still
      // shown in full, so it can be selected by hand.
    }
  };

  const needsFunding = wallet !== null && (!wallet.funded || wallet.usdtBalance === 0);

  return (
    <section
      style={{
        background: "var(--upguard-layer-strong)",
        borderRadius: "var(--radius-card)",
        padding: "16px 20px",
        display: "flex",
        flexDirection: "column",
        gap: needsFunding ? "14px" : "0",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px", minWidth: 0 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "var(--radius-input)",
              background: "var(--upguard-bg)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: wallet?.funded ? "var(--color-safe)" : "var(--upguard-text-muted)",
              flexShrink: 0,
            }}
          >
            <Icon name="lock" size={17} />
          </div>

          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--upguard-text-headings)" }}>
                Wallet de demo
              </span>
              <span className="mono" style={{ fontSize: "10px", color: "var(--upguard-text-muted)", letterSpacing: "0.06em" }}>
                TRON NILE TESTNET
              </span>
            </div>

            {/* Full address, not truncated — it has to be copied into the faucet */}
            <button
              type="button"
              onClick={copyAddress}
              disabled={!wallet}
              title="Copiar dirección"
              className="mono"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "7px",
                background: "transparent",
                border: "none",
                padding: "2px 0 0",
                fontSize: "12px",
                color: copied ? "var(--color-safe)" : "var(--upguard-text-body)",
                cursor: wallet ? "pointer" : "default",
                textAlign: "left",
                wordBreak: "break-all",
              }}
            >
              <span>{loading && !wallet ? "Generando cuenta…" : wallet ? wallet.address : "—"}</span>
              {wallet && (
                <Icon name={copied ? "check" : "content_copy"} size={13} style={{ flexShrink: 0 }} />
              )}
            </button>
          </div>
        </div>

        {error ? (
          <span style={{ fontSize: "12px", color: "var(--color-elevated)" }}>{error}</span>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: "24px", flexWrap: "wrap" }}>
            <div>
              <span style={{ fontSize: "10px", color: "var(--upguard-text-muted)", display: "block", letterSpacing: "0.08em" }}>
                USDT
              </span>
              <strong className="mono" style={{ fontSize: "15px", color: "var(--upguard-text-headings)" }}>
                {wallet ? wallet.usdtBalance.toFixed(2) : "—"}
              </strong>
            </div>
            <div>
              <span style={{ fontSize: "10px", color: "var(--upguard-text-muted)", display: "block", letterSpacing: "0.08em" }}>
                TRX (gas)
              </span>
              <strong
                className="mono"
                style={{
                  fontSize: "15px",
                  color: wallet && !wallet.funded ? "var(--color-elevated)" : "var(--upguard-text-headings)",
                }}
              >
                {wallet ? wallet.trxBalance.toFixed(2) : "—"}
              </strong>
            </div>

            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              title="Actualizar saldos on-chain"
              style={{
                background: "transparent",
                border: "none",
                color: "var(--upguard-text-muted)",
                cursor: loading ? "default" : "pointer",
                display: "flex",
                alignItems: "center",
                padding: "4px",
              }}
            >
              {loading ? <span className="spinner" /> : <Icon name="history" size={15} />}
            </button>
          </div>
        )}
      </div>

      {needsFunding && !error && (
        <div
          style={{
            borderTop: "1px solid var(--upguard-border)",
            paddingTop: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "14px",
            flexWrap: "wrap",
          }}
        >
          <p style={{ margin: 0, fontSize: "12px", color: "var(--upguard-text-body)", lineHeight: 1.5, maxWidth: "540px" }}>
            Para firmar de verdad hacen falta <strong style={{ color: "var(--upguard-text-headings)" }}>TRX</strong> (gas) y{" "}
            <strong style={{ color: "var(--upguard-text-headings)" }}>USDT</strong> de prueba. Copia la dirección de
            arriba, pégala en el faucet de Nile y vuelve a actualizar los saldos. Son fondos de testnet, sin valor real.
          </p>
          <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
            <button type="button" className="btn-secondary" onClick={copyAddress} style={{ fontSize: "12px" }}>
              <Icon name={copied ? "check" : "content_copy"} size={14} />
              <span>{copied ? "Copiada" : "Copiar dirección"}</span>
            </button>
            <a
              href={NILE_FAUCET_URL}
              target="_blank"
              rel="noreferrer"
              className="btn-upguard-primary"
              style={{ textDecoration: "none", fontSize: "12px", padding: "9px 16px" }}
            >
              Abrir faucet ↗
            </a>
          </div>
        </div>
      )}
    </section>
  );
}
