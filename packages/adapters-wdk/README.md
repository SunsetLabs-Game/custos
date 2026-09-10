# @custos/adapters-wdk

Implements `WalletPort` from `@custos/core` over Tether WDK.

## MVP network: Tron

Hackathon MVP sends USDT on **Tron (TRC-20)** only.

- Most USDT scam volume the product is built to intercept is on Tron.
- `apps/web` currently constructs destinations as `network: "tron"`.
- Ethereum intents are rejected by the adapter. They are not coerced onto Tron.

Default token contract: `TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t` (mainnet USDT). Pass `usdtTokenAddress` for Nile/Shasta test tokens.

## prepare / commit split

WDK's ergonomic TRC-20 API is a single `account.transfer(...)` that signs and broadcasts. This adapter wraps that shortcut so the friction screen can sit between the two `WalletPort` calls:

| `WalletPort` | WDK call | Signs? | Broadcasts? |
|---|---|---|---|
| `prepare` | `quoteTransfer` | no | no |
| `commit` | `transfer` | yes | yes |

`prepare` copies token, recipient, and base-unit amount into an internal pending map. `commit` spends that snapshot, not a later mutation of `SendIntent`. A prepared transfer can be abandoned by never calling `commit`. Committing twice throws.

Do not collapse this into one `send()` on `WalletPort`.

## Wiring the real SDK

`createTronWdkAccount` is the only function that imports `@tetherto/wdk-wallet-tron`. Seed and RPC URL are required arguments so this package never embeds a key or silently targets mainnet.

```ts
import { WdkWalletAdapter, createTronWdkAccount } from "@custos/adapters-wdk";

const { account, dispose } = await createTronWdkAccount({
  seed: process.env.CUSTOS_WDK_SEED!,
  provider: process.env.CUSTOS_TRON_RPC!, // e.g. https://api.shasta.trongrid.io
});

const wallet = new WdkWalletAdapter({
  account,
  // usdtTokenAddress: "<shasta-or-nile-usdt>",
});

const prepared = await wallet.prepare(intent);
// risk UI runs here; user may cancel
const { txHash } = await wallet.commit(prepared);

dispose();
```

Unit tests inject a fake `WdkTransferClient`. They do not load WDK, hold a seed, or talk to a node.

## Manual testnet send

This is the integration check for issue #5. Do not commit a seed.

1. Create a throwaway BIP-39 phrase. Fund it on [Shasta](https://www.trongrid.io/shasta) (or Nile) with TRX for fees and a test TRC-20 that you treat as USDT.
2. From a scratch Node script in this package (not checked in):

```ts
import { WdkWalletAdapter, createTronWdkAccount } from "@custos/adapters-wdk";

const { account, dispose } = await createTronWdkAccount({
  seed: process.env.CUSTOS_WDK_SEED!,
  provider: "https://api.shasta.trongrid.io",
});
const wallet = new WdkWalletAdapter({
  account,
  usdtTokenAddress: process.env.CUSTOS_TEST_USDT!,
});
const prepared = await wallet.prepare({
  destination: { value: process.env.CUSTOS_TEST_DEST!, network: "tron" },
  amountUsdt: 1,
});
console.log("quoted, not signed. abort here to prove cancel works, or commit:");
console.log(await wallet.commit(prepared));
dispose();
```

3. Confirm in a Tron explorer that no transaction exists after `prepare` alone, and that `commit` produces a hash.
4. `apps/web` is not wired to this adapter yet. That is the end-to-end send-flow issue.
