import { describe, expect, it } from "vitest";
import { RiskLevel } from "@custos/core";
import type { ScamMatch } from "@custos/core";
import { presentMatch, presentRiskLevel } from "../riskPresentation.js";

describe("presentRiskLevel", () => {
  it("maps every RiskLevel to a human label instead of the numeric enum", () => {
    expect(presentRiskLevel(RiskLevel.None).label).toBe("No known risk");
    expect(presentRiskLevel(RiskLevel.Low).label).toBe("Low");
    expect(presentRiskLevel(RiskLevel.Elevated).label).toBe("Elevated - review before sending");
    expect(presentRiskLevel(RiskLevel.High).label).toBe("High");
    expect(presentRiskLevel(RiskLevel.Critical).label).toBe("Critical - send blocked");
  });

  it("never returns the raw enum number as the label", () => {
    for (const level of [
      RiskLevel.None,
      RiskLevel.Low,
      RiskLevel.Elevated,
      RiskLevel.High,
      RiskLevel.Critical,
    ]) {
      expect(presentRiskLevel(level).label).not.toBe(String(level));
      expect(presentRiskLevel(level).color).toMatch(/^#/);
    }
  });
});

describe("presentMatch", () => {
  it("renders category and evidence in plain language", () => {
    const match: ScamMatch = {
      pattern: {
        id: "p1",
        category: "pig-butchering",
        description: "test",
        heuristics: [],
      },
      confidence: 0.7,
      evidenceSnippet: "guaranteed 30% weekly returns",
    };

    expect(presentMatch(match)).toEqual({
      categoryLabel: "Pig-butchering (fake relationship / investment)",
      evidence: "guaranteed 30% weekly returns",
      confidenceLabel: "70% confidence",
    });
  });
});
