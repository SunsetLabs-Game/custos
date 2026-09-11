import type { PreparedTransfer, SendIntent, WalletPort } from "@custos/core";
import { getOrCreateDemoWallet } from "./demoWallet.js";
import {
  NILE_FULL_HOST,
  NILE_USDT_CONTRACT,
  assertTestnet,
  baseUnitsToUsdt,
  usdtToBaseUnits,
} from "./tronNetwork.js";

const HANDLE_KIND = "custos.tron.nile.usdt.v1" as const;
const TRON_ADDRESS_RE = /^T[1-9A-HJ-NP-Za-km-z]{33}$/;
const FEE_LIMIT_SUN = 100_000_000; // 100 TRX ceiling for the TRC-20 call
const SUN_PER_TRX = 1_000_000;

export interface WalletSnapshot {
  readonly address: string;
  readonly trxBalance: number;
  readonly usdtBalance: number;
  /** False when the account can't pay for energy/bandwidth yet. */
  readonly funded: boolean;
}

export type FeeEstimate =
  | { readonly kind: "ok"; readonly feeTrx: number; readonly energyUsed: number }
  /** The node reverted the simulation: sender holds less USDT than it is sending. */
  | { readonly kind: "insufficient-usdt" }
  | { readonly kind: "unavailable"; readonly reason: string };

interface PendingTransfer {
  readonly recipient: string;
  readonly amount: bigint;
}

/**
 * Real USDT TRC-20 transfers on Nile testnet, signed in the browser with the
 * demo wallet key. `prepare` only simulates (constant call) so the risk gate in
 * ProtectorTab always sits between the quote and the irreversible `commit`.
 *
 * tronweb is ~1MB, so it is imported dynamically — the landing page never pays
 * for it.
 */
export class TronUsdtWalletAdapter implements WalletPort {
  private readonly pending = new Map<string, PendingTransfer>();
  private tronWebPromise: Promise<any> | null = null;

  private async tron(): Promise<any> {
    if (!this.tronWebPromise) {
      this.tronWebPromise = (async () => {
        assertTestnet(NILE_FULL_HOST);
        const [{ TronWeb }, wallet] = await Promise.all([
          import("tronweb"),
          getOrCreateDemoWallet(),
        ]);
        return new TronWeb({ fullHost: NILE_FULL_HOST, privateKey: wallet.privateKey });
      })();
    }
    return this.tronWebPromise;
  }

  async snapshot(): Promise<WalletSnapshot> {
    const tronWeb = await this.tron();
    const address: string = tronWeb.defaultAddress.base58;

    const [sunBalance, usdtBase] = await Promise.all([
      tronWeb.trx.getBalance(address).catch(() => 0),
      this.usdtBalanceBase(tronWeb, address).catch(() => 0n),
    ]);

    const trxBalance = Number(sunBalance) / SUN_PER_TRX;
    return {
      address,
      trxBalance,
      usdtBalance: baseUnitsToUsdt(usdtBase),
      funded: trxBalance > 0,
    };
  }

  private async usdtBalanceBase(tronWeb: any, address: string): Promise<bigint> {
    const contract = await tronWeb.contract().at(NILE_USDT_CONTRACT);
    const raw = await contract.balanceOf(address).call();
    return BigInt(raw.toString());
  }

  /**
   * Simulates the transfer against the node to read real energy cost. No
   * signature, nothing broadcast.
   *
   * The node reverts the simulation when the sender holds less USDT than it is
   * trying to send, so that case is reported rather than replaced with an
   * invented number.
   */
  async estimateFee(intent: SendIntent): Promise<FeeEstimate> {
    const tronWeb = await this.tron();
    const recipient = intent.destination.value.trim();
    const amount = usdtToBaseUnits(intent.amountUsdt);

    let result: { energy_used?: number };
    try {
      result = await tronWeb.transactionBuilder.triggerConstantContract(
        NILE_USDT_CONTRACT,
        "transfer(address,uint256)",
        {},
        [
          { type: "address", value: recipient },
          { type: "uint256", value: amount.toString() },
        ],
        tronWeb.defaultAddress.hex,
      );
    } catch (err) {
      const message = String(err);
      if (message.includes("REVERT")) {
        return { kind: "insufficient-usdt" };
      }
      return { kind: "unavailable", reason: message.slice(0, 160) };
    }

    const energyUsed = result?.energy_used ?? 0;
    const params = await tronWeb.trx.getChainParameters();
    const energyFee =
      params.find((p: { key: string; value: number }) => p.key === "getEnergyFee")?.value ?? 420;
    return { kind: "ok", feeTrx: (energyUsed * energyFee) / SUN_PER_TRX, energyUsed };
  }

  async prepare(intent: SendIntent): Promise<PreparedTransfer> {
    if (intent.destination.network !== "tron") {
      throw new Error(
        `El demo on-chain solo soporta Tron (red recibida: "${intent.destination.network}").`,
      );
    }
    const recipient = intent.destination.value.trim();
    if (!TRON_ADDRESS_RE.test(recipient)) {
      throw new Error(`Dirección Tron inválida: ${recipient}`);
    }

    const amount = usdtToBaseUnits(intent.amountUsdt);
    const id = crypto.randomUUID();
    this.pending.set(id, { recipient, amount });
    return { id, intent, handle: { kind: HANDLE_KIND } };
  }

  async commit(transfer: PreparedTransfer): Promise<{ readonly txHash: string }> {
    const handle = transfer.handle as { readonly kind?: unknown } | undefined;
    const prepared = this.pending.get(transfer.id);
    if (handle?.kind !== HANDLE_KIND || !prepared) {
      throw new Error("Esta transferencia no fue preparada por este adaptador o ya se envió.");
    }
    this.pending.delete(transfer.id);

    const tronWeb = await this.tron();
    const contract = await tronWeb.contract().at(NILE_USDT_CONTRACT);
    const txHash: string = await contract
      .transfer(prepared.recipient, prepared.amount.toString())
      .send({ feeLimit: FEE_LIMIT_SUN });

    return { txHash };
  }
}
