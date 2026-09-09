import type { AuditLogPort } from "../../domain/ports/AuditLogPort.js";
import type { RiskAssessment } from "../../domain/entities/RiskAssessment.js";
import type { SendDecision } from "../../domain/entities/SendIntent.js";
import { requiresHardBlock } from "../../domain/value-objects/RiskLevel.js";

export interface RecordUserDecisionDeps {
  readonly auditLog: AuditLogPort;
}

/**
 * Enforces the one hard rule of the friction flow: a Critical assessment can
 * never resolve to "proceed" or "proceed-with-acknowledged-risk" — only
 * "cancelled" is a valid decision at that level.
 */
export class RecordUserDecision {
  constructor(private readonly deps: RecordUserDecisionDeps) {}

  async execute(assessment: RiskAssessment, decision: SendDecision): Promise<void> {
    if (requiresHardBlock(assessment.level) && decision.kind !== "cancelled") {
      throw new Error("Critical-risk assessments cannot be overridden — send must be cancelled.");
    }
    await this.deps.auditLog.record(assessment, decision);
  }
}
