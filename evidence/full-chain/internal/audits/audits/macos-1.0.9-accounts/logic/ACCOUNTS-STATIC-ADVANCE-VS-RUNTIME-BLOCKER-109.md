# Accounts Static Advance vs Runtime Blocker - AiMaMi 1.0.9

Scope: accounts-only reducer for separating static evidence that can still
advance implementation planning from evidence that must remain runtime-blocked
under `full_leaf_100_definition_v2`.

This file writes no raw evidence, appends no `INDEX.jsonl` row, edits no
regulation file, runs no product/main test, touches no other-platform evidence, and
promotes no gate.

## Evidence Consumed

- `logic/ACCOUNTS-CURRENT-EVIDENCE-LEDGER-109.md`
- `logic/ACCOUNTS-RUNTIME-HARNESS-BLOCKER-TAXONOMY-109.md`
- `logic/ACCOUNTS-DTO-ENVELOPE-GAP-MATRIX-109.md`
- `logic/ACCOUNTS-ACCEPTANCE-FIXTURE-CROSSWALK-109.md`
- `logic/ACCOUNTS-BACKEND-SIDEEFFECT-GAP-REFINEMENT-109.md`
- `logic/ACCOUNTS-NEXT-STRICT-PROOF-QUEUE-109.md`
- `logic/ACCOUNTS-COMMAND-WRAPPER-DTO-IDACLUSTER-STATIC-109.md`

## Current Gate State

- Active module: accounts.
- `consumerStartReady`: 9/9 Gate 1 static context only.
- `consumerStartBlocked`: 0/9 for Gate 1 static context only.
- `strictImplementationUse`: 0/9.
- `readyToImplement`: 0/9.
- `implementation_use`: false.
- `gate_accepted`: false.
- `full_leaf_100`: false.
- `moduleExitAllowed`: false.

## Static Can Advance

| Area | Static planning value | Limit |
|---|---|---|
| SOT / binary state | Current AiMaMi 1.0.9 SOT exists under `raw/binary`; the old runtime execution app-missing status is stale/non-SOT history. | Does not prove runtime IPC or command execution. |
| Rejected route taxonomy | Localhost listener, WebDriver/CDP 404s, inspector menu absence, LLDB attach denial, and static Tauri strings are reusable rejected-route facts. | They must not be retried as strict proof unless a new route proves real WebView/Tauri internals. |
| Fixture planning | Existing fixture crosswalk and workorder can order low-risk probes, starting with `accounts.preview_account_import.missing_path.v1`. | Fixture rows are design only until executed and accepted. |
| DTO/default/null classification | Frontend wrappers, JS defaults, IDA command/field cluster, static success payload keys, and static error hints can shape direct IPC fixture rows. | Live Tauri serde/decode envelopes remain unknown. |
| Backend side-effect ordering | Static fs/auth/registry/quota/snooze/process/monitor order narrows what before/after bytes must be captured. | Static callsites are not durable byte proof and do not prove rollback/no-rollback. |
| Preview no-write direction | `preview_account_import.missing_path.v1` is the preferred first runtime lane because static metadata failure returns before read/parse/registry/active-field helpers. | No-write remains directional until before/after bytes are captured. |

## Must Remain Runtime

| Runtime blocker | Required proof |
|---|---|
| Accepted IPC harness | Same-version AiMaMi 1.0.9 proof that JavaScript execution reached the real WKWebView / Tauri IPC context, not app launch, localhost listener, WebDriver/CDP 404, static strings, or UI clicks. |
| Exact invoke | Exact command name and JSON body for each fixture. |
| Exact transport envelope | Success/error/warning/CoreError bytes, including omitted/null/empty/array/object field distinctions. |
| Durable side effects | Before/after bytes or explicit absence proof for auth, registry, quota, snooze, temp, export/import files, backup/restore, and monitor state. |
| Frontend/runtime state | Dialog/toast/loading/query invalidation/native callback state or accepted same-platform substitute. |
| Dynamic branch behavior | Switch rollback/restart/process; preview invalid/missing/no-write; import selected/overwrite/partial write; export output/write failure; logout active/no-active; remove partial-delete/quota; monitor lifecycle/event/reentry. |
| Acceptance binding | Executed source archive unit/E2E/manual acceptance id, PASS/FAIL, raw evidence path, and reducer acceptance boolean. |
| Platform closure | macOS scope is declared; this macOS folder does not require another platform as a current blocker. |

## Selected Next Lane

The only current next strict proof lane remains:

```text
fixture_id: accounts.preview_account_import.missing_path.v1
command: preview_account_import
request body: { "filePath": "<disposable>/import/missing.json" }
required result: accepted same-version IPC harness, exact error envelope,
no-write before/after bytes, UI/native state, and acceptance binding
```

Do not expand to import/export/switch/logout/remove/monitor runtime rows until
the selected preview missing-path lane has an accepted same-version trace.

## Gate Effect

No promotion.

- `consumerStartReady`: accounts remains `9/9` Gate 1 static context only.
- `consumerStartBlocked`: accounts remains `0/9` for Gate 1 static context only.
- `strictImplementationUse`: `0/9`.
- `readyToImplement`: `0/9`.
- `implementation_use`: false.
- `gate_accepted`: false.
- `full_leaf_100`: false.
- `moduleExitAllowed`: false.

This reducer only fixes the accounts proof boundary. `moduleExitAllowed=false`
until the required macOS accounts gate closes.
