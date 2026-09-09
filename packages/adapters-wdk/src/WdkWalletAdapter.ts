import type { PreparedTransfer, SendIntent, WalletPort } from "@custos/core";

/** Mainnet USDT TRC-20. Override via `usdtTokenAddress` for testnets. */
export const TRON_USDT_MAINNET = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";

export const USDT_DECIMALS = 6;

const HANDLE_KIND = "custos.wdk.tron.usdt.v1" as const;

/** Tron base58check addresses are 34 chars starting with T, no 0/O/I/l. */
const TRON_ADDRESS_RE = /^T[1-9A-HJ-NP-Za-km-z]{33}$/;

export interface WdkTransferOptions {
  readonly token: string;
  readonly recipient: string;
  readonly amount: bigint;
}

/**
 * The slice of a WDK Tron account this adapter needs. Production wires
 * `@tetherto/wdk-wallet-tron` through `createTronWdkAccount`. Tests pass a fake
 * so CI never talks to a node or holds a seed.
 */
export interface WdkTransferClient {
  quoteTransfer(options: WdkTransferOptions): Promise<{ fee: bigint }>;
  transfer(options: WdkTransferOptions): Promise<{ hash: string; fee: bigint }>;
}

export interface WdkWalletAdapterOptions {
  readonly account: WdkTransferClient;
  readonly usdtTokenAddress?: string;
  readonly newId?: () => string;
}

interface PendingUsdtTransfer {
  readonly token: string;
  readonly recipient: string;
  readonly amount: bigint;
}

/**
 * WalletPort over WDK Tron. `prepare` only quotes (no sign, no broadcast).
 * `commit` is the only call that invokes WDK `transfer()`, which signs and
 * broadcasts. WDK's one-shot `transfer()` is wrapped, not exposed.
 *
 * MVP network is Tron. Ethereum intents are rejected rather than coerced.
 */
export class WdkWalletAdapter implements WalletPort {
  private readonly account: WdkTransferClient;
  private readonly usdtTokenAddress: string;
  private readonly newId: () => string;
  private readonly pending = new Map<string, PendingUsdtTransfer>();

  constructor(options: WdkWalletAdapterOptions) {
    this.account = options.account;
    this.usdtTokenAddress = options.usdtTokenAddress ?? TRON_USDT_MAINNET;
    this.newId = options.newId ?? (() => crypto.randomUUID());
  }

  async prepare(intent: SendIntent): Promise<PreparedTransfer> {
    const recipient = intent.destination.value.trim();
    if (intent.destination.network !== "tron") {
      throw new Error(
        `WdkWalletAdapter MVP only supports Tron USDT transfers (got network "${intent.destination.network}")`,
      );
    }
    if (!TRON_ADDRESS_RE.test(recipient)) {
      throw new Error(`Destination is not a valid Tron address: ${recipient}`);
    }

    const amount = usdtToBaseUnits(intent.amountUsdt);
    const options: WdkTransferOptions = {
      token: this.usdtTokenAddress,
      recipient,
      amount,
    };

    await this.account.quoteTransfer(options);

    const id = this.newId();
    this.pending.set(id, {
      token: options.token,
      recipient: options.recipient,
      amount: options.amount,
    });

    return { id, intent, handle: { kind: HANDLE_KIND } };
  }

  async commit(transfer: PreparedTransfer): Promise<{ readonly txHash: string }> {
    const handle = transfer.handle as { readonly kind?: unknown } | undefined;
    const prepared = this.pending.get(transfer.id);
    if (handle?.kind !== HANDLE_KIND || !prepared) {
      throw new Error(
        "Prepared transfer was not prepared by this adapter or was already committed",
      );
    }
    this.pending.delete(transfer.id);

    const result = await this.account.transfer(prepared);
    return { txHash: result.hash };
  }
}

function usdtToBaseUnits(amountUsdt: number): bigint {
  if (!Number.isFinite(amountUsdt) || amountUsdt <= 0) {
    throw new Error("USDT amount must be a positive finite number");
  }
  const scaled = Math.round(amountUsdt * 10 ** USDT_DECIMALS);
  if (scaled <= 0) {
    throw new Error("USDT amount must be a positive finite number");
  }
  return BigInt(scaled);
}
