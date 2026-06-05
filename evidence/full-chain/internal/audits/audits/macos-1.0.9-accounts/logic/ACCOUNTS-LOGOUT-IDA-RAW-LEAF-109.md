# Accounts Logout IDA Raw Leaf 1.0.9

## Result

Raw leaf:
`<source-location>/raw/aimami/1.0.9/macos/accounts/logout/`

Status: `accepted_static_ida_raw_leaf_no_gate_promotion`.

## Threading Model

Threading was analyzed first:

- Tokio core poll `0x10014bc14` calls wrapper `0x100330e20`.
- Wrapper locks accounts repository state and calls `Repository::logout @ 0x1005f1d84`.
- Poisoned lock maps to `poisoned lock: another task failed inside`.
- Synchronous repository IO runs inside Tokio task context, not on the UI thread.

## Static Behavior

`Repository::logout @ 0x1005f1d84` ensures directories, checks current auth
metadata, backs up auth when present, removes auth when present, loads/defaults
registry, clears active account, persists registry, clears two auto-switch
snooze files non-fatally, and returns `{ authRemoved, authBackedUp }`.

## Gate Effect

No promotion:

- `strictImplementationUse=false`
- `readyToImplement=false`
- `implementation_use=false`
- `gate_accepted=false`
- `full_leaf_100=false`
- `moduleExitAllowed=false`

Runtime IPC/envelope bytes, durable side-effect fixtures, frontend state,
executed acceptance, and Windows closure remain blockers.
