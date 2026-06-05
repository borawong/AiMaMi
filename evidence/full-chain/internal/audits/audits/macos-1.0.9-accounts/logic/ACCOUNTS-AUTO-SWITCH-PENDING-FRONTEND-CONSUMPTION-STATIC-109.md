# Accounts Auto Switch Pending Frontend Consumption Static - AiMaMi 1.0.9

Scope: accounts-only static reducer for pending account auto-switch frontend
consumption in AiMaMi 1.0.9 macOS universal.

This reducer consumes same-version frontend CCF / IPC contract rows and the
already accepted IDB-first backend auto-switch command reducers. It writes no
raw/intermediate artifact, appends no `INDEX.jsonl` row, edits no rule/spec/
skill file, changes no product code, runs no product test, and promotes no
gate.

## Boundary

The auto-switch pending commands are symbolized under
`codexmate_lib::commands::system`, but the pending state is accounts data:
current/candidate account summaries, quota thresholds, snooze, switch, and
account runtime refresh. This reducer therefore stays in the active accounts
bundle.

This is not a repeat of:

- `ACCOUNTS-AUTO-SWITCH-PENDING-COMMANDS-STATIC-109.md`, which reduces command
  owners and repository leaves;
- `ACCOUNTS-AUTO-SWITCH-PAYLOAD-SERIALIZERS-STATIC-109.md`, which reduces
  backend DTO serializer fields;
- `ACCOUNTS-SWITCH-RESTART-ROLLBACK-STATIC-109.md`, which reduces switch /
  restart rollback ordering.

## Evidence

- Frontend CCF:
  `<source-location>/raw/aimami/1.0.9/macos/frontend/macos-109-frontend-ccf-found-app/frontend/frontend-control-flow.jsonl`
- Frontend IPC contracts:
  `<source-location>/raw/aimami/1.0.9/macos/frontend/macos-109-frontend-ccf-found-app/frontend/ipc-contracts.jsonl`
- Backend static reducer:
  `logic/ACCOUNTS-AUTO-SWITCH-PENDING-COMMANDS-STATIC-109.md`
- Payload static reducer:
  `logic/ACCOUNTS-AUTO-SWITCH-PAYLOAD-SERIALIZERS-STATIC-109.md`

## Frontend Consumption Facts

The same-version frontend CCF rows expose the pending auto-switch prompt
surface:

| CCF row | Static frontend fact |
|---:|---|
| `frontend-control-flow.jsonl:46` | a hook/useEffect path calls wrapper `loadPendingAutoSwitch` with no arg keys and reaches command `load_pending_auto_switch` |
| `frontend-control-flow.jsonl:47` | a guarded skip/dismiss path calls wrapper `dismissPendingAutoSwitch` with no arg keys and reaches command `dismiss_pending_auto_switch` |
| `frontend-control-flow.jsonl:48` | a guarded confirm path awaits `confirmPendingAutoSwitchAndRestartCodex` and reaches command `confirm_pending_auto_switch_and_restart_codex` |

The same-version IPC contract rows expose the wrapper surface:

| IPC row | Wrapper | Command | Arg keys |
|---:|---|---|---|
| `ipc-contracts.jsonl:98` | `loadPendingAutoSwitch` | `load_pending_auto_switch` | `[]` |
| `ipc-contracts.jsonl:99` | `dismissPendingAutoSwitch` | `dismiss_pending_auto_switch` | `[]` |
| `ipc-contracts.jsonl:100` | `confirmPendingAutoSwitch` | `confirm_pending_auto_switch` | `[]` |
| `ipc-contracts.jsonl:101` | `confirmPendingAutoSwitchAndRestartCodex` | `confirm_pending_auto_switch_and_restart_codex` | `[]` |

The accepted backend reducer ties these frontend wrappers to the same account
auto-switch state:

- `load_pending_auto_switch` reads and deserializes pending state;
- `dismiss_pending_auto_switch` writes a snooze record and clears pending
  state;
- `confirm_pending_auto_switch` switches to the pending candidate account;
- `confirm_pending_auto_switch_and_restart_codex` follows the restart-capable
  pending confirmation path already reduced by the switch/restart reducer.

The payload serializer reducer fixes the frontend-facing pending payload field
surface as `requestedAt`, `currentAccount`, `candidateAccount`,
`threshold5hPercent`, and `thresholdWeeklyPercent`.

## Current source archive Consumer Crosswalk

Current source archive frontend source is not consumed as upstream proof, but it provides a
consumer implementation crosswalk:

- `src/lib/api.ts` maps `loadPendingAutoSwitch`,
  `dismissPendingAutoSwitch`, `confirmPendingAutoSwitch`, and
  `confirmPendingAutoSwitchAndRestartCodex` to the no-arg commands above.
- `src/main-app.tsx` uses `usePendingAutoSwitchPrompt` to load pending state,
  listen for `auto-switch-pending`, keep `pending` state, set busy state for
  `skip` / `confirm`, dismiss to `response.data.pending`, confirm restart,
  clear pending, invalidate `["accounts"]`, invalidate snapshot query, and
  refresh active quota history after a snapshot refresh.

This crosswalk is only a consumer alignment note. It is not evidence that
AiMaMi 1.0.9 runtime rendered a dialog, delivered a WebView event, or executed
any accepted fixture.

## Accepted Static Facts

- AiMaMi 1.0.9 frontend exposes no-arg wrappers for load, dismiss, confirm,
  and confirm-with-restart pending auto-switch commands.
- A frontend effect path loads pending auto-switch state.
- Frontend skip/dismiss consumption reaches `dismiss_pending_auto_switch`.
- Frontend confirm consumption reaches
  `confirm_pending_auto_switch_and_restart_codex`.
- Backend static reducers already connect those commands to pending account
  auto-switch state, snooze, candidate-account switch, and restart-capable
  refresh behavior.
- Pending payload frontend field names are statically aligned with the backend
  serializer reducer.

## Still Missing Before Strict

- live AiMaMi 1.0.9 WebView/Tauri IPC invocation for the pending commands;
- exact request, response, and error envelope bytes;
- live `auto-switch-pending` event payload bytes and listener delivery;
- rendered pending dialog/toast/query-state under concrete fixtures;
- pending-file, snooze-file, auth, registry, quota, and snapshot before-after
  bytes;
- confirm success, no-pending, switch failure, refresh failure, dismiss
  no-pending, write failure, and clear failure runtime fixtures;
- executed source archive acceptance mapping;
- independent Windows closure where required by the gate.

## Gate Effect

- `consumerStartReady`: unchanged.
- `strictImplementationUse`: false / `0`.
- `readyToImplement`: false / `0`.
- `implementation_use`: false.
- `gate_accepted`: false.
- `full_leaf_100`: false.
- `moduleExitAllowed`: false.

Accounts remains the active locked module. This reducer does not permit
switching to plugins, relay, system, or tray.
