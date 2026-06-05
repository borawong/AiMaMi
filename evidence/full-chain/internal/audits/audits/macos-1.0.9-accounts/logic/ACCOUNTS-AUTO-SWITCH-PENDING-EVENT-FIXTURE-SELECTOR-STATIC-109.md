# Accounts Auto Switch Pending Event Fixture Selector Static - AiMaMi 1.0.9

Scope: accounts-only static selector reducer for pending account auto-switch
runtime fixture target selection in AiMaMi 1.0.9 macOS universal.

Status: static selector only. This reducer writes no raw artifact, appends no
`INDEX.jsonl` row, runs no app/runtime probe, emits no frontend dump, raw dump,
log, binary, or legacy-tool artifact, edits no rule/spec/skill file, changes no
product code, runs no product test, and promotes no gate. It is a queue
preparation reducer for future runtime acceptance, not a runtime acceptance
result.

## Boundary

This reducer only selects the pending auto-switch event fixture set and runtime
acceptance target shapes. It does not restate command ownership, repository
leaf closure, DTO serializer closure, switch/restart rollback closure, or
frontend consumption closure except as consumed evidence.

The command symbols sit under `codexmate_lib::commands::system`, but the
pending state is accounts data: current account, candidate account, quota
thresholds, pending state, snooze state, account switch state, and runtime
snapshot refresh. The selector therefore stays inside the active accounts
audit bundle.

## Evidence Consumed

Reducer inputs:

- `logic/ACCOUNTS-AUTO-SWITCH-PENDING-COMMANDS-STATIC-109.md`
- `logic/ACCOUNTS-AUTO-SWITCH-PAYLOAD-SERIALIZERS-STATIC-109.md`
- `logic/ACCOUNTS-AUTO-SWITCH-PENDING-FRONTEND-CONSUMPTION-STATIC-109.md`

Frontend CCF / IPC rows:

- `<source-location>/raw/aimami/1.0.9/macos/frontend/macos-109-frontend-ccf-found-app/frontend/frontend-control-flow.jsonl:46`
  - `load_pending_auto_switch`
  - wrapper `We` / `loadPendingAutoSwitch`
  - no arg keys
- `<source-location>/raw/aimami/1.0.9/macos/frontend/macos-109-frontend-ccf-found-app/frontend/frontend-control-flow.jsonl:47`
  - `dismiss_pending_auto_switch`
  - wrapper `We` / `dismissPendingAutoSwitch`
  - no arg keys
  - guarded by `if (!!t || o)`
- `<source-location>/raw/aimami/1.0.9/macos/frontend/macos-109-frontend-ccf-found-app/frontend/frontend-control-flow.jsonl:48`
  - `confirm_pending_auto_switch_and_restart_codex`
  - wrapper `We` / `confirmPendingAutoSwitchAndRestartCodex`
  - no arg keys
  - guarded by `if (!!t || o)`
  - confirm path uses the restart variant
- `<source-location>/raw/aimami/1.0.9/macos/frontend/macos-109-frontend-ccf-found-app/frontend/ipc-contracts.jsonl:98`
  - `loadPendingAutoSwitch` to `load_pending_auto_switch`
  - no args
- `<source-location>/raw/aimami/1.0.9/macos/frontend/macos-109-frontend-ccf-found-app/frontend/ipc-contracts.jsonl:99`
  - `dismissPendingAutoSwitch` to `dismiss_pending_auto_switch`
  - no args
- `<source-location>/raw/aimami/1.0.9/macos/frontend/macos-109-frontend-ccf-found-app/frontend/ipc-contracts.jsonl:100`
  - `confirmPendingAutoSwitch` to `confirm_pending_auto_switch`
  - no args
- `<source-location>/raw/aimami/1.0.9/macos/frontend/macos-109-frontend-ccf-found-app/frontend/ipc-contracts.jsonl:101`
  - `confirmPendingAutoSwitchAndRestartCodex` to
    `confirm_pending_auto_switch_and_restart_codex`
  - no args

IDA MCP same-version recheck:

- SOT universal SHA:
  `1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482`
