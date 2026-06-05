# Accounts Frontend Status Reducer - AiMaMi 1.0.9 macOS

Scope: current macOS 1.0.9 accounts only.

This reducer is a logic-only status reducer. It does not add raw evidence,
append `INDEX.jsonl`, edit product source, run product tests, or promote any
gate.

## Inputs

- `logic/CURRENT-FRONTEND-BACKEND-CHAIN-109.md`
- `logic/CURRENT-PLATFORM-GATE-109.md`
- `pointers/evidence-paths.md`
- `<source-location>/intermediate/aimami/1.0.9/macos/accounts/frontend-ccf-accounts-repair/relocated-raw-bundle/manifest.json`

## Current Frontend Status

Same-version macOS accounts frontend status remains:

`partial_same_version_ccf_not_accepted`

Current accounts matrix:

| target | macOS frontend status | strict/highest gap |
|---|---|---|
| `switch_account` | partial CCF | visible pure-switch UI-state and runtime acceptance missing |
| `switch_account_and_restart_codex` | partial CCF | runtime envelope, rollback side effects, and acceptance missing |
| `preview_account_import` | partial CCF | runtime DTO/default/error envelope and acceptance missing |
| `import_accounts_from_file` | partial CCF | selected/overwrite runtime bytes, rollback, and acceptance missing |
| `export_accounts_to_file` | partial CCF | output/write-failure runtime bytes and acceptance missing |
| `import_chatgpt_session_account` | partial CCF / Gate 1 static only | runtime DTO/envelope/write bytes, UI-state, and acceptance missing |
| `logout` | IPC-wrapper-only | current frontend CCF/UI-state and runtime state transition proof missing |
| `remove_accounts` | partial CCF | missing-field/partial-delete bytes and acceptance missing |
| `begin_add_account_attach_monitor` | IPC-wrapper-only | monitor lifecycle/event UI-state proof missing |

The accounts frontend repair confirms the same blocking shape: 7/9 current
accounts commands have frontend CCF rows, while `logout` and
`begin_add_account_attach_monitor` remain IPC-wrapper-only.

## Gate Effect

No promotion:

```json
{
  "strictImplementationUse": false,
  "readyToImplement": false,
  "implementation_use": false,
  "gate_accepted": false,
  "full_leaf_100": false,
  "moduleExitAllowed": false
}
```

Accounts remains the active module.
