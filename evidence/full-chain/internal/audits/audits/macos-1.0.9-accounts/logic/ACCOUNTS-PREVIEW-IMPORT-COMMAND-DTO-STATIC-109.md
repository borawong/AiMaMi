# Accounts Preview Import Command DTO Static Boundary - AiMaMi 1.0.9

Scope: accounts-only static reducer for the Tauri command wrapper and DTO
boundary of `preview_account_import` on AiMaMi 1.0.9 macOS. This file records
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

## Static Command Wrapper Evidence

IDA decompile of the Tauri async command wrapper at `0x100105680` shows:

- the command string cluster begins with `preview_account_import`;
- the wrapper passes command name length `22`, matching
  `preview_account_import`;
- the argument field string is `filePath` with length `8`;
- Tauri `CommandArg::from_command` is called for that field;
- the non-success decode branch checks `v99[0] != 6`, drops the prepared
  `AppHandle`, and returns through the wrapper error path;
- the success decode branch copies the resolved command/app state, stores the
  decoded `filePath` string triple, and schedules the blocking command closure
  with `tauri::async_runtime::spawn_blocking`;
- the async join failure branch formats the prefix
  `Blocking command task failed: ` with the `tauri::Error` display formatter;
- the command result branch calls
  `IpcResponse::body` for `CoreEnvelope<AccountImportPreviewPayload>` before
  `InvokeResolver::return_result`;
- the same wrapper later drops
  `codexmate_lib::commands::account_io::preview_account_import::{closure}`.

This confirms the command field and static decode boundary:

```text
command: preview_account_import
required static field: filePath
frontend wrapper body shape: { filePath }
```

It does not prove the exact runtime envelope for omitted `filePath`, explicit

ull`, malformed object, non-object payload, or wrong type. Those remain
pre-command Tauri/serde decode gaps until an accepted same-version invocation
or accepted substitute captures the exact envelope.

## Static Transport / Task Wrapper Boundary

The same `0x100105680` wrapper proves these static wrapper classes:

| Branch | Static evidence | Interpretation |
|---|---|---|
| command-arg decode failure | `CommandArg::from_command` returns a non-success tag before the blocking closure is scheduled | direct omitted/null/wrong-type/non-object probes are pre-command Tauri decode failures, not `preview_import` failures |
| blocking task join failure | join error is formatted with `Blocking command task failed: ` and `tauri::Error` display | task failure string class is known, exact live transport envelope remains unknown |
| command success | command result passes through `IpcResponse::body` for `CoreEnvelope<AccountImportPreviewPayload>` | static success body serializer is the CoreEnvelope reducer |
| command core error | blocking body formats `CoreError` and returns `Err<String>` | exact Tauri transport error bytes remain runtime-only |

This wrapper evidence is useful for implementation planning because it
separates pre-command Tauri decode errors from core `preview_import` errors.
It still cannot supply accepted runtime bytes for Tauri `InvokeResolver`
transport, frontend-visible error objects, or UI consumption.

## Static Command Body Evidence

IDA decompile of
`codexmate_lib::commands::account_io::preview_account_import::{closure}::{closure}`
at `0x10032c93c` shows:

- `StateManager::try_get` is used to obtain state;
- the state mutex is locked before command body execution;
- the decoded `filePath` bytes are copied before calling the core helper;
- `codexmate_lib::core::account_io::preview_import` at `0x1005dd788` is called;
- if the core helper returns `CoreError`, the wrapper formats the error through
  `CoreError` display and returns the error variant;
- on success, the wrapper returns through `CoreEnvelope<T>::ok`.

This adds static wrapper/body ordering but not exact serialized envelope
shape. The static branch confirms error-vs-success envelope construction class:

| Core helper result | Static wrapper behavior | Still missing |
|---|---|---|
| error | formats `CoreError` display and returns error variant | exact Tauri/CoreError JSON envelope and frontend toast/dialog consumption |
| success | wraps payload through `CoreEnvelope<T>::ok` | exact payload field serialization, null/omitted warning/error fields, UI preview state |

## Interface Boundary Status

`preview_account_import` interface status after this reducer:

- `filePath` is statically required by the command wrapper field lookup;
- UI wrapper supplies `{ filePath }` only after file picker selection;
- UI cancel remains a frontend no-invoke branch;
- direct IPC omitted/null/wrong-type `filePath` is not covered by backend
  `parse_import_file`, because it fails in command argument decoding before the
  core helper receives a path;
- missing existing file path with a string value reaches `parse_import_file`
  metadata failure, as recorded in
  `logic/ACCOUNTS-PREVIEW-IMPORT-IDA-NO-WRITE-STATIC-109.md`.

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

This reducer strengthens DTO/interface static evidence for
`preview_account_import`. It does not allow switching to plugins, relay,
system, or tray.