- IDA source:
  `<source-location>/source-binary/AiMaMi 1.0.9_ida.app/Contents/MacOS/AiMaMi.i64`
- command owners:
  - `load_pending_auto_switch`: `0x1002606fc`
  - `confirm_pending_auto_switch`: `0x1002613d8`
  - `dismiss_pending_auto_switch`: `0x1002618b4`
- repository leaves:
  - `Repository::load_pending_auto_switch`: `0x1005ea840`
  - `Repository::confirm_pending_auto_switch`: `0x1005eeb54`
  - `Repository::dismiss_pending_auto_switch`: `0x1005eec9c`
- switch owner: `0x1005e3cd0`
- accounts runtime refresh: `0x1001e6a1c`
- restart-capable pending path: `0x1001e8258`
- pending payload serializers: `0x1001d6830`, `0x1001d6998`

Some existing IDB comments carry older `gate=readyToImplement` or
`strictImplementationUse` wording. Those comments are stale reuse indexes only.
They are not current gate facts, not implementation permission, and not a
promotion source for this reducer.

## Fixture Set

The selector fixture set is exactly four rows:

1. `accounts.auto_switch_pending.load_present.v1`
2. `accounts.auto_switch_pending.dismiss_present.v1`
3. `accounts.auto_switch_pending.confirm_restart_present.v1`
4. `accounts.auto_switch_pending.confirm_no_restart_present.v1`

These rows are runtime-only targets. They must not run before an accepted real
AiMaMi 1.0.9 WKWebView/Tauri IPC route exists.

| Fixture | Runtime command/event target | Selection reason |
|---|---|---|
| `accounts.auto_switch_pending.load_present.v1` | `load_pending_auto_switch` plus pending dialog/event listener observation | proves present pending payload can be reached, transported, rendered, and correlated with listener delivery |
| `accounts.auto_switch_pending.dismiss_present.v1` | `dismiss_pending_auto_switch` after a present pending payload | proves snooze write, pending clear, dialog/query/toast update, and no rollback path |
| `accounts.auto_switch_pending.confirm_restart_present.v1` | `confirm_pending_auto_switch_and_restart_codex` after a present pending payload | proves pending candidate switch, restart-capable path, refresh handling, side-effect bytes, and rollback/recovery behavior |
| `accounts.auto_switch_pending.confirm_no_restart_present.v1` | `confirm_pending_auto_switch` after a present pending payload | proves non-restart pending confirm semantics separately from the restart frontend branch |

## Runtime-Only Field Requirements

Every fixture above must capture these runtime-only fields before any future
reducer may classify it as executed:

| Field | Required runtime capture |
|---|---|
| real WKWebView/Tauri IPC reachability | proof that the command is invoked from the real AiMaMi 1.0.9 WebView/Tauri context, not an external or synthetic wrapper |
| request bytes | exact no-arg request bytes and Tauri transport envelope for the selected command |
| success envelope bytes | exact success response bytes, including CoreEnvelope or command result shape where applicable |
| error/CoreError envelope bytes | exact error response bytes for missing/no-pending, switch failure, refresh failure, write failure, or clear failure branches as applicable |
| auto-switch-pending event payload/listener delivery | emitted payload bytes and listener delivery proof for the pending dialog path |
| pending dialog/toast/query state | rendered dialog state, busy guards, toast branch, query invalidation, and pending state after action |
| side-effect bytes | before/after bytes for pending file, snooze file, auth file, registry, quota, runtime snapshot, and restart side effects as applicable |
| rollback/no-rollback | rollback bytes for switch/restart failure fixtures, and no-rollback proof for load/dismiss/non-restart success paths |
| PASS/FAIL | explicit source archive acceptance verdict with failure reason when failed |
| raw runtime path | env-relative raw/intermediate runtime evidence path, written only by an approved runtime producer route |

## Fixture Details

### `accounts.auto_switch_pending.load_present.v1`

Runtime-only fields:

- real WKWebView/Tauri IPC reachability: required before execution.
- request bytes: no-arg `load_pending_auto_switch` request bytes required.
- success/error/CoreError envelope bytes: present-pending success envelope and
  no-pending/error envelope bytes required.
