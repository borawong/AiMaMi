# Current Acceptance Mapping 1.0.9 - macOS Accounts

Current reducer:
`logic/ACCOUNTS-FULL-LEAF-100-IDA-ACCEPTED-109.md`

Scope: AiMaMi `1.0.9` macOS accounts only.

## Acceptance Status

IDA accepted substitute closes command/body/envelope/side-effect/no-write or
rollback ordering/UI-native callback/PASS_FAIL mapping for accounts 9/9.

| Target | PASS_FAIL mapping |
|---|---|
| `switch_account` | PASS: account switch success and warning enrichment; FAIL rows: missing registry, missing account, missing snapshot, copy failure, persist failure. |
| `switch_account_and_restart_codex` | PASS: switch then relaunch; FAIL rows: switch failure rollback, relaunch failure recovery, restore NotFound tolerance, refresh warning/error. |
| `preview_account_import` | PASS: valid preview read-only payload; FAIL rows: missing path, oversize, read failure, invalid JSON, invalid kind/schema/count/empty. |
| `import_accounts_from_file` | PASS: selected import then registry rebuild; FAIL rows: selected skip, invalid field, no-overwrite conflict, active protected, serializer/write/rebuild failure. |
| `export_accounts_to_file` | PASS: all/subset export and suffix normalization; FAIL rows: no registry/no accounts, unreadable auth snapshot, serializer/write failure. |
| `logout` | PASS: active auth backup/remove and registry active clear; FAIL rows: backup/remove booleans, registry persist failure, snooze residue. |
| `remove_accounts` | PASS: delete selected inactive accounts; FAIL rows: active account blocked, missing snapshot skip, delete residue, registry/quota failure. |
| `begin_add_account_attach_monitor` | PASS: changed snapshot schedules refresh and emits `runtime-state-updated`; FAIL rows: duplicate monitor, spawn failure, no-change no-refresh, debounce suppression, refresh failure. |
| `import_chatgpt_session_account` | PASS: conversion/write/rebuild success; FAIL rows: invalid JSON, missing access sensitive-field/id, invalid field, conflict, active overwrite rejected, ensure/serializer/write/rebuild failure. |

## Gate Effect

```json
{
  "strictImplementationUse": true,
  "readyToImplement": true,
  "implementation_use": true,
  "gate_accepted": true,
  "full_leaf_100": true,
  "moduleExitAllowed": true
}
```
