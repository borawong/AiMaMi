# Accounts IDA Static Crosscheck - AiMaMi 1.0.9

Scope: accounts-only IDA Pro MCP static crosscheck for current AiMaMi 1.0.9
macOS evidence. This is an accelerator and corroboration reducer only.

IDA database:

- IDB: `<source-location>/source-binary/AiMaMi 1.0.9_ida.app/Contents/MacOS/AiMaMi.i64`
- input binary: `<source-location>/source-binary/AiMaMi 1.0.9_ida.app/Contents/MacOS/AiMaMi`
- SHA-256: `1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482`
- image base: `0x100000000`
- functions: `67912`
- strings cache: `14800`
- Hex-Rays ready: true

## Crosschecked Functions

| Target | Address | IDA function | IDA result | Gate effect |
|---|---|---|---|---|
| `switch_account` | `0x1005e3cd0` | `codexmate_lib::core::repository::Repository::switch_account` | complex function, 91 blocks, shared data with export path; no new runtime proof | no promotion |
| `switch_account_and_restart_codex` | `0x1001e6be4` | `codexmate_lib::commands::accounts::switch_account_and_restart_sync` | decompile confirms call to `capture_switch_rollback_state` before switch/restart branch handling | no promotion |
| `preview_account_import` | `0x1005dd788` | `codexmate_lib::core::account_io::preview_import` | decompile confirms call to `parse_import_file` and early return/error carrier branch before preview classification | no promotion |
| `parse_import_file` helper | `0x1005e13fc` | `codexmate_lib::core::account_io::parse_import_file` | IDA recognizes the helper as the preview/import parser owner | no promotion |
| `read_registry_or_empty_keys` helper | `0x1005e2b64` | `codexmate_lib::core::account_io::read_registry_or_empty_keys` | IDA recognizes registry-field helper shared by preview/import/remove paths | no promotion |
| `read_active_account_key` helper | `0x1005e29f4` | `codexmate_lib::core::account_io::read_active_account_key` | IDA recognizes active-field helper used by preview/import active-account boundaries | no promotion |
| `import_accounts_from_file` | `0x1005dfb6c` | `codexmate_lib::core::account_io::import_accounts` | decompile/xrefs confirm calls to `parse_import_file`, `CodexPaths::ensure_directories`, `read_registry_or_empty_keys`, and `read_active_account_key`; strings include `ACCOUNT_MISSING_TOKEN`, `INVALID_ACCOUNT_KEY`, `ACTIVE_ACCOUNT_PROTECTED`, `Backup contains no accounts` | no promotion |
| `export_accounts_to_file` | `0x1005ddd0c` | `codexmate_lib::core::account_io::export_accounts` | decompile confirms command owner; strings include `No AiMaMi account registry found yet`, `No accounts to export`, `aimami-accounts`; caller at `0x10032d0cc` | no promotion |
| `logout` | `0x1005f1d84` | `codexmate_lib::core::repository::Repository::logout` | decompile confirms `CodexPaths::ensure_directories`, auth metadata check, timestamped backup join, `std::sys::fs::copy`, and `std::sys::fs::remove_file` static path | no promotion |
| `remove_accounts` | `0x1005e4850` | `codexmate_lib::core::repository::Repository::remove_accounts` | IDA confirms owner and shared data with logout/registry helpers; high complexity static delete/quota path remains runtime-byte blocked | no promotion |
| `begin_add_account_attach_monitor` | `0x100262db4` | `codexmate_lib::commands::system::begin_add_account_attach_monitor` | decompile confirms lock handling, `Repository::load_snapshot_local`, and static strings `poisoned lock: another task failed inside` / `failed to spawn thread` | no promotion |

## Interpretation

IDA Pro MCP corroborates the existing Ghidra/static reducers:

- import/export backend owner addresses and major branch strings are the same
  current AiMaMi 1.0.9 binary evidence, bound to the SOT SHA above;
- switch-restart static flow includes rollback-state capture and restore
  candidates;
- preview/import parser helpers are same-version IDA-recognized owners;
- import accounts reaches parse/import helper and registry/active-field helper
  calls;
- export accounts owns registry/no-accounts strings and export bundle label.
- logout reaches ensure-directories, auth metadata, backup-copy, and
  remove-file candidates;
- monitor reaches lock/snapshot/thread-spawn candidates and the poisoned-lock /
  spawn-failure strings.

This does not close any runtime dimension. IDA static decompilation is not:

- accepted WebView/Tauri IPC invocation;
- exact request/response/error envelope;
- before/after auth/registry/quota/temp/export bytes;
- rollback or no-rollback execution proof;
- frontend runtime UI-state;
- executed source archive acceptance;
- independent Windows proof.

## Gate Effect

No promotion.

- `consumerStartReady`: accounts total remains `9/9` for Gate 1 static context only.
- `consumerStartBlocked`: remains `0/9` for Gate 1 static context only.
- `strictImplementationUse`: `0/9`.
- `readyToImplement`: `0/9`.
- `implementation_use`: false.
- `gate_accepted`: false.
- `full_leaf_100`: false.
- `moduleExitAllowed`: false.
