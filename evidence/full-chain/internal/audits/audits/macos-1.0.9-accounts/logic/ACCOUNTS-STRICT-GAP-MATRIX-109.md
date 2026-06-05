# Accounts Strict Gap Matrix - AiMaMi 1.0.9 macOS

Scope: current macOS accounts only.

Current reducer:
`logic/ACCOUNTS-FULL-LEAF-100-IDA-ACCEPTED-109.md`

## Decision

No current accounts strict gap remains for macOS. IDA accepted substitute closes
accounts 9/9 under `full_leaf_100_definition_v2`.

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

## Target Status

| Target | Strict | Ready | Evidence |
|---|---:|---:|---|
| `switch_account` | YES | YES | `0x10030d7fc -> 0x1001e32c4 -> 0x1005e3cd0` |
| `switch_account_and_restart_codex` | YES | YES | `0x10030ddfc` / `0x100332708 -> 0x1001e6be4` |
| `preview_account_import` | YES | YES | `0x10032c93c -> 0x1005dd788 -> 0x1005e13fc` |
| `import_accounts_from_file` | YES | YES | `0x10032d77c -> 0x1005dfb6c` |
| `export_accounts_to_file` | YES | YES | `0x10032ce58 -> 0x1005ddd0c` |
| `logout` | YES | YES | `0x100330e20 -> 0x1005f1d84` |
| `remove_accounts` | YES | YES | `0x100330a08 -> 0x1005e4850` |
| `begin_add_account_attach_monitor` | YES | YES | `0x1003250c0 -> 0x100262db4 -> 0x1001e3ad0` |
| `import_chatgpt_session_account` | YES | YES | `0x10032dbf0 -> 0x1005e1d6c -> 0x100625bc4` |

Windows is not inferred from this file.
