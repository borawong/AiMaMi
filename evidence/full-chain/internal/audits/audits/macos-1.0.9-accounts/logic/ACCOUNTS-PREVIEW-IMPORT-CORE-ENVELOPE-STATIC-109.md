# Accounts Preview Import Core Envelope Static - AiMaMi 1.0.9

Scope: accounts-only static reducer for the `preview_account_import` success
CoreEnvelope boundary and error-string boundary. It consumes IDA Pro MCP
decompilation from the AiMaMi 1.0.9 SOT IDB, writes no raw evidence, appends no
`INDEX.jsonl` row, edits no regulation file, runs no product/main test, and
promotes no gate.

## Evidence Consumed

- IDB:
  `<source-location>/source-binary/AiMaMi 1.0.9_ida.app/Contents/MacOS/AiMaMi.i64`
- Binary SOT SHA:
  `1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482`
- Command wrapper:
  `tauri::ipc::InvokeResolver<R>::respond_async_serialized_inner::{closure}`
  for `preview_account_import` at `0x100105680`.
- Blocking command body:
  `codexmate_lib::commands::account_io::preview_account_import::{closure}`
  at `0x10032c93c`.
- Core success constructor:
  `codexmate_lib::core::models::CoreEnvelope<T>::ok` at `0x1001db70c`.
- IpcResponse serializer for
  `CoreEnvelope<AccountImportPreviewPayload>` at `0x1001f6870`.
- CoreError display formatter:
  `codexmate_lib::core::models::CoreError as Display` at `0x10020c20c`.
- Payload field reducer:
  `logic/ACCOUNTS-PREVIEW-IMPORT-PAYLOAD-SERIALIZATION-STATIC-109.md`.

## Static Success Envelope

`preview_account_import` success is statically routed through
`CoreEnvelope<T>::ok` and then through the Tauri `IpcResponse::body`
serializer for `CoreEnvelope<AccountImportPreviewPayload>`.

The serialized success object fields are, in static order:

| Field | Static source | Value / meaning |
|---|---|---|
| `schemaVersion` | serializer `0x1001f6870`, field at `0x100edee45` length `13` | `CoreEnvelope::ok` writes version `1` |
| `success` | serializer `0x1001f6870`, field at `0x100ee0d3a` length `7` | `CoreEnvelope::ok` writes `true` |
| `code` | serializer `0x1001f6870`, field at `0x100edeefd` length `4` | `CoreEnvelope::ok` allocates string `ok` |
| `message` | serializer `0x1001f6870`, field at `0x100edf1b2` length `7` | `CoreEnvelope::ok` allocates string `Success` |
| `warnings` | serializer `0x1001f6870`, field at `0x100edec80` length `8` | `CoreEnvelope::ok` constructs an empty warning vector |
| `data` | serializer `0x1001f6870`, field at `0x100ee2744` length `4` | embeds `AccountImportPreviewPayload` |

The `data` field serializes the payload proven in
`ACCOUNTS-PREVIEW-IMPORT-PAYLOAD-SERIALIZATION-STATIC-109.md`: top-level
`filePath`, `schemaVersion`, `kind`, `appVersion`, `exportedAt`,
`exportedHostname`, `accountCount`, 
ewCount`, `conflictCount`, and
`entries`, with entry fields `accountKey`, `email`, `plan`, `authMode`,
`workspaceName`, `profileName`, `conflict`, and `isActiveLocally`.

## Static Error Boundary

The blocking command body at `0x10032c93c` calls `preview_import` and branches
before `CoreEnvelope<T>::ok` when the core result is an error. The error branch
formats the `CoreError` through `Display` and returns a `Result::Err<String>`
to the Tauri command wrapper.

`CoreError as Display` at `0x10020c20c` statically formats these class prefixes:

| Class prefix | Static address |
|---|---:|
| `IO error: ` | `0x100ea7d6e` |
| `JSON error: ` | `0x100ea7d7b` |
| `TOML parse error: ` | `0x100ea7d8a` |
| `TOML serialize error: ` | `0x100ea7d9f` |
| `HTTP error: ` | `0x100ea7db8` |
| `Not found: ` | `0x100ea7dc7` |
| `Invalid data: ` | `0x100ea7dd5` |
| `Operation failed: ` | `0x100ea7de6` |

This proves the static error-string formatting boundary only. It does not prove
the live Tauri transport error envelope bytes or frontend error consumption.

## Gate Interpretation

This reducer closes a static success CoreEnvelope field question and narrows
the error side to `CoreError Display -> Err<String>`. It does not prove:

- live WebView/Tauri IPC invocation;
- exact runtime Tauri success/error transport bytes;
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
