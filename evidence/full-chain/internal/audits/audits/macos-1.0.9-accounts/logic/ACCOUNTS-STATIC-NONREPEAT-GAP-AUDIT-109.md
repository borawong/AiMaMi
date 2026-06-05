# Accounts Static Nonrepeat Gap Audit - AiMaMi 1.0.9

Scope: accounts-only same-version macOS AiMaMi 1.0.9 audit for attempted
static follow-up lanes on `logout`, `begin_add_account_attach_monitor`, and
`remove_accounts`.

This reducer records a no-new-static-leaf decision. It writes no
raw/intermediate artifact, appends no `INDEX.jsonl` row, edits no product code
or rule/spec file, runs no product test, and does not promote any gate.

## Evidence Consumed

- `logic/ACCOUNTS-LOGOUT-AUTH-BRANCH-STATIC-109.md`.
- `logic/ACCOUNTS-LOGOUT-SIDEEFFECT-PAYLOAD-STATIC-109.md`.
- `logic/ACCOUNTS-MONITOR-ATTACH-STATIC-109.md`.
- `logic/ACCOUNTS-RUNTIME-STATE-EVENT-SURFACE-STATIC-109.md`.
- `logic/ACCOUNTS-MONITOR-FRONTEND-CALLBACK-GAP-109.md`.
- `logic/ACCOUNTS-REMOVE-ACCOUNTS-ACTIVE-DELETE-STATIC-109.md`.
- `logic/ACCOUNTS-REMOVE-ACCOUNTS-PAYLOAD-SERIALIZATION-STATIC-109.md`.
- `logic/ACCOUNTS-QUOTA-STORE-HELPER-SURFACE-STATIC-109.md`.
- `logic/ACCOUNTS-FRONTEND-STATUS-REDUCER-109.md`.
- `logic/ACCOUNTS-FRONTEND-GATE1-TRIPLET-109.md`.
- IDA HTTP MCP health over the current SOT IDB:
  `<source-location>/source-binary/AiMaMi 1.0.9_ida.app/Contents/MacOS/AiMaMi.i64`.

## Audit Decision

No new non-repeating static reducer should be added for these three lanes at
this point.

### `logout`

- Terminal frontend CCF/UI-state remains evidence-insufficient: current
  frontend evidence has a wrapper/IPC surface but no visible accounts-page
  terminal logout callsite.
- Current-auth metadata present/absent, `authRemoved` / `authBackedUp` boolean
  sources, registry clear/persist, snooze-clear handoff, wrapper lock/error
  conversion, and payload serializer shape are already covered by
  `ACCOUNTS-LOGOUT-AUTH-BRANCH-STATIC-109.md` and
  `ACCOUNTS-LOGOUT-SIDEEFFECT-PAYLOAD-STATIC-109.md`.
- Repeating `Repository::logout @ 0x1005f1d84` IDA decompilation would only
  duplicate existing accepted static branches.

### `begin_add_account_attach_monitor`

- Backend/thread/polling static boundary is already covered by
  `ACCOUNTS-MONITOR-ATTACH-STATIC-109.md`.
- Runtime-state event static serializer surface is already covered by
  `ACCOUNTS-RUNTIME-STATE-EVENT-SURFACE-STATIC-109.md`.
- Frontend/native callback gap is already covered by
  `ACCOUNTS-MONITOR-FRONTEND-CALLBACK-GAP-109.md`.
- The remaining lifecycle/event/re-entry/failure dimensions require live IPC,
  accepted callback/helper substitute, runtime event bytes, or UI-state proof;
  they cannot be closed by another same-shape static IDA pass.

### `remove_accounts`

- Missing-field / no-match / no-registry, active-account guard, delete ordering,
  registry/quota/snooze ordering, and partial-delete risk are already covered
  by `ACCOUNTS-REMOVE-ACCOUNTS-ACTIVE-DELETE-STATIC-109.md`.
- Wrapper and payload fields are already covered by
  `ACCOUNTS-REMOVE-ACCOUNTS-PAYLOAD-SERIALIZATION-STATIC-109.md`.
- Shared quota helper surface is already covered by
  `ACCOUNTS-QUOTA-STORE-HELPER-SURFACE-STATIC-109.md`.
- No current static owner/pseudocode evidence proves remove-specific auth
  write/delete/backup side effects; assigning generic auth serializer or
  logout/switch auth effects to `remove_accounts` would be overreach.

## Remaining Strict Blockers

The remaining blockers are runtime/UI/acceptance dimensions, not missing
static reducer text:

- accepted same-version AiMaMi 1.0.9 WebView/Tauri IPC harness;
- exact request and response/error envelopes;
- auth, registry, quota, snooze, temp, export/import, backup/delete
  before-after bytes;
- rollback/no-rollback proof for partial operations;
- terminal frontend CCF or accepted same-platform runtime UI/native callback
  proof;
- executed source archive acceptance mapping;
- independent Windows closure where required by the gate.

## Gate Effect

No promotion.

- `consumerStartReady`: unchanged; accounts remains `9/9` Gate 1 static only.
- `consumerStartBlocked`: unchanged; accounts remains `0/9` Gate 1 static only.
- `strictImplementationUse`: `0/9`.
- `readyToImplement`: `0/9`.
- `implementation_use`: false.
- `gate_accepted`: false.
- `full_leaf_100`: false.
- `moduleExitAllowed`: false.

Accounts remains the active module. This audit prevents duplicate static
producers and does not allow switching to plugins, relay, system, or tray.
