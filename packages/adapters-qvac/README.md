# @custos/adapters-qvac

The only package allowed to import `@qvac/sdk`. Implements three ports from
`@custos/core`:

| Port | File | Status |
|---|---|---|
| `ScamDetectionPort` | `QvacScamDetectionAdapter.ts` | Heuristic pre-filter plus optional on-device QVAC completion pass. |
| `TranslationPort` | `QvacTranslateAdapter.ts` | Stub. Required for submission; this is the Track 02 load-bearing piece. |
| `OcrPort` | `QvacVisionAdapter.ts` | Stub. Stretch goal, pick up last. |

Pinned SDK: `@qvac/sdk` `0.19.0`. Classification model: Llama 3.2 1B Instruct Q4_0 (`LLAMA_3_2_1B_INST_Q4_0`).

## How the two passes work

1. Keyword heuristics over `scam-patterns.json` (confidence capped at 0.6).
2. If a `QvacCompletionClient` is provided, and the text is a heuristic hit or a longer paste, `completion()` classifies paraphrases and may raise confidence. It never lowers a heuristic hit. Model failures fall back to heuristics.

`apps/web` keeps constructing `new QvacScamDetectionAdapter()` (heuristics only). Vite cannot load `@qvac/sdk` (Node / Bare / Expo). Wire the runtime from a supported host:

```ts
import { QvacScamDetectionAdapter } from "@custos/adapters-qvac";
import { createQvacCompletionClient } from "@custos/adapters-qvac/runtime";

const { client, dispose } = await createQvacCompletionClient();
const scamDetection = new QvacScamDetectionAdapter(undefined, client);
```

Unit tests inject a fake client. CI does not download a model.

## Performance log

Record load time, prompt, token counts, TTFT, and throughput in
`docs/performance-log.md` on the submission device. The first model row is
already listed; fill the run numbers when you execute `createQvacCompletionClient`
on QVAC-capable hardware.

## Local dev without a device

`packages/core` tests use hand-written fakes of these ports. You do not need a
QVAC-capable device to work on `core` or `apps/web` wiring.
