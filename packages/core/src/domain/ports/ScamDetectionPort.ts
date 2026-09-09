import type { ScamMatch } from "../entities/ScamPattern.js";

/**
 * Implemented by adapters-qvac using @qvac/sdk. Must run fully on-device —
 * no implementation of this port may make a network call to perform the
 * inference itself (fetching an updated pattern dataset is fine; running the
 * model remotely is not).
 */
export interface ScamDetectionPort {
  analyzeText(text: string): Promise<readonly ScamMatch[]>;
}
