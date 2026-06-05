# Accounts switch_account Static Strict Boundary - AiMaMi 1.0.9

## Scope

This reducer narrows `switch_account` toward `strictImplementationUse` using
only active-route evidence:

- backend: IDA MCP against the AiMaMi 1.0.9 IDB
- frontend: packaged frontend extraction already recorded in the raw leaf

It creates no raw dump, appends no `INDEX.jsonl` row, runs no product code, and
does not promote any gate.

## Evidence

- raw leaf:
  `<source-location>/raw/aimami/1.0.9/macos/accounts/switch_account/manifest.json`
- frontend IPC:
  raw manifest `frontend.ipc_contract_row = 3`
- frontend control flow:
  raw manifest `frontend.frontend_control_flow_row = 15`
- IDB:
  `<source-location>/source-binary/AiMaMi 1.0.9_ida.app/Contents/MacOS/AiMaMi.i64`
- source binary SHA-256:
  `1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482`

## Frontend Boundary

Packaged frontend extraction as recorded in the raw leaf proves:

- wrapper: `switchAccount`
- command: `switch_account`
- arg field: `accountKey`
- IPC contract row: `3`
- frontend control-flow row: `15`

This closes the static IPC DTO entry for the command. It does not prove live
row/menu state, disabled/loading state, success/error toast bytes, query
invalidation, or same-run acceptance.

## Threading Boundary

IDA MCP proves the threading-first path:

```text
Tokio BlockingTask::poll @ 0x10030d734
  -> callsite 0x10030d7fc
  -> commands::accounts::switch_account_sync @ 0x1001e32c4
  -> repository mutex lock
  -> callsite 0x1001e3444
  -> Repository::switch_account @ 0x1005e3cd0
```

The command wrapper resolves Tauri state, locks the repository mutex, calls the
core owner, converts `CoreError` display output to the command error envelope,
and unlocks the mutex on return. This is a Tokio blocking sync-wrapper path,
not UI-thread direct file IO.

## Static Core Order

IDA decompile of `Repository::switch_account @ 0x1005e3cd0` proves this order:

```text
registry metadata check
  -> load_registry
  -> accountKey length/byte match over registry rows
  -> selected auth snapshot metadata
  -> ensure_directories
  -> optional backup copy of current active auth
  -> copy selected snapshot over active auth
  -> update selected registry fields
  -> persist_registry
  -> clear_auto_switch_transient_state
  -> reload active auth file
  -> make_auth_snapshot
  -> quota_store::load_or_default
  -> quota_store::find_item
  -> make_account_summary_from_item
  -> CoreEnvelope::ok_with_warnings
```

## DTO And Selection Semantics

Static DTO behavior:

- `accountKey` is a required string forwarded from frontend wrapper to the
  command body.
- Core owner stores `(ptr,len)` and scans registry rows.
- Matching uses length equality followed by `memcmp`.
- If no row matches, it formats an account-not-found error before any auth copy
  or registry write.

## Error And Side-Effect Boundary

Pre-mutation branches:

- missing registry metadata returns `No AiMaMi registry exists yet`;
- registry load failure propagates before account search;
- accountKey miss returns before snapshot metadata and before writes;
- missing selected auth snapshot returns a path-specific error before writes;
- `ensure_directories` failure returns before copy/persist operations.

Mutation branches:

- existing active auth is optionally backed up to a timestamped file;
- selected auth snapshot is copied over the active auth file;
- registry active fields are updated only after selected auth copy succeeds;
- `persist_registry @ 0x1005e6460` ensures directories, optionally backs up the
  registry, serializes registry/config/auto-switch fields, then writes the
  registry file;
- `clear_auto_switch_transient_state @ 0x1005f028c` clears two transient/snooze
  paths after registry persist; non-success is dropped by the caller;
- active auth is reloaded and converted to an auth snapshot after prior
  file/registry mutations.

Response branches:

- `quota_store::load_or_default @ 0x1001bc42c` falls back to a default quota
  store on quota-load error.
- `make_account_summary_from_item @ 0x1005efaac` builds the active account
  summary from selected registry/auth/quota data.
- success uses `CoreEnvelope::ok_with_warnings @ 0x1001d8b84` and includes a
  `CLIENT_RESTART_RECOMMENDED` warning with message:
  `Restart Codex clients for the new auth snapshot to take effect.`

## Static Gap

This reducer proves static ordering and boundary classes, but not:

- exact command request/response/error envelope bytes;
- before/after filesystem bytes for auth copy, backup, registry persist, and
  transient clear;
- residue behavior after backup/copy/persist/reload/snapshot failures;
- live frontend visible state and query/toast behavior;
- executed source archive acceptance fixture;
- Windows same-version independent closure.

## Six-Dimension Status

| Dimension | Status | Evidence |
|---|---|---|
| frontend control-flow + UI/state | static IPC/handler partial | raw manifest IPC row 3, CCF row 15; live UI state missing |
| backend owner + body | satisfied static macOS | `0x10030d734 -> 0x1001e32c4 -> 0x1005e3cd0` |
| implementation leaves | static boundary strong | metadata, registry, auth copy, persist, transient clear, auth reload, quota, summary, warning envelope |
| interface/error/side-effect | partial static | DTO and branch order known; exact envelopes and before/after bytes missing |
| platform gate | macOS static only | Windows independent closure missing |
| test/acceptance mapping | draft only | no executed acceptance |

## Gate Decision

No promotion:

```json
{
  "consumerStartReady": "unchanged",
  "strictImplementationUse": false,
  "readyToImplement": false,
  "implementation_use": false,
  "gate_accepted": false,
  "full_leaf_100": false,
  "moduleExitAllowed": false
}
```

`switch_account` is closer to strict because the static frontend DTO, threading
path, owner body, account selection, mutation ordering, persistence boundaries,
quota enrichment, and warning response are now separated from runtime-only gaps.
It still cannot enter `strictImplementationUse` because exact runtime envelopes,
before/after side-effect bytes, failure residue fixtures, live UI state,
executed acceptance, and Windows same-version closure are not accepted.
