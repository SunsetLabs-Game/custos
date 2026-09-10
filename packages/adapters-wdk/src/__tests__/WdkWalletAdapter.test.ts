import { describe, expect, it } from "vitest";
import type { SendIntent } from "@custos/core";
import {
  TRON_USDT_MAINNET,
  WdkWalletAdapter,
  type WdkTransferClient,
  type WdkTransferOptions,
} from "../WdkWalletAdapter.js";

const TRON_DESTINATION = "TLyqzVGLV1srkB7dToTAEqgDSfPtXRJZYH";

class RecordingAccount implements WdkTransferClient {
  readonly quotes: WdkTransferOptions[] = [];
  readonly transfers: WdkTransferOptions[] = [];
  quoteError: Error | undefined;
  transferError: Error | undefined;
  quoteResult = { fee: 1_000_000n };
  transferResult = { hash: "txid-prepared-commit", fee: 1_000_000n };

  async quoteTransfer(options: WdkTransferOptions) {
    this.quotes.push({ ...options });
    if (this.quoteError) throw this.quoteError;
    return this.quoteResult;
  }

  async transfer(options: WdkTransferOptions) {
    this.transfers.push({ ...options });
    if (this.transferError) throw this.transferError;
    return this.transferResult;
  }
}

function makeIntent(overrides: Partial<SendIntent> = {}): SendIntent {
  return {
    destination: { value: TRON_DESTINATION, network: "tron" },
    amountUsdt: 12.5,
    ...overrides,
  };
}

describe("WdkWalletAdapter", () => {
  it("prepare quotes a TRC20 USDT transfer and never signs or broadcasts", async () => {
    const account = new RecordingAccount();
    const adapter = new WdkWalletAdapter({ account, newId: () => "prep-1" });

    const prepared = await adapter.prepare(makeIntent());

    expect(prepared.id).toBe("prep-1");
    expect(prepared.intent.amountUsdt).toBe(12.5);
    expect(account.quotes).toEqual([
      {
        token: TRON_USDT_MAINNET,
        recipient: TRON_DESTINATION,
        amount: 12_500_000n,
      },
    ]);
    expect(account.transfers).toEqual([]);
  });

  it("commit broadcasts the prepared amount even if the intent object is mutated later", async () => {
    const account = new RecordingAccount();
    const adapter = new WdkWalletAdapter({ account });
    const intent = makeIntent({ amountUsdt: 10 });

    const prepared = await adapter.prepare(intent);
    (intent as { amountUsdt: number }).amountUsdt = 999_999;

    const result = await adapter.commit(prepared);

    expect(result).toEqual({ txHash: "txid-prepared-commit" });
    expect(account.transfers).toEqual([
      {
        token: TRON_USDT_MAINNET,
        recipient: TRON_DESTINATION,
        amount: 10_000_000n,
      },
    ]);
    expect(account.quotes).toHaveLength(1);
  });

  it("does not call transfer when prepare is abandoned without commit", async () => {
    const account = new RecordingAccount();
    const adapter = new WdkWalletAdapter({ account });

    await adapter.prepare(makeIntent());

    expect(account.transfers).toEqual([]);
  });

  it("rejects a second commit of the same prepared transfer", async () => {
    const account = new RecordingAccount();
    const adapter = new WdkWalletAdapter({ account });
    const prepared = await adapter.prepare(makeIntent({ amountUsdt: 1 }));

    await adapter.commit(prepared);

    await expect(adapter.commit(prepared)).rejects.toThrow(/already committed|consumed/i);
    expect(account.transfers).toHaveLength(1);
  });

  it("rejects a prepared transfer whose handle is not a WDK Tron handle", async () => {
    const account = new RecordingAccount();
    const adapter = new WdkWalletAdapter({ account });
    const prepared = await adapter.prepare(makeIntent({ amountUsdt: 1 }));

    await expect(adapter.commit({ ...prepared, handle: { kind: "other" } })).rejects.toThrow(
      /not prepared/i,
    );
    expect(account.transfers).toEqual([]);
  });

  it("rejects commit of a handle that this adapter did not prepare", async () => {
    const account = new RecordingAccount();
    const adapter = new WdkWalletAdapter({ account });

    await expect(
      adapter.commit({
        id: "unknown",
        intent: makeIntent(),
        handle: { kind: "custos.wdk.tron.usdt.v1" },
      }),
    ).rejects.toThrow(/not prepared/i);
    expect(account.transfers).toEqual([]);
  });

  it("rejects non-Tron destinations so the MVP cannot silently send on the wrong chain", async () => {
    const account = new RecordingAccount();
    const adapter = new WdkWalletAdapter({ account });

    await expect(
      adapter.prepare(
        makeIntent({
          destination: {
            value: "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
            network: "ethereum",
          },
        }),
      ),
    ).rejects.toThrow(/tron/i);
    expect(account.quotes).toEqual([]);
    expect(account.transfers).toEqual([]);
  });

  it("rejects a Tron network label with a non-Tron address", async () => {
    const account = new RecordingAccount();
    const adapter = new WdkWalletAdapter({ account });

    await expect(
      adapter.prepare(
        makeIntent({
          destination: { value: "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6", network: "tron" },
        }),
      ),
    ).rejects.toThrow(/address/i);
    expect(account.quotes).toEqual([]);
  });

  it("rejects a non-positive USDT amount", async () => {
    const account = new RecordingAccount();
    const adapter = new WdkWalletAdapter({ account });

    await expect(adapter.prepare(makeIntent({ amountUsdt: 0 }))).rejects.toThrow(
      /positive finite number/i,
    );
    await expect(adapter.prepare(makeIntent({ amountUsdt: -1 }))).rejects.toThrow(
      /positive finite number/i,
    );
    expect(account.quotes).toEqual([]);
  });

  it("uses a caller-supplied USDT contract instead of the mainnet default", async () => {
    const account = new RecordingAccount();
    const adapter = new WdkWalletAdapter({
      account,
      usdtTokenAddress: "TTestUsdtContractAddress00000000001",
    });

    await adapter.prepare(makeIntent({ amountUsdt: 1 }));

    expect(account.quotes[0]?.token).toBe("TTestUsdtContractAddress00000000001");
  });

  it("surfaces quoteTransfer failures during prepare without calling transfer", async () => {
    const account = new RecordingAccount();
    account.quoteError = new Error("provider unavailable");
    const adapter = new WdkWalletAdapter({ account });

    await expect(adapter.prepare(makeIntent({ amountUsdt: 1 }))).rejects.toThrow(
      /provider unavailable/,
    );
    expect(account.transfers).toEqual([]);
  });
});
