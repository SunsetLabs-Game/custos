# Performance log (Track 02 required deliverable)

Required by the QVAC Psy track: a structured performance log including model
load, prompts, token count, TTFT, and throughput.

CI does not download or run the QVAC models. Fill the run table on the
submission device after `createQvacCompletionClient()`, `createQvacTranslationClient()`,
and `createQvacVisionClient()` (all in `packages/adapters-qvac`) have each
loaded their model at least once.

## Test hardware

- Device: _fill on submission device_
- Chip / RAM: _fill on submission device_
- OS: _fill on submission device_

## Models used

| Model | Quantization | Purpose |
|---|---|---|
| Llama 3.2 1B Instruct (`LLAMA_3_2_1B_INST_Q4_0`) | Q4_0 | scam-pattern classification (second pass after heuristics) |
| Llama 3.2 1B Instruct via QVAC `translate()` | Q4_0 | chat-context translation (TranslatePsy slot; AfriSLM is `AFRICAN_4B_TRANSLATION_Q4_K_M`) |
| EasyOCR Latin (`OCR_LATIN`, detector auto-derived) | GGUF | screenshot/QR OCR (VisionPsy slot) |

## Sample classification prompt

The adapter sends this shape (categories come from the seed dataset):

```
Classify this crypto-chat for known scam playbooks.
Allowed categories: pig-butchering, fake-support, ...
Reply with JSON only, no markdown: {"matches":[{"category":"<allowed category>","confidence":0.0,"evidence":"<short quote>"}]}
If nothing matches: {"matches":[]}
Chat:
<pasted chat text>
```

## Runs

Add one row per representative prompt/run. Keep raw numbers, not rounded
summaries. Judges asked for reproducible evidence.

| Timestamp | Model | Prompt (truncated) | Input tokens | Output tokens | Model load time (ms) | TTFT (ms) | Throughput (tok/s) |
|---|---|---|---|---|---|---|---|
| _pending on-device run_ | Llama 3.2 1B Instruct Q4_0 | Classify this crypto-chat... / guaranteed 30% weekly returns | _pending_ | _pending_ | _pending_ | _pending_ | _pending_ |
| _pending on-device run_ | Llama 3.2 1B Instruct Q4_0 (translate) | detectLanguage + translate of a pasted non-English scam chat | _pending_ | _pending_ | _pending_ | _pending_ | _pending_ |
| _pending on-device run_ | EasyOCR Latin (`OCR_LATIN`) | Screenshot of a fake trading dashboard | n/a | n/a | _pending_ | _pending_ | _pending_ |

These three rows are placeholders on purpose — `createQvacCompletionClient`,
`createQvacTranslationClient`, and `createQvacVisionClient` are implemented
and unit-tested against injected fakes (CI never downloads a model), but
real load time/TTFT/throughput numbers require running on the actual
submission device. This file is not complete until those are filled in with
real measurements — see issue #14.
