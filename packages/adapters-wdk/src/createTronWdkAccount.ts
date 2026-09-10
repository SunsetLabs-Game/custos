import WalletManagerTron from "@tetherto/wdk-wallet-tron";
import type { WdkTransferClient, WdkTransferOptions } from "./WdkWalletAdapter.js";

export interface CreateTronWdkAccountConfig {
  readonly seed: string;
  readonly provider: string;
  readonly transferMaxFee?: bigint;
  readonly accountIndex?: number;
}

/**
 * Builds the real WDK Tron account used by `WdkWalletAdapter`. Seed and RPC
 * URL are required so this never silently points at mainnet or embeds a key.
 * Call `dispose()` when the process is done so WDK can clear key material.
 */
export async function createTronWdkAccount(
  config: CreateTronWdkAccountConfig,
): Promise<{ account: WdkTransferClient; dispose: () => void }> {
  const seed = config.seed.trim();
  const provider = config.provider.trim();
  if (!seed) {
    throw new Error("createTronWdkAccount requires a BIP-39 seed phrase");
  }
  if (!provider) {
    throw new Error("createTronWdkAccount requires a Tron RPC provider URL");
  }

  const wallet = new WalletManagerTron(seed, {
    provider,
    transferMaxFee: config.transferMaxFee,
  });
  const account = await wallet.getAccount(config.accountIndex ?? 0);

  const client: WdkTransferClient = {
    quoteTransfer: (options: WdkTransferOptions) => account.quoteTransfer(options),
    transfer: (options: WdkTransferOptions) => account.transfer(options),
  };

  return {
    account: client,
    dispose: () => wallet.dispose(),
  };
}
