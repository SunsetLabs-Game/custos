# Performance log (Track 02 required deliverable)

Required by the QVAC Psy track: a structured performance log including model
load, prompts, token count, TTFT, and throughput.

CI does not download or run the QVAC model. Fill the run table on the
submission device after `createQvacCompletionClient()` has loaded
`LLAMA_3_2_1B_INST_Q4_0`.

## Test hardware

- Device: _fill on submission device_
- Chip / RAM: _fill on submission device_
- OS: _fill on submission device_

## Models used

| Model | Quantization | Purpose |
|---|---|---|
| Llama 3.2 1B Instruct (`LLAMA_3_2_1B_INST_Q4_0`) | Q4_0 | scam-pattern classification (second pass after heuristics) |
| TranslatePsy (_variant pending issue #3_) | _pending_ | chat-context translation |
| VisionPsy (_variant pending stretch_) | _pending_ | screenshot OCR |

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
