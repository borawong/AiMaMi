# Accounts Remove Accounts Active / Delete Static Reducer - AiMaMi 1.0.9

Scope: accounts-only same-version macOS AiMaMi 1.0.9 static reducer for
`remove_accounts`, specifically `accountKeys` set construction, active-account
protection, no-match error construction, snapshot delete handoff, registry
retain/persist, quota retain/save, auto-switch snooze clearing, and success
envelope handoff.

This reducer consumes existing accepted producer evidence and IDA Pro MCP HTTP
static cross-checks. It writes no raw/intermediate artifact, appends no
`INDEX.jsonl` row, edits no product code or rule/spec file, runs no product
test, and does not promote any gate.

## Evidence

- SOT binary root:
  `<source-location>/source-binary/`
- SOT universal SHA:
  `1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482`
- Ghidra producer arm64 thin SHA:
  `985dae00be620b21164b4a8d35cc0379b750d5a6257b25897b0e813441e4d706`
- IDA input universal SHA:
  `1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482`
- Accepted producer pseudocode:
  `<source-location>/intermediate/aimami/1.0.9/macos/accounts/backend-owner-pseudocode-calltree/run-bundle/ghidra/pseudocode/0007_remove_accounts_634e350d.c`
- Accepted call tree:
  `<source-location>/intermediate/aimami/1.0.9/macos/accounts/backend-owner-pseudocode-calltree/run-bundle/call-trees/remove_accounts.jsonl`
- IDA core owner:
  `0x1005e4850`
  `codexmate_lib::core::repository::Repository::remove_accounts`

## Static Entry / accountKeys Boundary

Static evidence shows `remove_accounts` builds a hash set from the supplied
`accountKeys` vector before deletion logic. Existing frontend/transport
reducers separately record the wrapper/IPC field as `accountKeys` and the
visible UI path as `removeAccounts([accountKey])` from a destructive confirm.

The static backend branch is:

- load the local registry first;
- build a hash set from requested account keys;
- if an active-account field is present and is found in the requested-field set,
  return `Cannot remove the currently active account snapshot.` before
  snapshot metadata, `remove_file`, registry persist, quota save, or snooze
  clearing;
- otherwise derive the removable registry item vector from registry rows whose
  keys are present in the requested-field set.

This proves active-account protection ordering only statically. It does not
prove direct IPC omitted/null/empty/wrong-type `accountKeys` runtime decode
behavior.

## No-Match / No-Registry Static Strings

Accepted static strings and labels for this reducer:

- `Cannot remove the currently active account snapshot.`
- `No local account registry found yet.`
- `No accounts found for keys: ...`

The no-match branch is reached when the derived removable vector is empty. It
formats the requested field list into `No accounts found for keys: ...` and
returns before snapshot deletion, registry persist, quota save, or snooze
clearing.

The no-registry string is statically present in the same owner string cluster
and remains a static label only. Exact runtime envelope bytes and branch
selection for absent/corrupt registry still require accepted runtime proof.

## Delete / Persist Static Order

For non-active requested keys that match registry rows, the narrowed static
order is:

```text
load_registry
  -> build requested accountKeys HashSet
  -> active-account guard before delete/persist
  -> derive removable registry rows
  -> if removable row count is zero, return No accounts found for keys
  -> for each removable row:
       snapshot path metadata
       if metadata succeeds, std::sys::fs::remove_file
       remove_file error is dropped / not surfaced at this static layer
  -> build removed-field set from removable rows
  -> retain registry rows not in removed-field set
  -> quota_store::load
  -> retain quota rows not in removed-field set
  -> persist_registry
  -> quota_store::save only when quota row count changed
  -> clear_auto_switch_snooze on both snooze stores
  -> CoreEnvelope<T>::ok success handoff
```

This order proves that snapshot deletion is attempted before registry persist
and quota save. It also proves a partial-delete risk class: static evidence
does not show rollback for a later `persist_registry`, `quota_store::save`, or
`clear_auto_switch_snooze` failure after snapshot delete attempts.

## Non-Fatal Delete Error Boundary

Ghidra and IDA both show `std::sys::fs::remove_file` is reached only after
snapshot metadata succeeds. The error-shaped return from `remove_file` is
dropped/deallocated in the static path rather than being formatted into the
terminal command error.

Static interpretation:

```text
snapshot metadata missing -> skip remove_file for that row
snapshot metadata present + remove_file success -> continue
snapshot metadata present + remove_file error -> error object dropped, continue
```

This does not prove final runtime bytes. It only marks the delete-error
surface as a likely non-fatal / best-effort delete branch that still requires
runtime fixture proof for exact skipped/deleted filesystem state.

## Still Missing Before Strict

- exact Tauri IPC request/response/error envelope bytes;
- direct IPC omitted/null/wrong-type/empty `accountKeys` behavior;
- runtime matrix for active-field, missing-field, duplicate-field, mixed existing and
  missing keys, empty list, no-registry, and corrupt-registry cases;
- exact deleted/skipped snapshot before/after bytes;
- registry before/after bytes and persist failure behavior;
- quota before/after bytes and quota save failure behavior;
- auto-switch snooze before/after bytes and failure behavior;
- rollback/no-rollback proof for partial delete then persist/quota/snooze
  failure;
- destructive dialog runtime state, selected-account clearing, toast behavior,
  and query invalidation;
- executed source archive acceptance mapping;
- independent Windows closure.

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
