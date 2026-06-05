# Accounts Strict / Full Leaf Current Plan

Scope: accounts only. This file records the current corrected policy for the
accounts module after the 2026-06-01 review pass.

## Gate Decision

`consumerStartReady=9/9` Gate 1 static context is not a completion signal for accounts and does not
allow switching to another module under the current strict policy. The nine current rows are the legacy eight
accounts rows plus the current 1.0.9 `import_chatgpt_session_account`
frontend/IPC boundary.

Accounts cannot use a third-party substitute route. For accounts, the next module is
blocked until accounts reaches `strictImplementationUse` or
`readyToImplement` / `full_leaf_100` under the upstream evidence rules.

Current status:

- `consumerStartReady`: 9/9 Gate 1 context only; strict/highest remains blocked
- `consumerStartBlocked`: 0/9 for Gate 1 static context only
- `strictImplementationUse`: 0/9
- `readyToImplement`: 0/9
- `implementation_use`: false
- `gate_accepted`: false
- `full_leaf_100`: false
- `moduleExitAllowed`: false

## What Is Already Closed

- Same-version macOS 1.0.9 backend owner / pseudocode / call-tree is accepted
  for the legacy eight accounts leaves:
  `<source-location>/intermediate/aimami/1.0.9/macos/accounts/backend-owner-pseudocode-calltree/manifest.json`.
- `import_chatgpt_session_account` has current 1.0.9 static frontend wrapper /
  UI dialog / IPC evidence, backend owner/body evidence, helper/subhelper
  pseudocode, static persistence leaves, and draft acceptance reducers. Those
  do not close consumer start; runtime envelopes, durable side-effect bytes,
  rollback/no-write semantics, and executed acceptance remain missing.
- Static DTO and local side-effect direction are known for the eight leaves.
- The AiMaMi 1.0.9 SOT app is present under
  `<source-location>/source-binary/AiMaMi 1.0.9.app`.

These do not close strict/full leaf because they do not execute the upstream
runtime path.

## Missing Between Current State And `strictImplementationUse`

| Area | Required evidence |
|---|---|
| Runtime invocation | Accepted same-version macOS 1.0.9 IPC/WebView/Tauri harness must invoke all 9 current accounts commands from the SOT app. |
| Frontend UI/state | `switch_account` needs visible pure-switch UI-state proof; `logout` and `begin_add_account_attach_monitor` need terminal frontend CCF or accepted same-platform runtime UI/native callback proof; the other five CCF rows still need runtime/UI acceptance. |
| Request / response / error | Exact request body, success envelope, warnings, and error/CoreError envelope for every leaf and field failure path. |
| Durable side effects | Before/after bytes for auth, registry, quota, snooze, export/import files, temp files, and monitor state where applicable. |
| Rollback semantics | Switch/restart rollback, import partial failure, export write failure, remove partial-delete, logout active/no-active, and monitor re-entry/failure need executed fixtures. |
| Acceptance | source archive unit/E2E/manual acceptance must be bound to the executed upstream traces, not draft-only mapping. |
| Platform | macOS scope is declared and same-platform only; this macOS folder does not require another platform to close macOS accounts evidence. |

## Per-Leaf Strict Blockers

| Leaf | Current blocker before strict |
|---|---|
| `switch_account` | Direct wrapper/backend proof exists, but visible pure-switch UI-state, runtime invocation, exact envelopes, and auth/registry/quota bytes are missing. |
| `switch_account_and_restart_codex` | Backend restart/rollback topology exists, but executed restart/switch-failure/restart-failure fixtures and durable rollback bytes are missing. |
| `preview_account_import` | Static read-only parse boundary exists, but runtime defaults/nullability, invalid file/JSON/non-UTF8 errors, no-write before/after proof, and acceptance are missing. |
| `import_accounts_from_file` | Static `selectedKeys` behavior exists, but null/empty/missing selected keys, overwrite states, partial failure, before/after auth/registry bytes, and rollback/no-rollback are missing. |
| `export_accounts_to_file` | Static `accountKeys` behavior exists, but null/empty/missing keys, target exists/write failure, exact output bytes, temp residue, and no-write-to-registry proof are missing. |
| `logout` | IPC wrapper and backend proof exist, but terminal frontend CCF/UI-state, active/no-active envelopes, auth backup/delete bytes, snooze/registry bytes, and acceptance are missing. |
| `remove_accounts` | Partial frontend CCF and backend proof exist, but missing-field/partial-delete fixtures, auth/quota/snooze/registry bytes, and acceptance are missing. |
| `begin_add_account_attach_monitor` | IPC wrapper and backend proof exist, but terminal frontend CCF/UI-state, monitor lifecycle/event/re-entry/failure trace, and acceptance are missing. |
| `import_chatgpt_session_account` | Current frontend wrapper/dialog/IPC and backend/helper static proof exist, but exact runtime success/error envelopes, auth snapshot bytes, registry rebuild bytes, temp/rollback/no-write proof, frontend toast/refresh state, and executed acceptance are missing. |

## Current Required Next Work

1. Build or obtain an accepted accounts-only macOS 1.0.9 runtime harness. Do not
   run main/product tests and do not use third-party substitute behavior.
2. Execute all 9 current accounts commands under disposable `HOME` / `CODEX_HOME`
   fixtures from the SOT app.
3. Capture exact request, success response, warning, and error envelope for the
   main path and high-risk failures.
4. Capture durable before/after bytes and rollback/no-rollback state.
5. Bind every trace to the existing 1.0.9 backend owner / pseudocode /
   call-tree evidence and to executed source archive acceptance.
6. Keep this folder macOS-only; do not use another platform as a macOS blocker.

Gate effect: no promotion. This plan clarifies the blocker; it does not add
raw evidence, append `INDEX.jsonl`, or mark accounts ready.
