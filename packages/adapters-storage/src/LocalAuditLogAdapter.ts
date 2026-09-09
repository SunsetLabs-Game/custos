import type { AuditLogPort, RiskAssessment, SendDecision } from "@custos/core";

export interface AuditLogEntry {
  readonly assessment: RiskAssessment;
  readonly decision: SendDecision;
  readonly recordedAt: Date;
}

interface SerializedEntry {
  readonly assessment: RiskAssessment;
  readonly decision: SendDecision;
  readonly recordedAt: string;
}

const STORAGE_KEY = "custos:audit-log";
// Local-only trail for a demo device — cap it so it can't grow unbounded.
const MAX_ENTRIES = 500;

/**
 * On-device audit trail backed by localStorage where available (falls back
 * to in-memory-only, e.g. under SSR or a locked-down webview). Only ever
 * receives a RiskAssessment + SendDecision — never raw chat text or the
 * full destination address — because that's all AuditLogPort's signature
 * allows a caller to pass in.
 */
export class LocalAuditLogAdapter implements AuditLogPort {
  private entries: AuditLogEntry[];

  constructor() {
    this.entries = this.loadFromStorage();
  }

  async record(assessment: RiskAssessment, decision: SendDecision): Promise<void> {
    this.entries.push({ assessment, decision, recordedAt: new Date() });
    if (this.entries.length > MAX_ENTRIES) {
      this.entries = this.entries.slice(this.entries.length - MAX_ENTRIES);
    }
    this.saveToStorage();
  }

  /** Most recent first — for a future "recent activity" screen. */
  list(): readonly AuditLogEntry[] {
    return [...this.entries].reverse();
  }

  clear(): void {
    this.entries = [];
    this.saveToStorage();
  }

  private loadFromStorage(): AuditLogEntry[] {
    const storage = this.getStorage();
    if (!storage) return [];

    try {
      const raw = storage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as SerializedEntry[];
      return parsed.map((entry) => ({
        ...entry,
        assessment: { ...entry.assessment, createdAt: new Date(entry.assessment.createdAt) },
        recordedAt: new Date(entry.recordedAt),
      }));
    } catch {
      // Corrupt or foreign data under our key — start clean rather than throw.
      return [];
    }
  }

  private saveToStorage(): void {
    const storage = this.getStorage();
    if (!storage) return;

    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(this.entries));
    } catch {
      // Storage full/unavailable (private browsing, quota) — the in-memory
      // trail for this session still works, so don't throw.
    }
  }

  private getStorage(): Storage | undefined {
    return typeof localStorage === "undefined" ? undefined : localStorage;
  }
}