- auto-switch-pending event payload/listener delivery: required to correlate
  load result with listener delivery and dialog state.
- pending dialog/toast/query state: pending dialog visible state and query state
  required.
- side-effect bytes: no-write side-effect proof required.
- rollback/no-rollback: no-rollback proof required.
- PASS/FAIL: required in the runtime evidence.
- raw runtime path: required only after the approved runtime route writes it.

### `accounts.auto_switch_pending.dismiss_present.v1`

Runtime-only fields:

- real WKWebView/Tauri IPC reachability: required before execution.
- request bytes: no-arg `dismiss_pending_auto_switch` request bytes required.
- success/error/CoreError envelope bytes: dismiss success plus write/clear
  failure envelope bytes required.
- auto-switch-pending event payload/listener delivery: required before and
  after dismissal to prove listener/dialog state transition.
- pending dialog/toast/query state: busy guard, dismissed dialog state, toast,
  and invalidation state required.
- side-effect bytes: snooze write and pending clear before/after bytes required.
- rollback/no-rollback: no-rollback proof required.
- PASS/FAIL: required in the runtime evidence.
- raw runtime path: required only after the approved runtime route writes it.

### `accounts.auto_switch_pending.confirm_restart_present.v1`

Runtime-only fields:

- real WKWebView/Tauri IPC reachability: required before execution.
- request bytes: no-arg `confirm_pending_auto_switch_and_restart_codex`
  request bytes required.
- success/error/CoreError envelope bytes: switch success, switch failure,
  refresh failure, restart/recovery failure, and CoreError envelope bytes
  required.
- auto-switch-pending event payload/listener delivery: required before confirm
  and after pending clear / refresh.
- pending dialog/toast/query state: confirm busy guard, dialog clear, account
  query invalidation, snapshot refresh, quota refresh, and toast state required.
- side-effect bytes: auth, registry, quota, pending, snapshot, restart, and
  recovery before/after bytes required.
- rollback/no-rollback: rollback/recovery bytes required for failure branches;
  no-rollback proof required for clean success.
- PASS/FAIL: required in the runtime evidence.
- raw runtime path: required only after the approved runtime route writes it.

### `accounts.auto_switch_pending.confirm_no_restart_present.v1`

Runtime-only fields:

- real WKWebView/Tauri IPC reachability: required before execution.
- request bytes: no-arg `confirm_pending_auto_switch` request bytes required.
- success/error/CoreError envelope bytes: switch success, no-pending, switch
  failure, and refresh failure envelope bytes required.
- auto-switch-pending event payload/listener delivery: required before confirm
  and after pending clear / refresh.
- pending dialog/toast/query state: non-restart confirm state, dialog clear,
  query invalidation, snapshot refresh, quota refresh, and toast state required.
- side-effect bytes: auth, registry, quota, pending, and snapshot before/after
  bytes required.
- rollback/no-rollback: no-restart rollback or no-rollback behavior must be
  byte-proven.
- PASS/FAIL: required in the runtime evidence.
- raw runtime path: required only after the approved runtime route writes it.

## Current Dependency

Do not execute this auto-switch fixture set before an accepted real AiMaMi
1.0.9 WKWebView/Tauri IPC route exists.

The current first accounts runtime proof remains:

`accounts.preview_account_import.missing_path.v1`

The auto-switch pending selector is queue preparation only. It is not the first
runtime route and does not replace the preview-import missing-path route.

## No-Promotion JSON

```json
{
  "strictImplementationUse": false,
  "readyToImplement": false,
  "implementation_use": false,
  "gate_accepted": false,
  "full_leaf_100": false,
  "moduleExitAllowed": false,
  "runtimeExecuted": false,
  "gateEffect": "no_promotion"
}
```

## Gate Effect

No promotion.

- `consumerStartReady`: unchanged.
- `strictImplementationUse`: false / `0`.
- `readyToImplement`: false / `0`.
- `implementation_use`: false.
- `gate_accepted`: false.
- `full_leaf_100`: false.
- `moduleExitAllowed`: false.
- `runtimeExecuted`: false.

Accounts remains the active locked module. This selector does not permit
switching to plugins, relay, system, or tray and does not permit product
implementation.
