import { describe, expect, it } from "vitest";
import { RecordUserDecision } from "../RecordUserDecision.js";
import { RiskLevel } from "../../../domain/value-objects/RiskLevel.js";
import type { AuditLogPort } from "../../../domain/ports/AuditLogPort.js";
import type { RiskAssessment } from "../../../domain/entities/RiskAssessment.js";

function makeAssessment(level: RiskLevel): RiskAssessment {
  return { id: "a1", createdAt: new Date(), level, matches: [], summary: "test" };
}

describe("RecordUserDecision", () => {
  it("rejects any override of a Critical assessment", async () => {
    const records: unknown[] = [];
    const auditLog: AuditLogPort = { record: async (a, d) => void records.push([a, d]) };
    const useCase = new RecordUserDecision({ auditLog });

    await expect(
      useCase.execute(makeAssessment(RiskLevel.Critical), { kind: "proceed-with-acknowledged-risk" }),
    ).rejects.toThrow(/cannot be overridden/);
    expect(records).toHaveLength(0);
  });

  it("allows cancelling a Critical assessment", async () => {
    const records: unknown[] = [];
    const auditLog: AuditLogPort = { record: async (a, d) => void records.push([a, d]) };
    const useCase = new RecordUserDecision({ auditLog });

    await useCase.execute(makeAssessment(RiskLevel.Critical), { kind: "cancelled" });

    expect(records).toHaveLength(1);
  });

  it("allows proceeding on a Low-risk assessment", async () => {
    const records: unknown[] = [];
    const auditLog: AuditLogPort = { record: async (a, d) => void records.push([a, d]) };
    const useCase = new RecordUserDecision({ auditLog });

    await useCase.execute(makeAssessment(RiskLevel.Low), { kind: "proceed" });

    expect(records).toHaveLength(1);
  });
});
