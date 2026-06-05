# Accounts Write Atomic / Rebuild IDA Crosscheck - AiMaMi 1.0.9

Scope: accounts-only static IDA crosscheck for write and rebuild boundaries
shared by `import_accounts_from_file`, `export_accounts_to_file`, and
`import_chatgpt_session_account` on current AiMaMi `1.0.9` macOS.

This file writes no raw evidence, appends no `INDEX.jsonl` row, edits no
regulation file, runs no product/main test, touches no Windows evidence, and
promotes no gate.

## Evidence Consumed

- IDB:
  `<source-location>/source-binary/AiMaMi 1.0.9_ida.app/Contents/MacOS/AiMaMi.i64`
- input binary:
  `<source-location>/source-binary/AiMaMi 1.0.9_ida.app/Contents/MacOS/AiMaMi`
- SOT executable SHA-256:
  `1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482`
- `logic/ACCOUNTS-IMPORT-ACCOUNTS-COMMIT-STATIC-109.md`
- `logic/ACCOUNTS-EXPORT-ACCOUNTS-ACCOUNTKEYS-WRITE-STATIC-109.md`
- `logic/ACCOUNTS-CHATGPT-SESSION-PERSISTENCE-LEAF-PSEUDOCODE-109.md`
- `logic/ACCOUNTS-BACKEND-SIDEEFFECT-GAP-REFINEMENT-109.md`

## IDA Static Crosscheck

IDA Pro MCP health was `ok` against the current same-version IDB. Static
decompilation corroborates the following function boundaries:

| Function | Address | Static role |
|---|---:|---|
| `codexmate_lib::core::account_io::import_accounts` | `0x1005dfb6c` | import commit path calls `serde_json::ser::to_vec_pretty`, then `relay::atomic_write::write_atomic`, then later `Repository::rebuild_registry` |
| `codexmate_lib::core::account_io::export_accounts` | `0x1005ddd0c` | export path builds export payload, normalizes target filename, then calls `relay::atomic_write::write_atomic` |
| `codexmate_lib::core::relay::atomic_write::write_atomic` | `0x1006729f8` | shared atomic write helper |
| `codexmate_lib::core::repository::Repository::rebuild_registry` | `0x1005e7334` | registry rebuild helper called after import-side writes |

## Static Ordering Facts

Accepted static facts from this crosscheck:

- `import_accounts_from_file` reaches `serde_json::ser::to_vec_pretty` before
  `write_atomic`; serialization failure prevents the write call.
- `import_accounts_from_file` calls `write_atomic` before
  `Repository::rebuild_registry`.
- `import_accounts_from_file` can therefore have committed snapshot writes
  before a later `Rebuild registry failed: ...` error is returned.
- `export_accounts_to_file` calls `write_atomic` after registry/snapshot/auth
  selection, export payload construction, hostname/timestamp gathering, and
  target filename normalization.
- `write_atomic` statically writes file data, calls file `sync_data`, closes
  the file, renames the temporary path to the target, syncs the parent
  directory on rename success, and attempts `remove_file` on the temporary path
  after rename failure.
- `Repository::rebuild_registry` statically calls `persist_registry` and can
  return a `CoreError`; the successful path constructs a `CoreEnvelope<T>::ok`.

## Fixture Implications

This crosscheck narrows, but does not close, these future runtime fixture
requirements:

| Target | Runtime fixture implication |
|---|---|
| `import_accounts_from_file` | A rebuild-failure fixture must capture snapshot bytes already written by prior `write_atomic` calls and prove rollback/no-rollback residue. |
| `import_chatgpt_session_account` | The same write-then-rebuild ordering must be checked for non-active overwrite success and rebuild-failure partial-write residue. |
| `export_accounts_to_file` | Write-failure and overwrite/target-path fixtures must capture target and temp before/after bytes, including rename failure cleanup behavior. |

## Still Missing Before Strict

- exact live Tauri IPC request/response/error envelopes;
- direct IPC omitted/null/wrong-type/default behavior for import/export/session
  DTOs;
- exact `write_atomic` target/temp bytes for success, write failure, sync
  failure, rename failure, and temp cleanup;
- exact `rebuild_registry` failure envelope and partial-write residue after
  already committed snapshots;
- frontend runtime state and query invalidation;
- executed source archive acceptance with PASS/FAIL and reducer acceptance boolean;
- independent Windows closure.

## Gate Effect

No promotion.

- `consumerStartReady`: accounts remains `9/9` Gate 1 static context only.
- `consumerStartBlocked`: accounts remains `0/9` for Gate 1 static context only.
- `strictImplementationUse`: `0/9`.
- `readyToImplement`: `0/9`.
- `implementation_use`: false.
- `gate_accepted`: false.
- `full_leaf_100`: false.
- `moduleExitAllowed`: false.

This reducer only consolidates static write/rebuild ordering. It does not allow
switching to plugins, relay, system, or tray.
