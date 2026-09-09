import type { RiskLevel } from "../value-objects/RiskLevel.js";
import type { ScamMatch } from "./ScamPattern.js";
import type { AddressReputation } from "./Address.js";

export interface RiskAssessment {
  readonly id: string;
  readonly createdAt: Date;
  readonly level: RiskLevel;
  readonly matches: readonly ScamMatch[];
  readonly addressReputation?: AddressReputation;
  readonly summary: string;
}
