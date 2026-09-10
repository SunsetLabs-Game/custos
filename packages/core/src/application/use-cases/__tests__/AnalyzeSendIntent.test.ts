import { describe, expect, it } from "vitest";
import { AnalyzeSendIntent } from "../AnalyzeSendIntent.js";
import { RiskLevel } from "../../../domain/value-objects/RiskLevel.js";
import type { ScamDetectionPort } from "../../../domain/ports/ScamDetectionPort.js";
import type { RiskListPort } from "../../../domain/ports/RiskListPort.js";
import type { SendIntent } from "../../../domain/entities/SendIntent.js";

const address = { value: "TXYZ...demo", network: "tron" } as const;

function makeIntent(overrides: Partial<SendIntent> = {}): SendIntent {
  return { destination: address, amountUsdt: 100, ...overrides };
}

describe("AnalyzeSendIntent", () => {
  it("returns None risk when nothing matches and address is clean", async () => {
    const scamDetection: ScamDetectionPort = { analyzeText: async () => [] };
    const riskList: RiskListPort = {
      lookup: async () => ({ address, flagged: false, source: "none" }),
      reportScam: async () => {},
      sync: async () => {},
    };
    const useCase = new AnalyzeSendIntent({ scamDetection, riskList });

    const result = await useCase.execute(makeIntent());

    expect(result.level).toBe(RiskLevel.None);
  });

  it("forces Critical when the destination address is flagged, regardless of text confidence", async () => {
    const scamDetection: ScamDetectionPort = { analyzeText: async () => [] };
    const riskList: RiskListPort = {
      lookup: async () => ({ address, flagged: true, source: "p2p-sync" }),
      reportScam: async () => {},
      sync: async () => {},
    };
    const useCase = new AnalyzeSendIntent({ scamDetection, riskList });

    const result = await useCase.execute(makeIntent());

    expect(result.level).toBe(RiskLevel.Critical);
  });

  it("derives risk level from the strongest text match confidence", async () => {
    const pattern = {
      id: "p1",
      category: "pig-butchering" as const,
      description: "test",
      heuristics: [],
    };
    const scamDetection: ScamDetectionPort = {
      analyzeText: async () => [{ pattern, confidence: 0.7 }],
    };
    const riskList: RiskListPort = {
      lookup: async () => ({ address, flagged: false, source: "none" }),
      reportScam: async () => {},
      sync: async () => {},
    };
    const useCase = new AnalyzeSendIntent({ scamDetection, riskList });

    const result = await useCase.execute(
      makeIntent({ context: { text: "guaranteed 30% weekly returns, act now" } }),
    );

    expect(result.level).toBe(RiskLevel.High);
    expect(result.matches).toHaveLength(1);
  });

  it("uses precomputed text matches and does not call scamDetection again", async () => {
    const pattern = {
      id: "p1",
      category: "pig-butchering" as const,
      description: "test",
      heuristics: [],
    };
    const scamDetection: ScamDetectionPort = {
      analyzeText: async () => {
        throw new Error("analyzeText should not run when textMatches are provided");
      },
    };
    const riskList: RiskListPort = {
      lookup: async () => ({ address, flagged: false, source: "none" }),
      reportScam: async () => {},
      sync: async () => {},
    };
    const useCase = new AnalyzeSendIntent({ scamDetection, riskList });

    const result = await useCase.execute(makeIntent({ context: { text: "already translated" } }), {
      textMatches: [{ pattern, confidence: 0.7 }],
    });

    expect(result.level).toBe(RiskLevel.High);
    expect(result.matches).toHaveLength(1);
  });

  it("flags a lookalike destination address as a poisoning attempt", async () => {
    const scamDetection: ScamDetectionPort = { analyzeText: async () => [] };
    const riskList: RiskListPort = {
      lookup: async () => ({ address, flagged: false, source: "none" }),
      reportScam: async () => {},
      sync: async () => {},
    };
    const useCase = new AnalyzeSendIntent({ scamDetection, riskList });
    const knownRecipient = { value: "TAbc12300000000000000000000WXYZ99", network: "tron" } as const;
    const lookalikeDestination = { value: "TAbc123DIFFERENTMIDDLESECTIONWXYZ99", network: "tron" } as const;

    const result = await useCase.execute(
      makeIntent({ destination: lookalikeDestination, recentRecipients: [knownRecipient] }),
    );

    expect(result.level).toBe(RiskLevel.Critical);
    expect(result.matches).toHaveLength(1);
    expect(result.matches[0]?.pattern.category).toBe("address-poisoning");
  });
});
