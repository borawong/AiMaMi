# Accounts Monitor Frontend Callback Gap - AiMaMi 1.0.9

Scope: accounts-only frontend/native-callback gap reducer for
`begin_add_account_attach_monitor` on AiMaMi 1.0.9 macOS.

This reducer consumes existing static frontend evidence and existing blocked
runtime diagnostics only. It creates no raw evidence, appends no `INDEX.jsonl`
row, edits no regulation file, runs no product test, and promotes no gate.

## Evidence Consumed

- `<source-location>/intermediate/aimami/1.0.9/macos/accounts/frontend-ccf-accounts-repair/relocated-raw-bundle/manifest.json`
- `<source-location>/intermediate/aimami/1.0.9/macos/accounts/frontend-static-ui-branch-matrix/matrix.json`
- `<source-location>/intermediate/aimami/1.0.9/macos/accounts/frontend-absence-proof/manifest.json`
- `<source-location>/intermediate/aimami/1.0.9/macos/accounts/frontend-absence-proof/frontend-negative-absence.jsonl`
- `<source-location>/intermediate/aimami/1.0.9/macos/accounts/frontend-absence-proof/frontend-wrapper-use-index.jsonl`
- `<source-location>/intermediate/aimami/1.0.9/macos/accounts/legacy-leaf-diagnostics/begin_add_account_attach_monitor/runtime-lifecycle-probe/manifest.json`
- `logic/ACCOUNTS-IDA-STATIC-CROSSCHECK-109.md`

## IDA Static Corroboration

Local IDA Pro MCP, connected through HTTP at `127.0.0.1:13337`, was used only
as static corroboration for the current AiMaMi 1.0.9 SOT binary
`1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482`.

| Item | IDA result | Gate effect |
|---|---|---|
| Monitor owner | `0x100262db4` / `codexmate_lib::commands::system::begin_add_account_attach_monitor` | Static owner confirmed only. |
| Tauri command closure | Caller closure starts at `0x1003250c0`; xref into monitor owner from `0x100325278`. | Static registration/caller hint only. |
| Command string cluster | Closure decompile contains `begin_add_account_attach_monitorrun_daemon_once`. | Confirms command string adjacency; not frontend runtime proof. |
| Tauri plumbing | Closure decompile contains `StateManager::try_get`, `InvokeResolver::return_result`, `InvokeResolver::respond`, then monitor owner call. | Confirms command wrapper path only. |
| Owner branches | Owner decompile contains lock poisoning string, `Repository::load_snapshot_local`, thread spawn path, and `failed to spawn thread`. | Confirms backend branch candidates only. |

This IDA evidence narrows the backend/native side of the monitor leaf but does
not prove accounts-page UI entry, WebView invocation, callback delivery,
runtime event order, cleanup, envelope shape, side-effect bytes, or acceptance
fixture execution.

## Current Finding

`begin_add_account_attach_monitor` remains frontend-incomplete for current
AiMaMi 1.0.9 accounts.

| Dimension | Current evidence | Result |
|---|---|---|
| IPC wrapper string | `frontend-absence-proof` finds `"begin_add_account_attach_monitor"` in the index asset. | Wrapper/string only. |
| Accounts-page terminal callsite | The accounts-page member-call list contains `exportAccountsToFile`, `importAccountsFromFile`, `importChatGptSessionAccount`, `openPath`, `previewAccountImport`, `removeAccounts`, and `switchAccountAndRestartCodex`; it does not contain `beginAddAccountAttachMonitor`. | Missing. |
| Frontend CCF rows | `frontend-control-flow` rows for this target are `0`; the command remains in the missing frontend CCF set. | Missing. |
| Render surface / UI-state | No current accounts-page add-account terminal UI entry, monitor progress state, completion/cancel/timeout/error state, or cleanup state is accepted. | Missing. |
| Native callback / helper substitute | Existing runtime lifecycle probe captured startup/process/file/socket/window facts only. It did not reach add-account UI entry, monitor event delivery, accepted callback substitute, or WebView/Tauri IPC invocation. | Missing. |
| Runtime acceptance | No command body, envelope, lifecycle event sequence, side-effect bytes, PASS/FAIL fixture, or reducer acceptance exists. | Missing. |
| IDA static backend owner | IDA confirms owner/caller/static branch hints for `0x100262db4`. | Static-only; not a strict close. |

## Boundary

The current evidence is useful only to narrow the gap:

- static frontend evidence proves there is no visible accounts-page terminal
  callsite in the dumped current accounts chunk;
- runtime lifecycle diagnostics prove only startup-side facts and rejected
  external listener probing;
- neither evidence class is accepted frontend runtime/UI proof;
- neither evidence class is an accepted same-platform native callback/helper
  substitute under `full_leaf_100_definition_v2`.

## Strict Blocker

Before `begin_add_account_attach_monitor` can enter
`strictImplementationUse`, accounts still needs a same-version accepted proof
for one of these paths:

1. real accounts-page frontend control-flow/UI-state into terminal
   `begin_add_account_attach_monitor` invocation; or
2. an explicitly accepted same-platform native callback/helper substitute that
   proves monitor creation, attach, event delivery, completion/cancel/timeout,
   cleanup, and error behavior.

Both paths still also require runtime command/body, response/error envelope,
side-effect/lifecycle evidence, executed acceptance, and independent platform
closure.

## Gate Effect

No promotion.

- `consumerStartReady`: accounts total is `9/9` for Gate 1 static context only;
  strict/highest remains blocked.
- `consumerStartBlocked`: `0/9` for Gate 1 static context only.
- `strictImplementationUse`: `0` for accounts.
- `readyToImplement`: `0` for accounts.
- `implementation_use`: false.
- `gate_accepted`: false.
- `full_leaf_100`: false.
- `moduleExitAllowed`: false.

This reducer makes the frontend/native-callback blocker explicit. It does not
allow switching to plugins, relay, system, or tray.
