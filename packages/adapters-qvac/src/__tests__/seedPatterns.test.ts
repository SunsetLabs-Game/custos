import { describe, expect, it } from "vitest";
import { seedPatterns } from "@custos/shared";
import type { ScamCategory } from "@custos/core";
import { QvacScamDetectionAdapter } from "../QvacScamDetectionAdapter.js";

// Mirrors the ScamCategory union in packages/core — kept in sync by hand so
// a typo'd category in the seed JSON (which isn't type-checked, being JSON)
// fails a test instead of silently becoming an unrecognized category.
const VALID_CATEGORIES: readonly ScamCategory[] = [
  "pig-butchering",
  "fake-support",
  "recovery-scam",
  "romance-scam",
  "fake-investment-platform",
  "urgency-pressure",
  "address-poisoning",
  "task-scam",
  "impersonation-authority",
  "airdrop-claim-fee",
  "otc-escrow-scam",
  "phishing-approval-drain",
];

describe("seed scam-pattern dataset", () => {
  it("has a unique id per pattern", () => {
    const ids = seedPatterns.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("only uses recognized categories", () => {
    for (const pattern of seedPatterns) {
      expect(VALID_CATEGORIES).toContain(pattern.category);
    }
  });

  it("gives every pattern a non-empty description", () => {
    for (const pattern of seedPatterns) {
      expect(pattern.description.length).toBeGreaterThan(0);
    }
  });

  it("covers a broad enough set of real-world playbooks to be useful", () => {
    expect(seedPatterns.length).toBeGreaterThanOrEqual(10);
    expect(new Set(seedPatterns.map((p) => p.category)).size).toBeGreaterThanOrEqual(10);
  });

  it("is matchable by the heuristic pre-filter for at least one phrase per pattern", async () => {
    const adapter = new QvacScamDetectionAdapter();

    for (const pattern of seedPatterns) {
      if (pattern.heuristics.length === 0) continue; // e.g. address-poisoning, which isn't text-based

      const [firstHeuristic] = pattern.heuristics;
      const matches = await adapter.analyzeText(`some chat text — ${firstHeuristic} — more chat text`);

      expect(matches.some((m) => m.pattern.id === pattern.id)).toBe(true);
    }
  });
});
