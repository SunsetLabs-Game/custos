# @custos/adapters-qvac

The only package allowed to import `@qvac/sdk`. Implements three ports from
`@custos/core`:

| Port | File | Status |
|---|---|---|
| `ScamDetectionPort` | `QvacScamDetectionAdapter.ts` | Heuristic pre-filter works today; QVAC model call is a `TODO(sdk-integration)`. |
| `TranslationPort` | `QvacTranslateAdapter.ts` | Stub — **required for submission**, this is the Track 02 load-bearing piece. |
| `OcrPort` | `QvacVisionAdapter.ts` | Stub — stretch goal, pick up last. |

## Wiring the real SDK

1. Read the model/hardware docs at [qvac.tether.io](https://qvac.tether.io) and
   pick target models for scam-text classification and TranslatePsy.
2. Add `@qvac/sdk` as a dependency here with the exact version pinned.
3. Replace each `TODO(sdk-integration)` with the real model-load + inference
   call. Keep the constructor signatures unchanged so `packages/core` and
   `apps/web` don't need to change.
4. Record model load time, prompts used, token counts, TTFT, and throughput in
   `docs/performance-log.md` — required Track 02 deliverable.

## Local dev without a device

Until the SDK is wired, `packages/core` tests use hand-written fakes of these
ports (see `packages/core/src/**/__tests__`) — you don't need a QVAC-capable
device to work on `core` or `apps/web` wiring.
