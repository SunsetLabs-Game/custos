# @custos/adapters-wdk

Implements `WalletPort` from `@custos/core` over WDK.

**Non-negotiable design constraint:** keep `prepare` (build, unsigned) and
`commit` (sign + broadcast) as two separate calls. The friction/warning screen
in `apps/web` must be able to run — and let the user cancel — strictly
between them. If WDK's ergonomic API is a single `send(...)`, wrap it as two
steps here rather than exposing that shortcut through `WalletPort`.

## Wiring the real SDK

Consult the WDK docs for the exact transaction-building and signing API for a
USDT transfer (network: Tron or Ethereum — pick one for the hackathon MVP,
document the choice here once made). Replace the `TODO(sdk-integration)` /
`not implemented` bodies in `WdkWalletAdapter.ts`.
