# Accounts Import Accounts Payload Serialization Static - AiMaMi 1.0.9

Scope: accounts-only static reducer for `import_accounts_from_file`
success-payload serialization.

This reducer uses same-version AiMaMi 1.0.9 IDA HTTP MCP evidence from the
active IDA database:

`<source-location>/source-binary/AiMaMi 1.0.9_ida.app/Contents/MacOS/AiMaMi.i64`

It writes no raw evidence, appends no `INDEX.jsonl` row, edits no regulation
or skill, runs no product test, changes no product code, and promotes no gate.

## Functions Reduced

| Function | Address | Role |
|---|---:|---|
| `AccountImportPayload::serialize` | `0x1001d45fc` | success payload map serializer |
| `commands::account_io::import_accounts_from_file::{closure}::{closure}` | `0x10032d77c` | command body, success/error copy-out boundary |

## Payload Field Static Shape

`AccountImportPayload::serialize` opens a JSON map and serializes five visible
entries in this static order:

1. `importedCount`
2. `importedAccountKeys`
3. `skipped`
4. `registryAccountCount`
5. `activeAccountKey`

IDA byte checks for the anonymous string references used by the serializer
confirm the field names:

| Field | String address | Length in serializer |
|---|---:|---:|
| `importedCount` | `0x100edf53e` | 13 |
| `importedAccountKeys` | `0x100ee0c7a` | 19 |
| `skipped` | `0x100edf54b` | 7 |
| `registryAccountCount` | `0x100ee0c8d` | 20 |
| `activeAccountKey` | `0x100ee0a72` | 16 |

The symbol table also contains
`<impl serde_core::ser::Serialize for codexmate_lib::core::models::AccountImportPayload>::serialize`
at `0x1001d45fc`, matching the IDA function.

## Command Body Static Boundary

The command body at `0x10032d77c` confirms the static wrapper boundary:

- obtains app state through `tauri::state::StateManager::try_get`;
- locks the repository/state mutex;
- formats poisoned lock as `poisoned lock: another task failed inside`;
- copies decoded `filePath` bytes;
- passes `overwriteExisting` as the W3 boolean argument;
- passes the deserialized `selectedKeys` option/vector storage to
  `core::account_io::import_accounts`;
- if the backend returns a CoreError-shaped result, formats it through
  `CoreError Display -> Err<String>`;
- if the backend returns success, copies the `AccountImportPayload` result back
  for the command response path.

This refines the success payload field map for implementation planning. It
does not prove exact Tauri transport bytes, CoreEnvelope null/omitted fields,
runtime array contents, runtime field ordering after serde integration, or
frontend-visible UI state.

## Gate Effect

No promotion.

- `consumerStartReady`: unchanged, accounts remains `9/9` for Gate 1 static
  context only.
- `consumerStartBlocked`: unchanged, accounts remains `0/9` for Gate 1 static
  context only.
- `strictImplementationUse`: `0/9`.
- `readyToImplement`: `0/9`.
- `implementation_use`: false.
- `gate_accepted`: false.
- `full_leaf_100`: false.
- `moduleExitAllowed`: false.

Remaining strict blockers:

- missing live Tauri IPC invocation;
- exact request and decode envelopes for `filePath`, `overwriteExisting`, and
  `selectedKeys`;
- exact success/error transport bytes and CoreEnvelope field presence;
- runtime `importedAccountKeys`, `skipped`, count, and active-field values for
  selected/overwrite/conflict cases;
- before/after `auth.json`, registry, quota, and temp-file bytes;
- partial-write and rebuild-failure residue;
- frontend runtime toast/dialog/loading/invalidation state;
- executed source archive acceptance mapping;
- independent Windows closure where required by the gate.
