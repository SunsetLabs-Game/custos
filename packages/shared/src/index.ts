import seedPatterns from "./scam-patterns.json" with { type: "json" };

export { seedPatterns };
export type SeedScamPattern = (typeof seedPatterns)[number];
