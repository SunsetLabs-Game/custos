import { AnalyzeSendIntent, AnalyzeScreenshot, RecordUserDecision, SyncRiskList, TranslateAndAnalyzeMessage } from "@custos/core";
import type { WalletPort } from "@custos/core";
import { QvacScamDetectionAdapter, QvacTranslateAdapter, QvacVisionAdapter } from "@custos/adapters-qvac";
import { HyperswarmRiskListAdapter } from "@custos/adapters-p2p";
import { LocalAuditLogAdapter } from "@custos/adapters-storage";
import { TronUsdtWalletAdapter } from "./wallet/TronUsdtWalletAdapter.js";
import { TesseractVisionClient } from "./vision/TesseractVisionClient.js";

const scamDetection = new QvacScamDetectionAdapter();
const translation = new QvacTranslateAdapter();
export const riskList = new HyperswarmRiskListAdapter();
export const auditLog = new LocalAuditLogAdapter();

/** Real OCR, running in a Web Worker on this device — bytes never leave the browser. */
export const visionClient = new TesseractVisionClient();
export const visionAdapter = new QvacVisionAdapter(visionClient);
export const analyzeScreenshot = new AnalyzeScreenshot({
  ocr: visionAdapter,
  scamDetection,
});

export const analyzeSendIntent = new AnalyzeSendIntent({ scamDetection, riskList });
export const translateAndAnalyzeMessage = new TranslateAndAnalyzeMessage({
  translation,
  scamDetection,
});
export const recordUserDecision = new RecordUserDecision({ auditLog });
export const syncRiskList = new SyncRiskList({ riskList });

/** Real Nile-testnet USDT wallet: prepare() quotes, commit() signs and broadcasts. */
export const tronWallet = new TronUsdtWalletAdapter();
export const walletPort: WalletPort = tronWallet;

