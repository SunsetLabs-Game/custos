import { AnalyzeSendIntent, RecordUserDecision, SyncRiskList, TranslateAndAnalyzeMessage } from "@custos/core";
import type { WalletPort } from "@custos/core";
import { QvacScamDetectionAdapter, QvacTranslateAdapter } from "@custos/adapters-qvac";
import { HyperswarmRiskListAdapter } from "@custos/adapters-p2p";
import { LocalAuditLogAdapter } from "@custos/adapters-storage";

/**
 * Single place where ports are bound to adapters — nothing outside this file
 * should construct an adapter.
 *
 * `walletPort` is `null` in this Vite/browser build on purpose: WDK needs a
 * BIP-39 seed, and a real signing key must never ship inside a browser
 * bundle served to hackathon judges. `apps/web` still runs the full
 * prepare -> friction/block -> confirm flow against `walletPort`; it just
 * shows "wallet not connected" instead of calling `commit`. A Node/Bare/Expo
 * host wires a real one via `createTronWdkAccount` + `WdkWalletAdapter`.
 */
const scamDetection = new QvacScamDetectionAdapter();
const translation = new QvacTranslateAdapter();
const riskList = new HyperswarmRiskListAdapter();
const auditLog = new LocalAuditLogAdapter();

export const analyzeSendIntent = new AnalyzeSendIntent({ scamDetection, riskList });
export const translateAndAnalyzeMessage = new TranslateAndAnalyzeMessage({
  translation,
  scamDetection,
});
export const recordUserDecision = new RecordUserDecision({ auditLog });
export const syncRiskList = new SyncRiskList({ riskList });
export const walletPort: WalletPort | null = null;
