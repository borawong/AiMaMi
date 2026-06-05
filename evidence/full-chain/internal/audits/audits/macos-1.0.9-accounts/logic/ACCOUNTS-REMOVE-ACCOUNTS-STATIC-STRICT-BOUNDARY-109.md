# Accounts remove_accounts Static Strict Boundary - AiMaMi 1.0.9

## Scope

This reducer narrows `remove_accounts` toward `strictImplementationUse` using
only active-route evidence:

- backend: IDA MCP against the AiMaMi 1.0.9 IDB
- frontend: packaged frontend extraction already recorded in the raw leaf

It creates no raw dump, appends no `INDEX.jsonl` row, runs no product code, and
does not promote any gate.

## Evidence

- raw leaf:
  `<source-location>/raw/aimami/1.0.9/macos/accounts/remove_accounts/manifest.json`
- frontend IPC:
  raw manifest `frontend.ipc_contract_row = 5`
- frontend control flow:
  raw manifest `frontend.ccf_row = 5`
- IDB:
  `<source-location>/source-binary/AiMaMi 1.0.9_ida.app/Contents/MacOS/AiMaMi.i64`
- source binary SHA-256:
  `1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482`

## Frontend Boundary

Packaged frontend extraction as recorded in the raw leaf proves:

- wrapper: `removeAccounts`
- command: `remove_accounts`
- arg field: `accountKeys`
- IPC contract row: `5`
- frontend control-flow row: `5`

This closes the static IPC DTO entry for the command. It does not prove live
bulk-selection state, disabled/loading state, confirmation dialog state,
success/error toast bytes, query invalidation, or same-run acceptance.

## Threading Boundary

IDA MCP proves the threading-first path:

```text
Tokio Core::poll @ 0x100145060
  -> callsite 0x10014514c
  -> commands::accounts::remove_accounts command body @ 0x100330a08
  -> repository mutex lock
  -> callsite 0x100330be8
  -> Repository::remove_accounts @ 0x1005e4850
```

The command body resolves Tauri state, locks the repository mutex, forwards the
`accountKeys` vector, converts `CoreError` display output to the command error
envelope, and unlocks the mutex on return. This is a Tokio blocking command
path, not UI-thread direct file IO.

## Static Core Order

IDA decompile of `Repository::remove_accounts @ 0x1005e4850` proves this order:

```text
load_registry
  -> build requested accountKeys HashSet
  -> active-account guard
  -> collect retained/deleted registry rows
  -> per-deleted-row snapshot metadata check
  -> metadata-success remove_file attempt
  -> retained registry persist
  -> quota_store::load fallback/default
  -> quota retain
  -> quota_store::save if row count changed
  -> clear_auto_switch_snooze path 1
  -> clear_auto_switch_snooze path 2
  -> removed account payload collection
  -> CoreEnvelope::ok
```

## DTO And Selection Semantics

Static DTO behavior:

- `accountKeys` is a required vector forwarded from frontend wrapper to command
  body.
- Core owner builds a HashSet from requested keys.
- Retain/delete classification uses membership against the requested-field set.
- If the active account field is present in the removal set, the owner returns
  `Cannot remove the currently active account snapshot.` before delete, registry
  persist, quota save, or snooze clear side effects.

## Error And Side-Effect Boundary

Pre-mutation branches:

- registry load failure produces a no-local-registry style error before delete,
  registry persist, quota save, or snooze clear;
- active-account guard returns before all mutation;
- missing snapshot metadata skips `remove_file` for that account.

Mutation branches:

- `remove_file @ 0x1005e4af8` runs only after metadata success;
- delete errors are statically dropped/non-fatal;
- `persist_registry @ 0x1005e6460` runs after delete attempts and retained
  registry construction;
- `quota_store::save @ 0x1001bc710` runs after quota retain when row count
  changed; it creates parent directories, serializes quota store, and writes the
  quota file;
- two `clear_auto_switch_snooze @ 0x1005ea754` calls run after registry/quota
  success. The helper returns Ok for successful remove and for a missing-file
  class, and returns CoreError for other IO kinds.

Response branch:

- success uses `CoreEnvelope::ok @ 0x1001d8de0` after delete/registry/quota/
  snooze path.

## Partial-State Classes

Static ordering implies these strict fixture classes:

- delete failure is non-fatal and may leave deleted account snapshot files
  behind while registry/quota still move forward;
- registry persist failure is after delete attempts, so it can produce
  post-delete registry-stale residue;
- quota save failure is after registry persist, so it can produce
  registry-updated quota-stale residue;
- snooze clear failure is after registry/quota success and is represented by
  the clear helper's CoreError branch, but exact transport bytes remain runtime
  evidence.

## Static Gap

This reducer proves static ordering and boundary classes, but not:

- exact command request/response/error envelope bytes;
- before/after filesystem bytes for snapshot deletion, registry persist, quota
  save, and snooze clears;
- delete-failure residue and post-persist/post-quota failure residue fixtures;
- live frontend visible state and query/toast behavior;
- executed source archive acceptance fixture;
- Windows same-version independent closure.

## Six-Dimension Status

| Dimension | Status | Evidence |
|---|---|---|
| frontend control-flow + UI/state | static IPC/handler partial | raw manifest IPC row 5, CCF row 5; live UI state missing |
| backend owner + body | satisfied static macOS | `0x100145060 -> 0x100330a08 -> 0x1005e4850` |
| implementation leaves | static boundary strong | registry load, field set, active guard, metadata/delete, registry persist, quota save, snooze clears, success envelope |
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

`remove_accounts` is closer to strict because the static frontend DTO, threading
path, owner body, active-account guard, delete/persist/quota/snooze ordering,
and partial-state classes are now separated from runtime-only gaps. It still
cannot enter `strictImplementationUse` because exact runtime envelopes,
before/after side-effect bytes, failure residue fixtures, live UI state,
executed acceptance, and Windows same-version closure are not accepted.
