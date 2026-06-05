# Accounts Preview Import Parser Error Static - AiMaMi 1.0.9

Scope: accounts-only static reducer for `preview_account_import`
`parse_import_file` parser validation and error-class ordering. It consumes
IDA Pro MCP static decompilation from AiMaMi 1.0.9, writes no raw evidence,
appends no `INDEX.jsonl` row, edits no regulation file, runs no product/main
test, and promotes no gate.

## Evidence Consumed

- IDB:
  `<source-location>/source-binary/AiMaMi 1.0.9_ida.app/Contents/MacOS/AiMaMi.i64`
- Binary SOT SHA:
  `1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482`
- Parser:
  `codexmate_lib::core::account_io::parse_import_file` at `0x1005e13fc`.
- Parent helper:
  `codexmate_lib::core::account_io::preview_import` at `0x1005dd788`.
- Command wrapper:
  `tauri::ipc::InvokeResolver<R>::respond_async_serialized_inner::{closure}`
  for `preview_account_import` at `0x100105680`.

## Static Parser Order

IDA decompilation of `parse_import_file` proves this validation order:

1. `std::sys::fs::metadata` on the supplied path.
2. Metadata failure returns before file read, JSON decode, backup validation,
   registry read, active-field read, preview classification, or response
   construction.
3. File size is rejected when `metadata.len > 0xA00000` (`10,485,760`
   bytes).
4. `std::fs::read` reads file bytes only after metadata and size pass.
5. Read failure returns before JSON decode and backup validation.
6. `serde_json::de::from_trait` decodes the read bytes.
7. JSON decode failure formats the prefix
   `Not a valid AiMaMi accounts backup: ` with the serde JSON error display.
8. Backup `kind` is checked as exact string `aimami-accounts-export` with
   length `22`.
9. Backup `schemaVersion` is checked for value `1`.
10. Account count is rejected when greater than `0x1F4` (`500`).
11. Empty account list returns the exact static string
   `Backup contains no accounts`.
12. Only after these checks does the parser return the decoded export file to
   the preview helper.

## Fixture Boundary Impact

| Fixture class | Static parser boundary |
|---|---|
| `missing_path.v1` | metadata failure before read/decode/validation/registry/active-field/classification |
| `invalid_json.v1` | metadata and read pass; serde JSON decode fails with `Not a valid AiMaMi accounts backup: ...` prefix |
| 
on_utf8.v1` | not independently proven as a distinct text class; read bytes reach JSON decode and fall under serde JSON display unless runtime proves a separate envelope |
| `valid_file_preview.v1` | must pass metadata, size, read, JSON, kind, schema, count <= 500, and non-empty account list before preview classification |
| `filePath_omitted.v1` | pre-command Tauri command-arg decode boundary; parser is not reached by static proof |
| `filePath_null.v1` | pre-command Tauri command-arg decode boundary; parser is not reached by static proof |

## Error Class Notes

- Missing/unreadable path and file read failures propagate parser-side error
  variants before JSON/backup validation.
- Oversize input is rejected at `> 0xA00000` before read.
- Invalid JSON uses the serde JSON display formatter under
  `Not a valid AiMaMi accounts backup: `.
- Invalid `kind`, invalid `schemaVersion`, too many accounts, and empty account
  list are backup-validation failures after JSON decode.
- The exact live Tauri transport object for these failures is not proven here.

## Gate Interpretation

This reducer strengthens static parser/error fixture design for
`preview_account_import`. It does not prove:

- real WebView/Tauri IPC invocation;
- exact runtime Tauri success/error transport bytes;
- omitted/null/wrong-type direct IPC decode envelopes;
- durable no-write before/after bytes;
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
