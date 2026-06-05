# Accounts Import Accounts Skipped Serialization Static - AiMaMi 1.0.9

Scope: accounts-only same-version macOS AiMaMi 1.0.9 static reducer for the
`AccountImportSkipped` element shape nested under `import_accounts_from_file`
success payload `skipped`.

This reducer consumes IDA Pro MCP HTTP decompilation from the active current
IDA database:

`<source-location>/source-binary/AiMaMi 1.0.9_ida.app/Contents/MacOS/AiMaMi.i64`

It writes no raw/intermediate artifact, appends no `INDEX.jsonl` row, edits no
rule/spec/skill file, runs no product test, changes no product code, and
promotes no gate.

## Functions Reduced

| Function | Address | Static role |
|---|---:|---|
| `AccountImportSkipped::serialize` | `0x1001d44cc` | skipped-entry map serializer |
| `AccountImportPayload::serialize` | `0x1001d45fc` | parent success payload serializer that exposes top-level `skipped` |

## Skipped Entry Static Shape

IDA decompilation of `AccountImportSkipped::serialize` at `0x1001d44cc`
opens a JSON map and serializes three visible entries in this static order:

1. `accountKey`
2. `error`
3. `reason`

The serializer call lengths are:

| Field | Length argument |
|---|---:|
| `accountKey` | `10` |
| `error` | `5` |
| `reason` | `6` |

Local strings cross-check against the same SOT binary shows the import payload
cluster contains `reason`, `importedCount`, `skipped`,
`importedAccountKeys`, `registryAccountCount`, and `activeAccountKey`, while
the import error-code cluster contains:

- `ACCOUNT_MISSING_TOKEN`
- `INVALID_ACCOUNT_KEY`
- `ACTIVE_ACCOUNT_PROTECTED`
- `Backup contains no accounts`

Existing reducers already record the parent payload fields and selected /
overwrite branches. This reducer narrows the nested `skipped[]` element shape
only: skipped rows are not anonymous strings; they are structured entries with
`accountKey`, `error`, and `reason` fields.

## Static Relationship To Import Branches

Read together with:

- `logic/ACCOUNTS-IMPORT-ACCOUNTS-COMMIT-STATIC-109.md`
- `logic/ACCOUNTS-IMPORT-ACCOUNTS-SELECTED-OVERWRITE-STATIC-109.md`
- `logic/ACCOUNTS-IMPORT-ACCOUNTS-PAYLOAD-SERIALIZATION-STATIC-109.md`

Accepted static relationship:

- `AccountImportPayload::serialize` exposes top-level `skipped`.
- `AccountImportSkipped::serialize` gives each skipped entry the structured
  field shape above.
- Existing static branches produce skipped cases for missing sensitive-field, invalid
  account field, active-account protection, and conflict/no-overwrite classes.

This is not runtime branch proof for the exact values or counts in `skipped`.

## Still Missing Before Strict

- live Tauri IPC invocation and exact request body;
- direct IPC omitted/null/wrong-type/default behavior for `filePath`,
  `overwriteExisting`, and `selectedKeys`;
- exact success envelope bytes and runtime `skipped[]` entry values for
  missing sensitive-field, invalid field, active account, conflict, selected-field miss, and
  mixed success/skip cases;
- exact before/after auth, registry, quota, and temp bytes;
- rollback/no-rollback proof for write and rebuild failures;
- frontend runtime toast/dialog/query-invalidation state;
- executed source archive acceptance mapping;
- independent Windows closure where required by the gate.

## Gate Effect

No promotion.

- `consumerStartReady`: unchanged, accounts remains `9/9` Gate 1 static only.
- `consumerStartBlocked`: unchanged, accounts remains `0/9`.
- `strictImplementationUse`: `0/9`.
- `readyToImplement`: `0/9`.
- `implementation_use`: false.
- `gate_accepted`: false.
- `full_leaf_100`: false.
- `moduleExitAllowed`: false.

Accounts remains the active locked module. This reducer does not permit
switching to plugins, relay, system, or tray.
