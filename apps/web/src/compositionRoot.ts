import { AnalyzeSendIntent, RecordUserDecision, SyncRiskList } from "@custos/core";
import { QvacScamDetectionAdapter } from "@custos/adapters-qvac";
import { LocalRiskListAdapter } from "@custos/adapters-p2p";
import { LocalAuditLogAdapter } from "@custos/adapters-storage";

/**
 * Single place where ports are bound to adapters. Swap LocalRiskListAdapter
 * for HyperswarmRiskListAdapter once the P2P stretch goal is wired, and add
 * WdkWalletAdapter here once the send flow (issue: "Wire end-to-end flow")
 * is picked up — nothing outside this file should construct an adapter.
 */
const scamDetection = new QvacScamDetectionAdapter();
const riskList = new LocalRiskListAdapter();
const auditLog = new LocalAuditLogAdapter();

export const analyzeSendIntent = new AnalyzeSendIntent({ scamDetection, riskList });
export const recordUserDecision = new RecordUserDecision({ auditLog });
export const syncRiskList = new SyncRiskList({ riskList });
