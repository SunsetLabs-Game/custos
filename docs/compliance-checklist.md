# Compliance checklist

Live checklist against the official Decentralized AI Hackathon rules
(trydojo.io) and the general Tether Developers Cup rules. Update the status
column as work lands — this file is the source of truth, not the pitch doc it
replaced.

Deadline: **2026-09-11, 08:00 Panama time.**

## Track 03 — Sovereign Intelligence at the Edge (primary)

| Requirement | Status | Notes |
|---|---|---|
| Built with QVAC SDK (`@qvac/sdk`) | ⬜ | `adapters-qvac` is the only package allowed to import it |
| Inference never routed to a cloud API | ⬜ | Verify no adapter makes an inference network call before submission |
| Cloud OK for non-inference (hosting UI, etc.) | ✅ by design | apps/web bundle can be statically hosted |
| Repo accessible to judges for full evaluation period | ✅ | Verified public 2026-09-10; keep it public through the evaluation period |
| Demo video ≤ 5 minutes, link accessible without credentials | ⬜ | See `docs/demo-script.md` |
| All third-party bases declared in README | ⬜ | Keep "Disclosed external services" section current |
| Pears/Hyperswarm P2P bonus (not required) | ⬜ stretch | `adapters-p2p/HyperswarmRiskListAdapter` |

## Track 02 — QVAC Psy (secondary, targeted alongside Track 03)

| Requirement | Status | Notes |
|---|---|---|
| At least one Psy model central to the main user flow | ⬜ | TranslatePsy — see README rationale |
| Uses `@qvac/sdk` for all core inference/RAG | ⬜ | |
| Main experience runs locally on declared consumer hardware | ⬜ | Document hardware in `docs/performance-log.md` |
| Remote services limited to non-AI functions (e.g. optional sync) | ✅ by design | Hyperswarm sync is not inference |
| All remote APIs / third-party components disclosed | ⬜ | README "Disclosed external services" |
| Open source under a permissive license | ✅ | MIT — see `LICENSE` |
| Setup instructions + hardware spec for reproducibility | ⬜ | README "Setup" |
| Honest model names, quantizations, hardware disclosed | ⬜ | Fill in once models are chosen |
| Demo video ≤ 5 minutes | ⬜ | Shared with Track 03 submission |
| Performance log: model load, prompts, token count, TTFT, throughput | ⬜ | `docs/performance-log.md` |
| Full user workflow demoed, not just an SDK call/benchmark | ⬜ | The send-flow demo covers this |

## Track 01 — Philips Installed-Base Intelligence

**Not pursued.** Different domain (hospital field-service equipment
inventory); no honest bridge from a payments-fraud shield to that problem.
Documented here so the decision is explicit, not accidental.

## General submission hygiene

| Item | Status | Notes |
|---|---|---|
| Public repo, MIT license | ✅ | |
| Progressive commits (not one giant upload) | ✅ ongoing | Verified 2026-09-10: commits/PRs from multiple contributors spread across 2026-09-09 through 2026-09-10, not a single end-of-window dump; keep committing incrementally through the deadline |
| README setup steps a judge can follow cold | ⬜ | |
| No Tether/QVAC branding used decoratively without functional relevance | ✅ by design | USDT is the protected asset, not a logo |
