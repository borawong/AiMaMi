# Root Data Index Reconciliation

Date: 2026-05-31T22:40:00+08:00

Scope: root coordination layer under `<source-location>/`.

This reducer records the current authoritative root files after OneDrive
conflict cleanup and canonical bundle sync. It does not create raw evidence,
does not append `<source-location>/INDEX.jsonl`,
and does not promote any gate.

## Current Authoritative Root Files

- `<source-location>/task-plan.json`
- `<source-location>/data/current-counts-summary.regenerated.json`
- `<source-location>/data/producer-ledger-rollup.regenerated.json`
- `<source-location>/AI-EXECUTION-QUEUE.md`

Historical queue notes may mention removed root data names such as
`current-producer-ledger-rollup-20260531.json`,
`full-leaf-100-gap-audit.json`, or `full-chain-status.json`. Those notes are
historical provenance only. Consumers must use the regenerated files above for
the current 36-row macOS overlay.

## Current Canonical Bundles

| module | canonical bundle | current root sync reducer |
|---|---|---|
| accounts | `<source-location>/audits/macos-1.0.8-accounts/` | `logic/ACCOUNTS-ROOT-REGENERATED-SYNC.md` |
| plugins | `<source-location>/audits/macos-1.0.8-plugins/` | `logic/PLUGINS-ROOT-REGENERATED-SYNC.md` |
| relay_targeted | `<source-location>/audits/macos-1.0.8-fix-relay/` | `logic/RELAY-ROOT-REGENERATED-SYNC.md` |
| system | `<source-location>/audits/macos-1.0.8-system/` | `logic/SYSTEM-ROOT-REGENERATED-SYNC.md` |
| tray | `<source-location>/audits/macos-1.0.8-tray/` | `logic/TRAY-ROOT-REGENERATED-SYNC.md` |

The current macOS 1.0.9 planning view directly migrates these canonical
1.0.8 / 1.0.8-fix boundaries where the 1.0.9 diff is empty or same-surface.
This is a current parity planning boundary, not upstream strict proof.

## Root Counts

- `totalRows=36`
- `consumerStartReady=20`
- `consumerStartBlocked=16`
- `strictImplementationUse=4`
- `readyToImplement=0`
- `implementation_use=false`
- `gate_accepted=false`
- `full_leaf_100=false`

## source archive INDEX Reconciliation

The canonical raw index is:

`<source-location>/INDEX.jsonl`

Current read-only audit observed the index as mixed historical schema. Some
older rows point at `<source-location>/audits/...` conclusion packages or local
absolute paths; those rows are provenance, not raw evidence for current gate
promotion. For 1.0.9 bootstrap paths, dateless correction rows supersede older
dated bootstrap rows.

Consumers must not treat all INDEX rows as equal current raw proof. Use bundle
`pointers/evidence-paths.md`, `manifest.json`, and the canonical bundle
task-plan to decide whether a row is consumable evidence, historical provenance,
workorder-only, or diagnostic/no-promote.

## Non-canonical Historical Files

The current root scan found legacy files such as `MANIFEST.md`, `evidence.md`,
and `binary-info.txt` in older canonical bundles. They contain historical
evidence summaries and local-path provenance, but they are not current consumer
entrypoints. Current entrypoints are the standard `manifest.json`, `AI.md`,
`SYSTEM-DIFF.md`, `README.md`, `logic/*.md`, `reviews/*.md`, `pointers/`, and
`data/task-plan.json`.

## Non Actions

- no raw artifact written
- no `INDEX.jsonl` append
- no duplicate bundle created
- no dated root reducer created
- no gate promotion
