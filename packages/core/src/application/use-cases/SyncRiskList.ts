import type { RiskListPort } from "../../domain/ports/RiskListPort.js";
import type { Address } from "../../domain/entities/Address.js";

export interface SyncRiskListDeps {
  readonly riskList: RiskListPort;
}

/** Thin wrapper so the app layer doesn't reach into the port directly for these two actions. */
export class SyncRiskList {
  constructor(private readonly deps: SyncRiskListDeps) {}

  async pull(): Promise<void> {
    await this.deps.riskList.sync();
  }

  async reportScam(address: Address): Promise<void> {
    await this.deps.riskList.reportScam(address);
  }
}
