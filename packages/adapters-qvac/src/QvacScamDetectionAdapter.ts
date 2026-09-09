import type { ScamDetectionPort } from "@custos/core";
import type { ScamMatch, ScamPattern } from "@custos/core";
import { seedPatterns } from "@custos/shared";

/**
 * TODO(sdk-integration): this adapter currently only runs the cheap
 * keyword-heuristic pre-filter over the seed dataset. Wire the actual
 * @qvac/sdk local-model call here to (a) raise recall beyond exact keyword
 * matches and (b) produce the nuanced confidence score the heuristic can't.
 * See qvac.tether.io for the model-loading and inference API — this is the
 * only file in the codebase allowed to import @qvac/sdk directly.
 *
 * Keep the heuristic pass even after the model is wired in: it's a cheap
 * pre-filter that avoids running the LLM on obviously-clean text, which
 * matters for on-device latency/battery.
 */
export class QvacScamDetectionAdapter implements ScamDetectionPort {
  constructor(private readonly patterns: readonly ScamPattern[] = seedPatterns as unknown as ScamPattern[]) {}

  async analyzeText(text: string): Promise<readonly ScamMatch[]> {
    const lower = text.toLowerCase();
    const matches: ScamMatch[] = [];

    for (const pattern of this.patterns) {
      const hit = pattern.heuristics.find((h) => lower.includes(h.toLowerCase()));
      if (hit) {
        matches.push({
          pattern,
          // Heuristic-only confidence, deliberately capped below what a real
          // model pass should produce — replace once the QVAC model call lands.
          confidence: 0.6,
          evidenceSnippet: hit,
        });
      }
    }

    // TODO(sdk-integration): await this.qvacModel.classify(text) and merge/
    // replace the heuristic matches with model-scored ones.

    return matches;
  }
}
