# Accounts Preview Import IDA No-Write Static Selector - AiMaMi 1.0.9

Scope: accounts-only static reducer for the selected
`preview_account_import` strict lane on AiMaMi 1.0.9 macOS. This file records
IDA Pro MCP static evidence only. It writes no raw evidence, appends no
`INDEX.jsonl` row, runs no product/main test, edits no regulation file, and
promotes no gate.

## IDA Source Binding

- IDB:
  `<source-location>/source-binary/AiMaMi 1.0.9_ida.app/Contents/MacOS/AiMaMi.i64`
- input binary:
  `<source-location>/source-binary/AiMaMi 1.0.9_ida.app/Contents/MacOS/AiMaMi`
- SOT executable SHA-256:
  `1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482`

## Functions Crosschecked

| Function | Address | Static finding |
|---|---:|---|
| `preview_import` | `0x1005dd788` | calls parser first; on parser error copies the parser error into the command result and returns before registry/active-field reads |
| `parse_import_file` | `0x1005e13fc` | calls `metadata`, checks size `0xa00000`, reads bytes, decodes JSON, validates backup kind/version/account count |
| `read_registry_or_empty_keys` | `0x1005e2b64` | metadata/read/JSON failure falls back to an empty field set; successful read parses registry JSON |
| `read_active_account_key` | `0x1005e29f4` | metadata/read/JSON failure returns absent active field |

## Missing Path Static Order

IDA decompile of `parse_import_file` shows the missing/unreadable source path
branch starts with `std::sys::fs::metadata`. If metadata returns the error
variant, the function writes an error result and returns before file read,
JSON decode, account validation, registry read, active-field read, preview
classification, or response construction.

IDA decompile of `preview_import` confirms this parser result is checked
before `CodexPaths::clone`, `read_registry_or_empty_keys`, and
`read_active_account_key`. Therefore the selected missing-path fixture is the
strongest static no-commit candidate: the static command body reaches no
registry helper and no active-field helper when parser metadata fails.

## Static Error Boundaries

IDA directly corroborates these parser-side branches:

- metadata failure / missing path: error before `std::fs::read`;
- oversize source: `v43 > 0xa00000` and a formatted size error;
- file read failure: error before JSON decode;
- JSON decode failure: formats `Not a valid AiMaMi accounts backup: ...`;
- too many accounts: formats `Backup contains too many accounts ...`;
- empty account list: constructs `Backup contains no accounts`.

IDA string xrefs inside `parse_import_file` also hit:

- `Not a valid AiMaMi accounts backup: `;
- `Backup contains too many accounts (`;

and inline bytes show `Backup contains no accounts`.

## No-Write Static sensitive-field Check

The IDA-decompiled text for `preview_import`, `parse_import_file`,
`read_registry_or_empty_keys`, and `read_active_account_key` was scanned for
write/delete/copy/persist tokens:

- `std::fs::write`
- `std::sys::fs::copy`
- `std::sys::fs::remove_file`
- `remove_file`
- `create_dir`
- `rename`
- `OpenOptions`
- `File::create`
- `persist_registry`
- `quota_store::save`

No sensitive-field was present in those four functions. This supports the static
no-write direction for `preview_account_import`, especially the missing-path
early return.

This is not durable no-write proof. Strict still needs before/after bytes for
auth, registry, quota, snooze, temp, and source fixture paths from an accepted
same-version invocation or an accepted equivalent static/runtime substitute.

## Fixture Selector Impact

The selected first fixture remains:

```text
fixture_id: accounts.preview_account_import.missing_path.v1
command: preview_account_import
request body: { "filePath": "<disposable>/import/missing.json" }
expected mutation: no auth, registry, quota, snooze, temp, or source fixture mutation
```

Static confidence is improved:

- parser metadata error precedes all parser read/decode/classification work;
- preview command returns parser error before registry and active-field helper
  reads;
- no write/delete/copy/persist sensitive-field is present in the four static functions.

Still missing for strict:

- real AiMaMi 1.0.9 WebView/Tauri IPC invocation or accepted substitute;
- exact Tauri/CoreError envelope for missing path;
- exact omitted/null pre-command decode behavior;
- frontend runtime UI-state or accepted same-platform callback proof;
- durable before/after bytes;
- executed source archive acceptance;
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

