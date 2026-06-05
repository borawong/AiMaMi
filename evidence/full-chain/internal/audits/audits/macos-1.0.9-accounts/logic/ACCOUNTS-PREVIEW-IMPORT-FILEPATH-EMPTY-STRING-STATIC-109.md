# Accounts Preview Import FilePath Empty String Static - AiMaMi 1.0.9

Scope: accounts-only same-version static reducer for the direct
`preview_account_import` request body shape `{ "filePath": "" }`.

This reducer consumes existing IDA/Ghidra evidence only. It creates no raw
bundle, appends no `INDEX.jsonl` row, edits no regulation or skill, changes no
product code, runs no product/main test, and promotes no gate.

## Evidence Consumed

- `logic/ACCOUNTS-PREVIEW-IMPORT-COMMAND-DTO-STATIC-109.md`
- `logic/ACCOUNTS-PREVIEW-IMPORT-MISSING-PATH-ERROR-CHAIN-STATIC-109.md`
- `logic/ACCOUNTS-PREVIEW-IMPORT-STRICT-STATIC-BOUNDARY-109.md`
- `<source-location>/intermediate/aimami/1.0.9/macos/accounts/preview-import-helper-leaf-pseudocode/manifest.json`
- `<source-location>/intermediate/aimami/1.0.9/macos/accounts/preview-import-helper-leaf-pseudocode/ghidra/pseudocode-homebrew/0001_preview_account_import_core_preview_import_9ab0cbc2.c`
- `<source-location>/intermediate/aimami/1.0.9/macos/accounts/preview-import-helper-leaf-pseudocode/ghidra/pseudocode-homebrew/0002_preview_account_import_helper_parse_import_file_ff3065fc.c`

## Static Classification

`filePath: ""` is not the same boundary as omitted or explicit 
ull`.

| Case | Static classification | Why it matters |
|---|---|---|
| omitted `filePath` | pre-command Tauri/serde decode boundary | The Rust blocking command body does not receive a string path. |
| `filePath: null` | pre-command Tauri/serde nullability boundary | The Rust blocking command body does not receive a string path. |
| `filePath: ""` | decoded zero-length string path reaches the blocking command body | The command body copies a length-0 string slice and calls `preview_import`, so the failure class is backend filesystem metadata, not argument decode. |

IDA address evidence:

| Function | Address | Static fact |
|---|---:|---|
| Tauri wrapper | `0x100105680` | command field is `filePath`; `CommandArg::from_command` must succeed before the blocking closure is scheduled. |
| blocking command body | `0x10032c93c` | decoded path bytes and length are copied, then `preview_import` is called at `0x10032cb40`; length `0` is not rejected in this body. |
| core preview helper | `0x1005dd788` | calls `parse_import_file` before registry or active-account reads. |
| parser helper | `0x1005e13fc` | calls `std::sys::fs::metadata` at `0x1005e142c` before file read or JSON decode. |

Therefore the static path for `{ "filePath": "" }` is:

```text
Tauri command arg decode succeeds as a string
-> blocking command body copies zero bytes as the file path argument
-> preview_import calls parse_import_file
-> parse_import_file calls metadata("") before read/json/registry work
-> metadata failure returns through CoreError Display
```

This closes only the static taxonomy gap between empty-string backend failure
and omitted/null pre-command decode failure. It does not prove the exact live
Tauri/CoreError JSON envelope, frontend toast/dialog state, or no-write bytes.

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

Remaining blockers: accepted same-version WKWebView/Tauri IPC harness, exact
request/error envelope for `{ "filePath": "" }`, before/after no-write bytes,
UI runtime state, fixture PASS/FAIL, and independent platform closure.
