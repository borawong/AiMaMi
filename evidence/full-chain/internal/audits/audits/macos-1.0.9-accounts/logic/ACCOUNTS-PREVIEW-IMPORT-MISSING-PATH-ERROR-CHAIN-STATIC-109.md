# Accounts Preview Import Missing-Path Error Chain Static - AiMaMi 1.0.9

Scope: accounts-only static reducer for the selected
`accounts.preview_account_import.missing_path.v1` strict lane.

This reducer consumes IDA Pro MCP static evidence from the current AiMaMi 1.0.9
IDB:

`<source-location>/source-binary/AiMaMi 1.0.9_ida.app/Contents/MacOS/AiMaMi.i64`.

It creates no raw evidence, appends no `INDEX.jsonl` row, edits no regulation,
edits no product code, runs no product test, and promotes no gate.

## Static Chain

Accepted same-version IDA facts:

| Function | Address | Static fact |
|---|---:|---|
| Tauri wrapper | `0x100105680` | command string cluster contains `preview_account_import`; field cluster contains `filePath`; `CommandArg::from_command` runs before the blocking body; join failure can format `Blocking command task failed: `; success path reaches `IpcResponse::body` and `InvokeResolver::return_result` |
| blocking command body | `0x10032c93c` | calls core `preview_import` at `0x10032cb40`; core error branch calls `CoreError Display` at `0x10032cba8`; state error strings include `state() called before manage() for ` and `poisoned lock: another task failed inside` |
| core preview helper | `0x1005dd788` | calls `parse_import_file` at `0x1005dd7c4`; only after parser success does it call `read_registry_or_empty_keys` at `0x1005dd878` and `read_active_account_key` at `0x1005dd888` |
| parser helper | `0x1005e13fc` | calls `std::sys::fs::metadata` at `0x1005e142c`, `std::fs::read::inner` at `0x1005e14ac`, and `serde_json::de::from_trait` at `0x1005e14fc` |

IDA string refs inside `parse_import_file` directly confirm:

- `Not a valid AiMaMi accounts backup: ` at `0x100eaf0ae`, referenced from
  `0x1005e1528`;
- `Backup contains too many accounts (` at `0x100eaeff3`, referenced from
  `0x1005e16d0`.

No direct static string was accepted for a concrete missing-path message such
as `No such file`. The selected missing-path fixture should therefore be
treated as:

```text
std::sys::fs::metadata(filePath) error
-> parser helper returns an error before read/json/registry/active-field work
-> blocking command body formats CoreError through Display
-> Tauri wrapper returns an error-shaped command result
```

This is the accepted static chain only. Exact live Tauri/CoreError JSON bytes,
frontend toast state, and before/after no-write bytes remain runtime-required.

## Gate Effect

No promotion:

- `consumerStartReady=9/9` Gate 1 static context only.
- `consumerStartBlocked=0/9` Gate 1 static context only.
- `strictImplementationUse=0/9`.
- `readyToImplement=0/9`.
- `implementation_use=false`.
- `gate_accepted=false`.
- `full_leaf_100=false`.
- `moduleExitAllowed=false`.

The first selected strict lane remains
`accounts.preview_account_import.missing_path.v1`, but this reducer does not
execute that fixture and does not allow switching modules.
