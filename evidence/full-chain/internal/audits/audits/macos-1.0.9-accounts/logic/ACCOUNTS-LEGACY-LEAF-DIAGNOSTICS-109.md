# Accounts Legacy Leaf Diagnostics - AiMaMi 1.0.9

Scope: accounts-only current AiMaMi 1.0.9 macOS legacy leaf diagnostics for
`switch_account`, `logout`, and `begin_add_account_attach_monitor`.

This reducer consumes already-indexed raw diagnostics under:

`<source-location>/intermediate/aimami/1.0.9/macos/accounts/legacy-leaf-diagnostics/`

It creates no raw evidence, appends no `INDEX.jsonl` row, edits no regulations,
and promotes no gate.

Path redline correction: the consumed `switch_account` and `logout` blocked
diagnostics originally contained stale malformed local checks that prepended a
repo absolute path before `<source-location>`.
Those active diagnostic fields have been corrected to the canonical env-relative
binary SOT path
`<source-location>/source-binary/AiMaMi 1.0.9.app`.
The evidence conclusion is unchanged and remains non-promoting.

## Consumed Evidence

| Target | Evidence | Current result | Gate effect |
|---|---|---|---|
| `switch_account` | `legacy-leaf-diagnostics/switch_account/visible-pure-switch-uistate/summary.json` | Initial probe was blocked by stale local lookup and only found wrong-version 1.0.1 apps. This is stale context only after the SOT app was restored. | No promotion |
| `switch_account` | `legacy-leaf-diagnostics/switch_account/visible-pure-switch-uistate-found-app/manifest.json` | Same-version SOT app was found and runtime/UI probe produced screenshots and fixture files, but did not reach an accepted pure-switch UI action, terminal invocation, exact envelope, side-effect bytes, or reducer acceptance. | No promotion |
| `logout` | `legacy-leaf-diagnostics/logout/blocked-runtime-unavailable/summary.json` | Probe remained non-executed for logout runtime/UI-state. It records the missing logged-in fixture, terminal invocation, active/no-active envelope, and persistence bytes. Some embedded old local path strings are stale diagnostic text, not active current pointers. | No promotion |
| `begin_add_account_attach_monitor` | `legacy-leaf-diagnostics/begin_add_account_attach_monitor/runtime-lifecycle-probe/manifest.json` | Startup/process/file/socket/window evidence was captured from the same-version SOT app, including local listener `127.0.0.1:25818`, but no add-account UI entry, monitor lifecycle event, WebView/Tauri IPC invocation, or accepted callback substitute was reached. | No promotion |

## Static Frontend Cross-Check

The current static frontend evidence makes the three legacy UI blockers more
specific:

- `switch_account`: the accounts page visible branch is
  `switch_account_and_restart_codex`, not pure `switch_account`. Pure
  `switch_account` is present as a wrapper / invoke contract in the global
  frontend asset, but the accounts page does not show an accepted visible
  pure-switch terminal callsite.
- `logout`: the IPC wrapper exists, but the accounts page has no terminal
  logout callsite in the static accounts chunk. This is not an app-wide strict
  absence proof; it only preserves the current accounts-page UI-state blocker.
- `begin_add_account_attach_monitor`: the IPC wrapper exists, but the accounts
  page has no terminal callsite or monitor lifecycle UI-state proof in the
  static accounts chunk.

Evidence:

- `<source-location>/intermediate/aimami/1.0.9/macos/accounts/frontend-static-ui-branch-matrix/matrix.json`
- `<source-location>/intermediate/aimami/1.0.9/macos/accounts/frontend-absence-proof/manifest.json`
- `<source-location>/intermediate/aimami/1.0.9/macos/accounts/frontend-ccf-accounts-repair/relocated-raw-bundle/manifest.json`

This is a static cross-check only. It writes no raw evidence, appends no
`INDEX.jsonl`, and does not promote `consumerStartReady`,
`strictImplementationUse`, `readyToImplement`, `implementation_use`,
`gate_accepted`, or `full_leaf_100`.

## Per-Target Boundary

### `switch_account`

The current accepted static evidence still does not prove a visible pure-switch
UI path. The found-app rerun confirms the AiMaMi 1.0.9 SOT app can be launched
from the shared binary root, but the captured UI attempt does not prove:

- a user-visible pure switch trigger distinct from
  `switch_account_and_restart_codex`;
- the exact frontend guard/preflight state;
- terminal `switch_account` invocation through accepted Tauri IPC;
- success/error envelope;
- before/after registry, quota, auth snapshot, or rollback bytes;
- executed source archive acceptance.

Result: keep `switch_account` below `strictImplementationUse`.

### `logout`

The logout diagnostic is useful only as a blocked-route record. It does not
execute logout, does not enter a real logged-in fixture state, and does not
capture frontend UI-state, native callback substitute, Tauri IPC command body,
error/success envelope, or persistence bytes.

Current `logout` frontend proof remains IPC-wrapper-only. The missing strict
dimensions are still terminal frontend CCF/UI-state, active/no-active runtime
envelope, auth backup/delete bytes, snooze/registry bytes, rollback/no-write
classification, and executed acceptance.

Result: keep `logout` below `consumerStartReady` strict upgrade and below
`strictImplementationUse`.

### `begin_add_account_attach_monitor`

The monitor lifecycle probe confirms only startup-side facts and rejected
external transport facts:

- same-version SOT startup can create isolated `HOME` / `CODEX_HOME` files;
- a single-instance lock and local listener can appear;
- HTTP probes against the listener are not accepted IPC;
- System Events/window/screenshot evidence does not reach the add-account
  action.

It does not capture monitor creation, attach, event delivery, completion,
cancel, timeout, cleanup, reentry, or error lifecycle. It also does not prove an
accepted native callback/helper substitute for the missing frontend CCF.

Result: keep `begin_add_account_attach_monitor` below `strictImplementationUse`.

## Current Gate Decision

This reducer narrows the accounts legacy-leaf blockers but does not close any
strict or highest gate.

- `consumerStartReady`: accounts total is `9/9` for Gate 1 static context only;
  strict/highest remains blocked.
- `consumerStartBlocked`: `0/9` for Gate 1 static context only.
- `strictImplementationUse`: `0` for accounts.
- `readyToImplement`: `0` for accounts.
- `implementation_use`: false.
- `gate_accepted`: false.
- `full_leaf_100`: false.
- `moduleExitAllowed`: false.

The next accounts-only proof remains an accepted same-version WebView/Tauri IPC
runtime trace, preferably a controlled low-risk `preview_account_import`
missing/invalid fixture with command body, envelope, no-write bytes, UI state,
fixture PASS/FAIL, and reducer acceptance.
