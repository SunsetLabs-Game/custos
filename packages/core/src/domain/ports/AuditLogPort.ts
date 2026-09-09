import type { RiskAssessment } from "../entities/RiskAssessment.js";
import type { SendDecision } from "../entities/SendIntent.js";

/**
 * Local-only audit trail. Deliberately takes the RiskAssessment, never the
 * raw chat text or full address — keeps "nothing sensitive leaves the
 * device" true even for the app's own logs.
 */
export interface AuditLogPort {
  record(assessment: RiskAssessment, decision: SendDecision): Promise<void>;
}
