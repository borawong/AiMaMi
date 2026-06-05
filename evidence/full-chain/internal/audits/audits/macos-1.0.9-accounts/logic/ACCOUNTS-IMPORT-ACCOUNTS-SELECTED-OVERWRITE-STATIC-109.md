# Accounts Import Accounts Selected / Overwrite Static Reducer - AiMaMi 1.0.9

Scope: accounts-only same-version macOS AiMaMi 1.0.9 static reducer for the
`selectedKeys` and `overwriteExisting` branches inside
`import_accounts_from_file`.

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
  `<source-location>/intermediate/aimami/1.0.9/macos/accounts/backend-owner-pseudocode-calltree/run-bundle/ghidra/pseudocode/0004_import_accounts_from_file_ddb23d82.c`
- Accepted call tree:
  `<source-location>/intermediate/aimami/1.0.9/macos/accounts/backend-owner-pseudocode-calltree/run-bundle/call-trees/import_accounts_from_file.jsonl`
- IDA core owner:
  `0x1005dfb6c`
  `codexmate_lib::core::account_io::import_accounts`
- IDA command body:
  `0x10032d97c`
  `codexmate_lib::commands::account_io::import_accounts_from_file::{closure}::{closure}`

## selectedKeys Static Branch

The command body passes selected-field storage to `import_accounts`. The backend
then behaves as follows:

- if the selected-field option is absent, no selected-field hash set is built and
  entries continue to validation/classification;
- if the selected-field option is present, the backend builds a `HashSet` from
  the supplied keys before reading registry/active state;
- during the per-entry loop, an entry not found in the selected-field set jumps to
  the loop advance path before sensitive-field validation, account-field validation,
  snapshot path creation, snapshot serialization, atomic write, imported-vector
  append, or error-vector append;
- an entry found in the selected-field set continues into normal validation and
  conflict/write handling.

Static proof therefore narrows the implementation reading to:

```text
selectedKeys absent -> import all parsed entries
selectedKeys present and contains entry field -> process that entry
selectedKeys present and does not contain entry field -> skip entry before validation/write
```

This is not a runtime nullability matrix. The frontend wrapper still maps
omitted/undefined `selectedKeys` to 
ull`, but direct IPC omitted/null/wrong
type, empty-array, duplicate-field, and non-string-field behavior still require
accepted runtime envelopes before strict use.

## overwriteExisting Static Branch

The command body passes `overwriteExisting` as the backend boolean argument.
The backend branch is:

- registry conflict detection happens before snapshot creation and before any
  write for that entry;
- if an imported field already exists and `overwriteExisting` is false, the entry
  goes to the conflict-skipped error/skipped vector path and does not reach
  `auth::make_auth_snapshot`, `serde_json::ser::to_vec_pretty`, or
  `relay::atomic_write::write_atomic`;
- if the field exists and `overwriteExisting` is true, the entry may continue,
  except the active-account guard still blocks overwriting the currently active
  local account;
- if the active-field helper returns an active field and the imported field matches
  it, the branch emits `ACTIVE_ACCOUNT_PROTECTED` before snapshot/write;
- if the field does not conflict, the entry continues to snapshot/serialize/write
  regardless of `overwriteExisting`.

Static proof therefore narrows the implementation reading to:

```text
existing field + overwriteExisting=false -> CONFLICT_SKIPPED before snapshot/write
existing field + overwriteExisting=true + active field match -> ACTIVE_ACCOUNT_PROTECTED before snapshot/write
existing field + overwriteExisting=true + not active -> eligible for snapshot/write
new field -> eligible for snapshot/write
```

## Error / Skip Labels

Accepted static labels and strings for this reducer:

- `CONFLICT_SKIPPED`
- `ACCOUNT_MISSING_TOKEN`
- `INVALID_ACCOUNT_KEY`
- `ACTIVE_ACCOUNT_PROTECTED`
- `AUTH_SNAPSHOT_FAILED: ...`
- `SERIALIZE_FAILED: ...`
- `WRITE_FAILED: ...`
- `ACCOUNT_KEY_MISMATCH (computed: ...)`
- `Rebuild registry failed: ...`

`CONFLICT_SKIPPED`, missing-sensitive-field, invalid-field, active-protected, snapshot,
serialize, write, and account-field-mismatch paths are per-entry error/skip
collection paths. They are not exact runtime envelope bytes.

## Full Import Ordering

The narrowed static order is:

```text
parse_import_file
  -> ensure_directories
  -> build selectedKeys HashSet if option is present
  -> read_registry_or_empty_keys
  -> read_active_account_key
  -> per-entry selectedKeys inclusion test
  -> missing sensitive-field / invalid field validation
  -> registry conflict + overwriteExisting branch
  -> active-account overwrite guard
  -> make_auth_snapshot
  -> account-field mismatch guard
  -> serde_json::ser::to_vec_pretty
  -> relay::atomic_write::write_atomic
  -> imported-vector append on write success
  -> write-error vector append on write failure
  -> Repository::rebuild_registry after loop if imported vector is non-empty
```

`write_atomic` success happens before `Repository::rebuild_registry`, so a
rebuild failure remains a partial-write risk class. Static evidence cannot
prove rollback/no-rollback bytes.

## Still Missing Before Strict

- exact Tauri IPC request/response/error envelope bytes;
- direct IPC omitted/null/wrong-type behavior for `filePath`,
  `overwriteExisting`, and `selectedKeys`;
- runtime matrix for `selectedKeys=null`, empty array, non-empty array,
  duplicate keys, and invalid element types;
- runtime matrix for `overwriteExisting` omitted/null/false/true;
- exact `CONFLICT_SKIPPED`, `ACTIVE_ACCOUNT_PROTECTED`, import success, and
  write/rebuild failure envelopes;
- before/after auth, registry, quota, and temp bytes;
- rollback/no-rollback or partial-write residue for write/rebuild failures;
- frontend runtime dialog/toast/loading/query-invalidation state;
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
