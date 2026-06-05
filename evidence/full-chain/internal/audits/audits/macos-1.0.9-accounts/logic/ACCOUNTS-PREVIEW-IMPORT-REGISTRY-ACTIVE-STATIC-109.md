# Accounts Preview Import Registry Active Static - AiMaMi 1.0.9

Scope: accounts-only static reducer for `preview_account_import`
registry-field and active-field read/classification behavior. It consumes IDA Pro
MCP static decompilation from AiMaMi 1.0.9, writes no raw evidence, appends no
`INDEX.jsonl` row, edits no regulation file, runs no product/main test, and
promotes no gate.

## Evidence Consumed

- IDB:
  `<source-location>/source-binary/AiMaMi 1.0.9_ida.app/Contents/MacOS/AiMaMi.i64`
- Binary SOT SHA:
  `1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482`
- Parent helper:
  `codexmate_lib::core::account_io::preview_import` at `0x1005dd788`.
- Registry helper:
  `codexmate_lib::core::account_io::read_registry_or_empty_keys` at
  `0x1005e2b64`.
- Active-field helper:
  `codexmate_lib::core::account_io::read_active_account_key` at `0x1005e29f4`.
- Parser reducer:
  `logic/ACCOUNTS-PREVIEW-IMPORT-PARSER-ERROR-STATIC-109.md`.

## Static Helper Behavior

`read_registry_or_empty_keys` is read-only by static call shape:

1. `std::sys::fs::metadata` checks the registry path.
2. Metadata failure drops the error and constructs an empty `HashSet`.
3. If metadata succeeds, `std::fs::read_to_string` reads registry JSON text.
4. Read failure constructs an empty `HashSet`.
5. If read succeeds, `serde_json::de::from_trait` decodes the registry items.
6. JSON decode failure constructs an empty `HashSet`.
7. Decode success extends a hash set from the parsed registry items.

`read_active_account_key` is read-only by static call shape:

1. `std::sys::fs::metadata` checks the active-field path.
2. Metadata failure returns absent active field.
3. If metadata succeeds, `std::fs::read_to_string` reads active-field JSON text.
4. Read failure returns absent active field.
5. If read succeeds, `serde_json::de::from_trait` decodes the active-field state.
6. JSON decode failure returns absent active field.
7. Decode success returns the decoded active-field payload.

No write/delete/copy/persist call appears in these helper decompilations.

## Preview Classification Boundary

`preview_import` at `0x1005dd788` proves this ordering:

1. `parse_import_file` runs first.
2. Parser error returns before `CodexPaths::clone`, registry-field read,
   active-field read, preview entry classification, or response payload
   construction.
3. Parser success clones `CodexPaths`.
4. `read_registry_or_empty_keys` reads or defaults the existing-field set.
5. `read_active_account_key` reads or defaults the active-field state.
6. Preview entries are built from parsed accounts and existing/active state.
7. 
ewCount` sums entries where the static conflict byte is false.
8. `conflictCount` sums entries where the static conflict byte is true.
9. The formatted source path becomes payload `filePath`.

This reduces the static meaning of `conflict`, `isActiveLocally`,

ewCount`, and `conflictCount` for valid preview payload planning. It does not
prove live runtime bytes for registry, active-field, payload, or UI state.

## Fixture Boundary Impact

| Fixture class | Static registry/active boundary |
|---|---|
| `missing_path.v1` | parser metadata failure returns before registry/active helper calls |
| `invalid_json.v1` | parser JSON failure returns before registry/active helper calls |
| 
on_utf8.v1` | static proof treats this under parser byte read plus JSON decode unless runtime proves a distinct envelope |
| `valid_file_preview.v1` | registry read failures default to empty existing-field set; active-field read failures default to absent active field; classification still remains static-only |
| `filePath_omitted.v1` | pre-command Tauri decode; helpers not reached |
| `filePath_null.v1` | pre-command Tauri decode; helpers not reached |

## Gate Interpretation

This reducer strengthens valid preview classification and no-write direction.
It does not prove:

- real WebView/Tauri IPC invocation;
- exact runtime Tauri success/error transport bytes;
- direct IPC decode envelope bytes;
- durable before/after bytes for auth, registry, quota, snooze, temp, active
  field, or source fixture paths;
- frontend runtime UI state;
- executed acceptance;
- independent Windows closure.

Gate effect remains no promotion:

- `strictImplementationUse=0`
- `readyToImplement=0`
- `implementation_use=false`
- `gate_accepted=false`
- `full_leaf_100=false`
- `moduleExitAllowed=false`
