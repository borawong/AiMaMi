# Accounts Import Accounts Commit Static Reducer - AiMaMi 1.0.9

Scope: accounts-only same-version macOS AiMaMi 1.0.9 static reducer for
`import_accounts_from_file` / `codexmate_lib::core::account_io::import_accounts`.

This reducer consumes existing producer evidence and a local IDA Pro MCP HTTP
static cross-check. It writes no raw or intermediate artifact, runs no product
test, edits no product code, and does not promote any gate.

## Evidence

- SOT binary root:
  `<source-location>/source-binary/`
- SOT universal SHA:
  `1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482`
- Ghidra producer arm64 thin SHA:
  `985dae00be620b21164b4a8d35cc0379b750d5a6257b25897b0e813441e4d706`
- IDA input universal SHA:
  `1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482`
- Accepted Ghidra producer row:
  `<source-location>/intermediate/aimami/1.0.9/macos/accounts/backend-owner-pseudocode-calltree/run-bundle/ghidra/pseudocode/0004_import_accounts_from_file_ddb23d82.c`
- Accepted call-tree row:
  `<source-location>/intermediate/aimami/1.0.9/macos/accounts/backend-owner-pseudocode-calltree/run-bundle/call-trees/import_accounts_from_file.jsonl`
- IDA HTTP MCP owner:
  `0x1005dfb6c`
  `codexmate_lib::core::account_io::import_accounts`
- IDA HTTP MCP blocking command body:
  `0x10032d97c`
  `codexmate_lib::commands::account_io::import_accounts_from_file::{closure}::{closure}`

## Static Findings

The command body at `0x10032d97c` statically confirms:

- `StateManager::try_get` and repository/state mutex lock happen before the
  backend import call;
- poisoned state lock returns the static string
  `poisoned lock: another task failed inside`;
- decoded `filePath` bytes are copied before the backend call;
- `overwriteExisting` is passed as the W3 boolean argument to
  `import_accounts`;
- the selected-keys option/vector storage is passed to `import_accounts`;
- a non-success backend result is formatted through `CoreError Display` and
  returned as an error string;
- a success backend result is copied back as the command response payload.

The backend owner at `0x1005dfb6c` and the accepted Ghidra row statically
confirm this order:

1. `parse_import_file` runs before any directory creation or write path.
2. Parse failure returns before `ensure_directories`, registry/default helpers,
   `make_auth_snapshot`, serialization, `write_atomic`, or registry rebuild.
3. On parse success, `CodexPaths` is cloned and
   `CodexPaths::ensure_directories` runs before registry/active-field
   classification and before any snapshot write.
4. If `selectedKeys` is present, the function builds a hash set and uses it as
   an inclusion filter before per-entry validation/write.
5. It reads current registry keys through `read_registry_or_empty_keys` and
   the current active account through `read_active_account_key`.
6. Per entry, validation rejects missing sensitive-field and invalid account field before
   snapshot construction.
7. Existing-field classification happens before snapshot write. When an imported
   field is already present and `overwriteExisting` is false, the entry is skipped
   rather than written. When overwrite is true but the field is active locally,
   the active-account-protected error branch is used.
8. `auth::make_auth_snapshot` runs before JSON serialization.
9. `serde_json::ser::to_vec_pretty` runs before `write_atomic`; serialize
   failure prevents `write_atomic`.
10. `relay::atomic_write::write_atomic` runs before
    `Repository::rebuild_registry`.
11. `write_atomic` success adds the account field to the imported vector; write
    failure records a `WRITE_FAILED` entry and does not add that entry to the
    imported vector.
12. `Repository::rebuild_registry` is called only after the entry loop. If it
    fails, the command returns the `Rebuild registry failed: ...` CoreError
    after snapshot writes may already have happened.

Static strings and branches observed in this reducer include:

- `ACCOUNT_MISSING_TOKEN`
- `INVALID_ACCOUNT_KEY`
- `ACTIVE_ACCOUNT_PROTECTED`
- `AUTH_SNAPSHOT_FAILED: ...`
- `SERIALIZE_FAILED: ...`
- `WRITE_FAILED: ...`
- `ACCOUNT_KEY_MISMATCH: computed ...`
- `Rebuild registry failed: ...`
- `poisoned lock: another task failed inside`

## Implementation Reading

The implementation-facing static boundary is:

```text
command wrapper decode/state lock
  -> import_accounts(filePath, overwriteExisting, selectedKeys)
  -> parse_import_file
  -> ensure_directories
  -> selectedKeys set if present
  -> read_registry_or_empty_keys + read_active_account_key
  -> per-entry validation and conflict classification
  -> make_auth_snapshot
  -> serde_json::to_vec_pretty
  -> write_atomic(snapshot)
  -> collect imported/skipped/errors
  -> rebuild_registry
  -> success payload or CoreError display
```

This is enough to refine fixture design and reduce false claims about the
import commit order. It is not enough for strict implementation use.

## Still Missing Before Strict

The following remain unproved and must not be inferred from this static reducer:

- exact Tauri request and response transport bytes;
- omitted/null/wrong-type direct IPC behavior for `filePath`,
  `overwriteExisting`, and `selectedKeys`;
- `selectedKeys=null`, empty array, and non-empty array runtime envelopes;
- exact success payload counts and warning/error array bytes;
- before/after `auth.json`, registry, quota, and temp-file bytes;
- partial-write behavior when `rebuild_registry` fails after one or more
  `write_atomic` successes;
- rollback/no-rollback residue for serialization/write/rebuild failures;
- frontend runtime toast/dialog/loading/invalidation state;
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
