# Accounts Logic Registration Closure - AiMaMi 1.0.9

Scope: accounts-only consumer entry registration closure for the current
AiMaMi 1.0.9 macOS `frontend-relay-diff` bundle.

This reducer creates no raw evidence, appends no `INDEX.jsonl` row, edits no
regulation, edits no product code, runs no product test, and promotes no gate.

## Decision

All current `logic/ACCOUNTS-*.md` consumer reducers in this bundle must be
discoverable from the machine-readable entry files:

- `manifest.json` `outputs[]`
- `manifest.json` `deliverables.logic[]`
- `data/task-plan.json` `outputs[]`
- `gate-report.json` `deliverables.logic[]`

This closes an indexing gap only. It does not alter any reducer's evidence
status and does not change the accounts gate.

Current registered accounts reducer count after the ChatGPT session IDB strict
gap crosscheck reducer is `151`, matching the actual
`logic/ACCOUNTS-*.md` file count and the machine-readable
`accountsLogicRegistrationClosure` fields.

The same correction also closes targeted human handoff misses in:

- `AI.md`
- `SYSTEM-DIFF.md`
- `pointers/evidence-paths.md`
- `reviews/AGENT.md`
- `reviews/CLAUDE.md`
- `reviews/CROSS-REVIEW.md`

Those handoff entries are file-name pointers and non-promoting review notes,
not independent evidence promotion.

Latest registered reducer:
`logic/ACCOUNTS-CHATGPT-SESSION-IDB-STRICT-GAP-CROSSCHECK-109.md`.

## Current Accounts State

- Current accounts rows: 9.
- Current active module: accounts.
- `consumerStartReady=9/9` Gate 1 static context only.
- `consumerStartBlocked=0/9` Gate 1 static context only.
- `strictImplementationUse=0/9`.
- `readyToImplement=0/9`.
- `implementation_use=false`.
- `gate_accepted=false`.
- `full_leaf_100=false`.
- `moduleExitAllowed=false`.

## Boundary

This reducer is intentionally not a runtime proof. It does not execute the
selected `accounts.preview_account_import.missing_path.v1` fixture, does not
reach a real AiMaMi WKWebView/Tauri IPC context, does not capture envelopes,
and does not prove side-effect bytes. It only ensures existing accounts
consumer reducers are not missed by downstream intake.

## Gate Effect

No promotion. Accounts remains the active module and cannot exit to plugins,
relay, system, or tray.

## Accounts Preview Import Parser CoreError Map Static - 2026-06-02

- Registered reducer: `logic/ACCOUNTS-PREVIEW-IMPORT-PARSER-COREERROR-MAP-STATIC-109.md`.
- Actual accounts logic count after registration target: 147.
- Accepted static fact: `parse_import_file` parser branches now map to error classes: metadata/read failures are `IO error`, and oversize/JSON/kind/schema/too-many/empty-account validation failures are `Invalid data`.
- Gate effect: no promotion; accounts remains active and `moduleExitAllowed=false`.

## Accounts Preview Import Registry Path Source Static - 2026-06-02

- Registered reducer: `logic/ACCOUNTS-PREVIEW-IMPORT-REGISTRY-PATH-SOURCE-STATIC-109.md`.
- Actual accounts logic count after registration target: 148.
- Accepted static fact: valid-preview helper reads use the same cloned `accounts/registry.json` path slice from `CodexPaths`; request `filePath` remains parser/payload input and is not the registry helper path.
- Gate effect: no promotion; accounts remains active and `moduleExitAllowed=false`.

## Accounts Export Accounts IDB Owner / Callsite Correction - 2026-06-02

- Registered reducer: `logic/ACCOUNTS-EXPORT-ACCOUNTS-IDB-OWNER-CALLSITE-CORRECTION-109.md`.
- Actual accounts logic count after registration target: 149.
- Accepted static correction: `0x10032ce58` is the `export_accounts_to_file` blocking command body/function start; `0x10032d0cc` is the callsite inside that body to core owner `0x1005ddd0c`, not the function owner.
- IDB writeback: comments added to `0x10032ce58`, `0x10032d0cc`, and `0x1005ddd0c`; `idb_save` returned OK.
- Gate effect: no promotion; accounts remains active and `moduleExitAllowed=false`.

## Accounts IDB-first Static Recheck Batch - 2026-06-02

- Registered reducer: `logic/ACCOUNTS-IDB-FIRST-STATIC-RECHECK-BATCH-109.md`.
- Actual accounts logic count after registration target: 150.
- Accepted static fact: seven accounts lanes were rechecked under skill-fused IDB-first rules and consolidated as non-promoting static planning/correction evidence.
- Gate effect: no promotion; accounts remains active and `moduleExitAllowed=false`.

## Accounts ChatGPT Session IDB Strict Gap Crosscheck - 2026-06-02

- Registered reducer: `logic/ACCOUNTS-CHATGPT-SESSION-IDB-STRICT-GAP-CROSSCHECK-109.md`.
- Actual accounts logic count after registration target: 151.
- Accepted static fact: `import_chatgpt_session_account` has IDB-confirmed blocking body `0x10032dbf0`, core owner `0x1005e1d6c`, conversion leaf `0x100625bc4`, payload serializer `0x1001d704c`, write callsite `0x1005e2250`, rebuild callsite `0x1005e2278`, and rebuild-error mapper `0x1005e2974`.
- Gate effect: no promotion; accounts remains active and `moduleExitAllowed=false`.

## Accounts Monitor IDB Lifecycle / Event Crosscheck - 2026-06-02

- Registered reducer: `logic/ACCOUNTS-MONITOR-IDB-LIFECYCLE-EVENT-CROSSCHECK-109.md`.
- Actual accounts logic count after registration target: 152.
- Accepted static fact: `begin_add_account_attach_monitor` has IDB-confirmed owner `0x100262db4`, wrapper callsite `0x100325278`, thread shim callsite `0x100185790`, polling body `0x100529504`, refresh scheduler `0x100262aec`, spawned refresh task `0x10030d508`, `refresh_full_runtime_snapshot` callsite `0x10030d5c0`, `broadcast_runtime_snapshot` callsite `0x1001e6ad8`, and Tauri event emit callsite `0x1001e3ad0` for `runtime-state-updated`.
- IDB writeback: comments added to owner/callsite/leaf addresses; `idb_save` returned OK.
- Gate effect: no promotion; accounts remains active and `moduleExitAllowed=false`.

## Accounts Preview Import Fixture UI / No-Write Crosscheck - 2026-06-02

- Registered reducer: `logic/ACCOUNTS-PREVIEW-IMPORT-FIXTURE-UI-NOWRITE-CROSSCHECK-109.md`.
- Actual accounts logic count after registration target: 153.
- Accepted static fact: first strict fixture lane `accounts.preview_account_import.missing_path.v1` now has frontend cancel/error/success state and IDB parser-first no-write selector narrowed. Backend addresses: `0x10032c93c`, `0x10032cb40`, `0x1005dd788`, `0x1005dd7c4`, `0x1005e13fc`, `0x1005e142c`.
- IDB writeback: comments added to listed addresses; `idb_save` returned OK.
- Gate effect: no promotion; accounts remains active and `moduleExitAllowed=false`.
