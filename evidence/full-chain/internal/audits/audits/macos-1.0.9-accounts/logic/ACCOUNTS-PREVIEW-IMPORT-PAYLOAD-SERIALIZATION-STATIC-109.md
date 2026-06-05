# Accounts Preview Import Payload Serialization Static - AiMaMi 1.0.9

Scope: accounts-only static reducer for the `preview_account_import` success
payload shape. It consumes IDA Pro MCP decompilation from the AiMaMi 1.0.9 SOT
IDB, writes no raw evidence, appends no `INDEX.jsonl` row, edits no regulation
file, runs no product/main test, and promotes no gate.

## Evidence Consumed

- IDB:
  `<source-location>/source-binary/AiMaMi 1.0.9_ida.app/Contents/MacOS/AiMaMi.i64`
- Binary SOT SHA:
  `1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482`
- Payload serializer:
  `codexmate_lib::core::models::AccountImportPreviewPayload::serialize`
  at `0x1001d6e34`.
- Entry serializer:
  `codexmate_lib::core::models::AccountImportPreviewEntry::serialize`
  at `0x1001d6source archive0`.
- Core builder:
  `codexmate_lib::core::account_io::preview_import` at `0x1005dd788`.
- Command body:
  `codexmate_lib::commands::account_io::preview_account_import::{closure}`
  blocking body at `0x10032c93c`.

## Static Payload Fields

IDA decompilation of `AccountImportPreviewPayload::serialize` emits a JSON map
with these top-level keys, in this static order:

| Field | Source address / length | Value source |
|---|---:|---|
| `filePath` | `0x100edf523` / `8` | formatted source path copied into payload offset `0` |
| `schemaVersion` | `0x100edee45` / `13` | parsed backup metadata copied into payload offset `128` |
| `kind` | `0x100ee0f7f` / `4` | parsed backup kind copied into payload offset `24` |
| `appVersion` | `0x100ee0f83` / `10` | parsed backup app version copied into payload offset `48` |
| `exportedAt` | `0x100edf4f8` / `10` | parsed backup exported-at value copied into payload offset `120` |
| `exportedHostname` | `0x100ee0f8d` / `16` | parsed backup hostname copied into payload offset `96` |
| `accountCount` | `0x100ee0a66` / `12` | parsed account count copied into payload offset `132` |
| 
ewCount` | `0x100ee0f9d` / `8` | computed by `preview_import` from non-conflicting preview entries |
| `conflictCount` | `0x100ee0fa5` / `13` | computed by `preview_import` from conflicting preview entries |
| `entries` | `0x100ee0fb2` / `7` | serialized array of `AccountImportPreviewEntry` values |

The `entries` field is serialized as an array. The generated serializer writes
`[` / `]`, iterates in `152`-byte entry strides, and invokes
`AccountImportPreviewEntry::serialize` for each element.

## Static Entry Fields

IDA decompilation of `AccountImportPreviewEntry::serialize` emits a JSON map
with these keys:

| Field | Source address / length | Static meaning |
|---|---:|---|
| `accountKey` | `0x100edee6e` / `10` | account field for the imported account |
| `email` | `0x100ee0904` / `5` | account email |
| `plan` | `0x100edef33` / `4` | normalized plan/subscription field |
| `authMode` | `0x100ee0931` / `8` | account auth mode |
| `workspaceName` | `0x100ee0919` / `13` | workspace name |
| `profileName` | `0x100ee0926` / `11` | profile name |
| `conflict` | `0x100ee0f68` / `8` | whether the field conflicts with existing registry keys |
| `isActiveLocally` | `0x100ee0f70` / `15` | whether the field is the active local account |

## Count Construction

`preview_import` at `0x1005dd788` constructs preview entries after
`parse_import_file`, `read_registry_or_empty_keys`, and
`read_active_account_key`. It then scans the entry array:

- 
ewCount` increments from the inverse of the entry conflict byte;
- `conflictCount` increments from the entry conflict byte;
- the active-local flag is serialized per entry as `isActiveLocally`.

The same function formats the input path through the standard path display
formatter before assigning the payload `filePath` field.

## Gate Interpretation

This reducer closes only the static success payload-field question for
`preview_account_import`. It does not prove:

- live WebView/Tauri IPC invocation;
- exact success/error envelope bytes at runtime;
- omitted/null/wrong-type `filePath` decode envelopes;
- invalid JSON vs non-UTF8 runtime distinction;
- before/after auth, registry, quota, snooze, temp, or source fixture bytes;
- dialog/toast runtime UI state;
- executed acceptance;
- independent Windows closure.

Gate effect remains no promotion:

- `strictImplementationUse=0`
- `readyToImplement=0`
- `implementation_use=false`
- `gate_accepted=false`
- `full_leaf_100=false`
- `moduleExitAllowed=false`
