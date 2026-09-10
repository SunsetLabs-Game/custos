import { describe, expect, it } from "vitest";
import type { ScamPattern } from "@custos/core";
import {
  QvacScamDetectionAdapter,
  type QvacCompletionClient,
} from "../QvacScamDetectionAdapter.js";

const pig: ScamPattern = {
  id: "pig-1",
  category: "pig-butchering",
  description: "guaranteed returns",
  heuristics: ["guaranteed 30% weekly returns"],
};

const recovery: ScamPattern = {
  id: "rec-1",
  category: "recovery-scam",
  description: "recovery fee",
  heuristics: ["recovery fee"],
};

class FakeCompletion implements QvacCompletionClient {
  readonly prompts: string[] = [];
  response = `{"matches":[]}`;
  error: Error | undefined;

  async complete(prompt: string): Promise<string> {
    this.prompts.push(prompt);
    if (this.error) throw this.error;
    return this.response;
  }
}

describe("QvacScamDetectionAdapter", () => {
  it("keeps the heuristic pre-filter when no model client is wired", async () => {
    const adapter = new QvacScamDetectionAdapter([pig]);
    const matches = await adapter.analyzeText("please send, guaranteed 30% weekly returns today");

    expect(matches).toHaveLength(1);
    expect(matches[0]?.pattern.id).toBe("pig-1");
    expect(matches[0]?.confidence).toBe(0.6);
  });

  it("does not call the model on empty or obviously-short clean text", async () => {
    const completion = new FakeCompletion();
    const adapter = new QvacScamDetectionAdapter([pig], completion);

    expect(await adapter.analyzeText("")).toEqual([]);
    expect(await adapter.analyzeText("hi")).toEqual([]);
    expect(completion.prompts).toEqual([]);
  });

  it("calls the model on longer text even when heuristics miss, to catch paraphrases", async () => {
    const completion = new FakeCompletion();
    completion.response = JSON.stringify({
      matches: [
        {
          category: "pig-butchering",
          confidence: 0.91,
          evidence: "lock in this private yield desk",
        },
      ],
    });
    const adapter = new QvacScamDetectionAdapter([pig], completion);
    const text =
      "A stranger on Telegram wants me to lock in this private yield desk with my USDT before midnight.";

    const matches = await adapter.analyzeText(text);

    expect(completion.prompts).toHaveLength(1);
    expect(completion.prompts[0]).toContain("pig-butchering");
    expect(matches).toHaveLength(1);
    expect(matches[0]?.pattern.id).toBe("pig-1");
    expect(matches[0]?.confidence).toBe(0.91);
    expect(matches[0]?.evidenceSnippet).toBe("lock in this private yield desk");
  });

  it("raises heuristic confidence when the model agrees, and never lowers it", async () => {
    const completion = new FakeCompletion();
    completion.response = JSON.stringify({
      matches: [{ category: "pig-butchering", confidence: 0.88, evidence: "guaranteed 30% weekly returns" }],
    });
    const adapter = new QvacScamDetectionAdapter([pig], completion);
    const raised = await adapter.analyzeText("please send, guaranteed 30% weekly returns today");
    expect(raised[0]?.confidence).toBe(0.88);

    completion.response = JSON.stringify({
      matches: [{ category: "pig-butchering", confidence: 0.2, evidence: "weak" }],
    });
    const kept = await adapter.analyzeText("please send, guaranteed 30% weekly returns today");
    expect(kept[0]?.confidence).toBe(0.6);
    expect(kept[0]?.evidenceSnippet).toBe("guaranteed 30% weekly returns");
  });

  it("falls back to heuristics when the model throws or returns invalid JSON", async () => {
    const completion = new FakeCompletion();
    const adapter = new QvacScamDetectionAdapter([pig, recovery], completion);
    const text = "please send, guaranteed 30% weekly returns today";

    completion.error = new Error("model offline");
    const afterThrow = await adapter.analyzeText(text);
    expect(afterThrow).toHaveLength(1);
    expect(afterThrow[0]?.confidence).toBe(0.6);

    completion.error = undefined;
    completion.response = "not json at all";
    const afterJunk = await adapter.analyzeText(text);
    expect(afterJunk).toHaveLength(1);
    expect(afterJunk[0]?.pattern.id).toBe("pig-1");
  });

  it("ignores model categories that are not in the seed dataset", async () => {
    const completion = new FakeCompletion();
    completion.response = JSON.stringify({
      matches: [{ category: "not-a-real-category", confidence: 0.99, evidence: "x" }],
    });
    const adapter = new QvacScamDetectionAdapter([pig], completion);
    const text =
      "A stranger on Telegram wants me to lock in this private yield desk with my USDT before midnight.";

    const matches = await adapter.analyzeText(text);
    expect(matches).toEqual([]);
  });
});
