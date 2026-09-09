import type { WalletPort, PreparedTransfer, SendIntent } from "@custos/core";

/**
 * TODO(sdk-integration): wire the real WDK wallet. The critical property to
 * preserve is the split between `prepare` (build, do not sign) and `commit`
 * (sign + broadcast) — AnalyzeSendIntent's risk assessment must run in the
 * gap between these two calls. See the WDK docs for the exact build/sign API
 * and don't collapse this into a single "send" call, even if WDK offers one.
 */
export class WdkWalletAdapter implements WalletPort {
  async prepare(intent: SendIntent): Promise<PreparedTransfer> {
    throw new Error(
      `WdkWalletAdapter.prepare not implemented — wire WDK (amount=${intent.amountUsdt} USDT, dest=${intent.destination.value})`,
    );
  }

  async commit(_transfer: PreparedTransfer): Promise<{ readonly txHash: string }> {
    throw new Error("WdkWalletAdapter.commit not implemented — wire WDK sign+broadcast");
  }
}
