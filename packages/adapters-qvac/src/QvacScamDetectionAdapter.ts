import type { ScamCategory, ScamDetectionPort, ScamMatch, ScamPattern } from "@custos/core";
import { seedPatterns } from "@custos/shared";

/** Heuristic hits are a cheap signal; the model may raise this, never lower it. */
const HEURISTIC_CONFIDENCE = 0.6;

/** Below this length, text with no heuristic hit is treated as obviously clean. */
const MIN_MODEL_CHARS = 40;

export interface QvacCompletionClient {
  complete(prompt: string): Promise<string>;
}

interface ModelMatch {
  readonly category: ScamCategory;
  readonly confidence: number;
  readonly evidence: string;
}

/**
 * ScamDetectionPort over a cheap keyword pre-filter plus an optional on-device
 * QVAC completion pass. The port does not change. `@qvac/sdk` is imported only
 * from `createQvacCompletionClient`, so unit tests never load the runtime.
 *
 * Heuristics still run first. The model is skipped on empty/short clean text,
 * used to raise confidence on heuristic hits, and used to catch paraphrases
 * the keyword list misses. A model failure falls back to heuristics.
 */
export class QvacScamDetectionAdapter implements ScamDetectionPort {
  constructor(
    private readonly patterns: readonly ScamPattern[] = seedPatterns as unknown as ScamPattern[],
    private readonly completion?: QvacCompletionClient,
  ) {}

  async analyzeText(text: string): Promise<readonly ScamMatch[]> {
    const heuristicMatches = this.heuristicMatches(text);
    if (!this.shouldRunModel(text, heuristicMatches.length > 0)) {
      return heuristicMatches;
    }

    try {
      const raw = await this.completion!.complete(buildClassifyPrompt(text, this.patterns));
      const modelMatches = parseModelMatches(raw, this.patterns);
      return mergeMatches(heuristicMatches, modelMatches, this.patterns);
    } catch {
      return heuristicMatches;
    }
  }

  private heuristicMatches(text: string): ScamMatch[] {
    const haystack = normalize(text);
    const matches: ScamMatch[] = [];
    for (const pattern of this.patterns) {
      const hit = pattern.heuristics.find((h) => haystack.includes(normalize(h)));
      if (hit) {
        matches.push({
          pattern,
          confidence: HEURISTIC_CONFIDENCE,
          evidenceSnippet: hit,
        });
      }
    }
    return matches;
  }

  private shouldRunModel(text: string, hasHeuristicHit: boolean): boolean {
    if (!this.completion) return false;
    const trimmed = text.trim();
    if (trimmed.length === 0) return false;
    if (hasHeuristicHit) return true;
    return trimmed.length >= MIN_MODEL_CHARS;
  }
}

/**
 * Lowercase and strip diacritics so a Spanish heuristic matches whether or not
 * the victim typed the accents ("inversión" vs "inversion") — scam chats are
 * routinely retyped or machine-translated without them.
 */
function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function buildClassifyPrompt(text: string, patterns: readonly ScamPattern[]): string {
  const categories = [...new Set(patterns.map((p) => p.category))].join(", ");
  return [
    "Classify this crypto-chat for known scam playbooks.",
    `Allowed categories: ${categories}`,
    'Reply with JSON only, no markdown: {"matches":[{"category":"<allowed category>","confidence":0.0,"evidence":"<short quote>"}]}',
    'If nothing matches: {"matches":[]}',
    "Chat:",
    text,
  ].join("\n");
}

function parseModelMatches(raw: string, patterns: readonly ScamPattern[]): ModelMatch[] {
  const json = extractJsonObject(raw);
  if (!json) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return [];
  }
  if (typeof parsed !== "object" || parsed === null || !("matches" in parsed)) return [];
  const matches = (parsed as { matches: unknown }).matches;
  if (!Array.isArray(matches)) return [];

  const allowed = new Set(patterns.map((p) => p.category));
  const result: ModelMatch[] = [];
  for (const item of matches) {
    if (typeof item !== "object" || item === null) continue;
    const category = (item as { category?: unknown }).category;
    const confidence = (item as { confidence?: unknown }).confidence;
    const evidence = (item as { evidence?: unknown }).evidence;
    if (typeof category !== "string" || !allowed.has(category as ScamCategory)) continue;
    if (typeof confidence !== "number" || !Number.isFinite(confidence) || confidence <= 0) continue;
    result.push({
      category: category as ScamCategory,
      confidence: Math.min(1, confidence),
      evidence: typeof evidence === "string" ? evidence : "",
    });
  }
  return result;
}

function extractJsonObject(raw: string): string | undefined {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) return undefined;
  return raw.slice(start, end + 1);
}

function mergeMatches(
  heuristic: readonly ScamMatch[],
  model: readonly ModelMatch[],
  patterns: readonly ScamPattern[],
): ScamMatch[] {
  const byCategory = new Map<ScamCategory, ScamMatch>();
  for (const match of heuristic) {
    const prev = byCategory.get(match.pattern.category);
    if (!prev || match.confidence > prev.confidence) {
      byCategory.set(match.pattern.category, match);
    }
  }

  for (const incoming of model) {
    const pattern =
      byCategory.get(incoming.category)?.pattern ??
      patterns.find((p) => p.category === incoming.category);
    if (!pattern) continue;
    const prev = byCategory.get(incoming.category);
    if (!prev) {
      byCategory.set(incoming.category, {
        pattern,
        confidence: incoming.confidence,
        evidenceSnippet: incoming.evidence || undefined,
      });
      continue;
    }
    if (incoming.confidence > prev.confidence) {
      byCategory.set(incoming.category, {
        pattern: prev.pattern,
        confidence: incoming.confidence,
        evidenceSnippet: incoming.evidence || prev.evidenceSnippet,
      });
    }
  }

  return [...byCategory.values()];
}
