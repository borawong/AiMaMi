# Accounts Preview Import Parser CoreError Map Static - AiMaMi 1.0.9

Scope: accounts-only same-version static reducer for
`preview_account_import` parser failure branches and their `CoreError Display`
class prefixes.

This reducer consumes IDA Pro MCP static evidence from the active AiMaMi 1.0.9
IDB only. It creates no raw bundle, appends no `INDEX.jsonl` row, edits no
regulation or skill, changes no product code, runs no product/main test, and
promotes no gate.

## Evidence Consumed

- IDB:
  `<source-location>/source-binary/AiMaMi 1.0.9_ida.app/Contents/MacOS/AiMaMi.i64`
- Binary SOT SHA:
  `1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482`
- Parser:
  `codexmate_lib::core::account_io::parse_import_file` at `0x1005e13fc`.
- Blocking command body:
  `codexmate_lib::commands::account_io::preview_account_import::{closure}`
  at `0x10032c93c`.
- CoreError formatter:
  `<codexmate_lib::core::models::CoreError as core::fmt::Display>::fmt` at
  `0x10020c20c`.
- Existing reducers consumed:
  `logic/ACCOUNTS-PREVIEW-IMPORT-PARSER-ERROR-STATIC-109.md`,
  `logic/ACCOUNTS-PREVIEW-IMPORT-CORE-ENVELOPE-STATIC-109.md`, and
  `logic/ACCOUNTS-COREERROR-DISPLAY-SURFACE-STATIC-109.md`.

## Static Variant Map

IDA decompilation of `parse_import_file` proves that parser failures are not
all the same `CoreError` class:

| Parser branch | Static branch evidence | CoreError Display class |
|---|---|---|
| metadata failure | `std::sys::fs::metadata(filePath)` returns error; parser writes CoreError tag `2` before returning | `IO error: ` |
| source read failure | `std::fs::read::inner(filePath)` returns error; parser writes `xmmword_100EDE9E0`, whose CoreError tag is `2` | `IO error: ` |
| file too large | `metadata.len > 0xA00000`; parser formats `File too large (` / ` bytes, max ` and writes `xmmword_100EDEA70`, whose CoreError tag is `8` | `Invalid data: ` |
| JSON decode failure | `serde_json::de::from_trait` returns error; parser formats `Not a valid AiMaMi accounts backup: ` and writes CoreError tag `8` | `Invalid data: ` |
| backup kind mismatch | kind string differs from `aimami-accounts-export`; parser formats `Unknown backup kind: ..., expected ...` and writes CoreError tag `8` | `Invalid data: ` |
| unsupported schema version | schema version differs from `1`; parser formats `Unsupported schema version: ...` and writes CoreError tag `8` | `Invalid data: ` |
| too many accounts | account count `> 0x1F4` (`500`); parser formats `Backup contains too many accounts (..., max 500)` and writes CoreError tag `8` | `Invalid data: ` |
| empty account list | account count is zero; parser copies `Backup contains no accounts` and writes CoreError tag `8` | `Invalid data: ` |

The command body at `0x10032c93c` receives these parser errors through
`preview_import`, formats the `CoreError` through `Display`, and returns
`Err<String>` before `CoreEnvelope<T>::ok`.

## CoreError Display Prefix Evidence

`CoreError::fmt @ 0x10020c20c` maps CoreError tag `2` to the format prefix
`IO error: ` at `0x100ea7d6e`. It maps CoreError tag `8` to the format prefix
`Invalid data: ` at `0x100ea7dd5`.

The parser constants corroborate the tag assignment:

- `xmmword_100EDE9E0` begins with result error marker plus CoreError tag `2`;
- `xmmword_100EDEA70` begins with result error marker plus CoreError tag `8`;
- empty-account construction writes CoreError tag `8` adjacent to the copied
  `Backup contains no accounts` string.

## Fixture Impact

This static map changes fixture classification:

| Fixture | Expected static error class |
|---|---|
| `missing_path.v1` | `IO error: ...` because metadata fails before read/decode |
| `unreadable_file.v1` | `IO error: ...` because source read fails after metadata/size pass |
| `file_too_large.v1` | `Invalid data: File too large (...)` |
| `invalid_json.v1` | `Invalid data: Not a valid AiMaMi accounts backup: ...` |
| `kind_mismatch.v1` | `Invalid data: Unknown backup kind: ..., expected ...` |
| `schema_unsupported.v1` | `Invalid data: Unsupported schema version: ...` |
| `too_many_accounts.v1` | `Invalid data: Backup contains too many accounts (..., max 500)` |
| `empty_accounts.v1` | `Invalid data: Backup contains no accounts` |

`filePath` omitted/null/wrong-type/non-object direct IPC cases are still
pre-command argument decode failures. They do not reach `parse_import_file`,
so this reducer does not classify their Tauri decode envelope.

## Gate Effect

No promotion.

- `consumerStartReady=9/9` remains Gate 1 static context only.
- `consumerStartBlocked=0/9` remains Gate 1 static context only.
- `strictImplementationUse=0/9`.
- `readyToImplement=0/9`.
- `strictImplementationUse=false`.
- `readyToImplement=false`.
- `implementation_use=false`.
- `gate_accepted=false`.
- `full_leaf_100=false`.
- `moduleExitAllowed=false`.

Remaining blockers: live WebView/Tauri IPC invocation, exact runtime Tauri
transport bytes, before/after no-write bytes, frontend dialog/toast state,
executed fixture PASS/FAIL, and independent Windows closure.
