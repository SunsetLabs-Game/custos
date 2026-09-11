/**
 * Tron network config for the browser demo wallet.
 *
 * SAFETY: this app holds a raw private key in localStorage so the demo needs no
 * wallet setup. That is only acceptable on a testnet with worthless tokens, so
 * the host is pinned to Nile and `assertTestnet` refuses anything else rather
 * than letting a mainnet host be configured by accident.
 */
export const NILE_FULL_HOST = "https://nile.trongrid.io";

/** USDT TRC-20 on Nile testnet (symbol USDT, 6 decimals — verified on-chain). */
export const NILE_USDT_CONTRACT = "TXYZopYRdj2D9XRtbG411XZZ3kM5VkAeBf";

export const USDT_DECIMALS = 6;

export const NILE_FAUCET_URL = "https://nileex.io/join/getJoinPage";

export const NILE_EXPLORER_TX = "https://nile.tronscan.org/#/transaction/";

const MAINNET_HOSTS = ["api.trongrid.io", "api.tronstack.io", "trx.mytokenpocket.vip"];

export function assertTestnet(fullHost: string): void {
  const host = new URL(fullHost).host.toLowerCase();
  if (MAINNET_HOSTS.some((m) => host.includes(m))) {
    throw new Error(
      `Refusing to use ${host}: the Custos demo wallet keeps a private key in the browser and must never touch mainnet.`,
    );
  }
}

export function usdtToBaseUnits(amountUsdt: number): bigint {
  if (!Number.isFinite(amountUsdt) || amountUsdt <= 0) {
    throw new Error("El monto USDT debe ser un número positivo.");
  }
  return BigInt(Math.round(amountUsdt * 10 ** USDT_DECIMALS));
}

export function baseUnitsToUsdt(base: bigint | string | number): number {
  return Number(BigInt(base)) / 10 ** USDT_DECIMALS;
}
