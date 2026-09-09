import { describe, expect, it } from "vitest";
import { LocalAuditLogAdapter } from "../LocalAuditLogAdapter.js";
import { RiskLevel } from "@custos/core";
import type { RiskAssessment } from "@custos/core";

function makeAssessment(id: string): RiskAssessment {
  return { id, createdAt: new Date(), level: RiskLevel.Low, matches: [], summary: "test" };
}

describe("LocalAuditLogAdapter", () => {
  it("records an assessment/decision pair and lists it back, most recent first", async () => {
    const adapter = new LocalAuditLogAdapter();

    await adapter.record(makeAssessment("a1"), { kind: "proceed" });
    await adapter.record(makeAssessment("a2"), { kind: "cancelled" });

    const entries = adapter.list();
    expect(entries.map((e) => e.assessment.id)).toEqual(["a2", "a1"]);
    expect(entries[0]?.decision).toEqual({ kind: "cancelled" });
  });

  it("only ever persists what record() was given — no extra fields sneak in", async () => {
    const adapter = new LocalAuditLogAdapter();
    const assessment = makeAssessment("a1");

    await adapter.record(assessment, { kind: "proceed" });

    const [entry] = adapter.list();
    expect(Object.keys(entry!.assessment).sort()).toEqual(
      Object.keys(assessment).sort(),
    );
  });

  it("caps the retained history so local storage can't grow unbounded", async () => {
    const adapter = new LocalAuditLogAdapter();

    for (let i = 0; i < 510; i++) {
      await adapter.record(makeAssessment(`a${i}`), { kind: "proceed" });
    }

    const entries = adapter.list();
    expect(entries.length).toBe(500);
    expect(entries[0]?.assessment.id).toBe("a509");
    expect(entries.at(-1)?.assessment.id).toBe("a10");
  });

  it("clear() empties the trail", async () => {
    const adapter = new LocalAuditLogAdapter();
    await adapter.record(makeAssessment("a1"), { kind: "proceed" });

    adapter.clear();

    expect(adapter.list()).toHaveLength(0);
  });
});
