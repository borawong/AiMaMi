# Accounts Import Accounts File IDA Raw Leaf - 1.0.9

Scope: accounts-only same-version macOS AiMaMi 1.0.9 reducer for the clean raw
IDA leaf bundle of `import_accounts_from_file`.

This reducer consumes:

- `<source-location>/raw/aimami/1.0.9/macos/accounts/import_accounts_from_file/manifest.json`
- canonical `INDEX.jsonl` row `707`

It does not edit product code, does not run product tests, does not execute
runtime IPC, and does not promote any consumer gate.

## Raw Leaf

- command: `import_accounts_from_file`
- raw path: `<source-location>/raw/aimami/1.0.9/macos/accounts/import_accounts_from_file/`
- source binary SOT:
  `<source-location>/source-binary/AiMaMi 1.0.9.app/Contents/MacOS/AiMaMi`
- source SHA-256:
  `1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482`
- raw manifest SHA-256:
  `219db7166f224e63b90173618b700a4bb318e471aa1f3e35ddd86c84863ca213`

## IDA Chain

IDA health was OK against the same source SHA, with auto-analysis and Hex-Rays
ready.

| Role | Address | Symbol / fact |
|---|---:|---|
| command closure | `0x10032d77c` | `codexmate_lib::commands::account_io::import_accounts_from_file::{closure}::{closure}` |
| wrapper callsite | `0x10032d97c` | direct call to `import_accounts` |
| core owner | `0x1005dfb6c` | `codexmate_lib::core::account_io::import_accounts` |
| parse | `0x1005dfba8` | calls `parse_import_file` |
| directory ensure | `0x1005dfc14` | calls `CodexPaths::ensure_directories` |
| selected filter | `0x1005dfcf4` / `0x1005dfe8c` | builds and checks `selectedKeys` HashSet |
| registry/active reads | `0x1005dfda8` | reads registry keys and active account field |
| snapshot | `0x1005e0300` | calls `auth::make_auth_snapshot` |
| serialize | `0x1005e0628` | calls `serde_json::ser::to_vec_pretty` |
| write | `0x1005e0764` | calls `relay::atomic_write::write_atomic` |
| rebuild | `0x1005e0924` | calls `Repository::rebuild_registry` after imported vector is non-empty |

IDB comments were written at all listed addresses, and `idb_save` returned OK.

## Static Behavior

The command closure retrieves the repository state, locks the repository mutex,
copies the `filePath`, and forwards `overwriteExisting` plus `selectedKeys` to
the core owner.

The core owner statically proves this order:

```text
parse_import_file
  -> ensure_directories
  -> selectedKeys HashSet when present
  -> read_registry_or_empty_keys
  -> read_active_account_key
  -> selectedKeys membership filter
  -> missing-sensitive-field / invalid-field checks
  -> registry conflict + overwriteExisting branch
  -> active-account overwrite guard
  -> make_auth_snapshot
  -> account-field mismatch guard
  -> serde_json::to_vec_pretty
  -> relay::atomic_write::write_atomic
  -> Repository::rebuild_registry
```

Branch facts:

- absent `selectedKeys` imports all parsed entries;
- present `selectedKeys` skips non-member entries before validation and writes;
- existing field with `overwriteExisting=false` appends `CONFLICT_SKIPPED` before
  snapshot/write;
- existing field with `overwriteExisting=true` can proceed unless it matches the
  current active account;
- active-account match appends `ACTIVE_ACCOUNT_PROTECTED` before snapshot/write;
- missing sensitive-field and invalid field append `ACCOUNT_MISSING_TOKEN` and
  `INVALID_ACCOUNT_KEY` before snapshot/write;
- successful `write_atomic` appends the imported field; if any field was imported,
  `Repository::rebuild_registry` runs afterward;
- rebuild failure formats `Rebuild registry failed: ...`; no static
  rollback/delete/restore call is observed in this owner.

## Remaining Strict Gaps

This raw leaf strengthens the backend owner/body/call-tree/interface dimension,
but accounts strict/highest gates remain blocked by:

- exact runtime IPC request/response/error envelopes;
- direct IPC omitted/null/wrong-type behavior for `filePath`,
  `overwriteExisting`, and `selectedKeys`;
- before/after auth, registry, quota, temp, and snapshot bytes;
- rollback/no-rollback bytes for write/rebuild failures;
- rendered frontend dialog/toast/query state under live fixtures;
- executed source archive acceptance mapping;
- independent Windows closure.

## Gate Effect

- `consumerStartReady`: unchanged; accounts remains Gate 1 static only.
- `strictImplementationUse`: `0/9`.
- `readyToImplement`: `0/9`.
- `implementation_use`: false.
- `gate_accepted`: false.
- `full_leaf_100`: false.
- `moduleExitAllowed`: false.

Do not switch modules based on this reducer.

