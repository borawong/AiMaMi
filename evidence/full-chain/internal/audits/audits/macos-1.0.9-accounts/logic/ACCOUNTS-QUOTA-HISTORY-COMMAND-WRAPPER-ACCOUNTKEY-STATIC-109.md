# Accounts Quota History Command Wrapper AccountKey Static - AiMaMi 1.0.9

Scope: accounts-only same-version macOS AiMaMi 1.0.9 static Tauri command
wrapper and `accountKey` decode boundary for `load_quota_history`.

This reducer creates no raw evidence, appends no `INDEX.jsonl` row, edits no
regulation, edits no product code, runs no product test, and promotes no gate.

## Evidence

- Binary SOT root: `<source-location>/source-binary/`.
- SOT executable:
  `<source-location>/source-binary/AiMaMi 1.0.9.app/Contents/MacOS/AiMaMi`.
- SOT universal SHA-256:
  `1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482`.
- IDA database:
  `<source-location>/source-binary/AiMaMi 1.0.9_ida.app/Contents/MacOS/AiMaMi.i64`.
- IDA MCP endpoint: `<local-tool-endpoint>`.
- IDA HTTP MCP lookup: owner callsite `0x10032bcb4` belongs to wrapper
  function `0x10032bb78`.
- Read-only objdump cross-check: direct branch to `load_quota_history` at
  `0x10032bcb4`.

Confirmed static addresses:

| Symbol / fact | Address |
| --- | --- |
| Tauri wrapper closure | `0x10032bb78` |
| wrapper callsite to `load_quota_history` | `0x10032bcb4` |
| `load_quota_history` owner | `0x1005f7dfc` |
| command/field string cluster | `0x100f2ecf6` |
| `StateManager::try_get` | `0x10034b0fc` |
| state fallback `CommandArg::from_command` | `0x100d73fd8` |
| `accountKey` decode `CommandArg::from_command` | `0x100614d8c` |
| `InvokeResolver::return_result` | `0x10060755c` |
| `InvokeResolver::respond` | `0x10060af0c` |

## Accepted Static Facts

- `0x10032bb78` is the same-version Tauri wrapper closure for
  `load_quota_history`, distinct from the usage and session/sensitive-field/tool/change
  analytics wrappers.
- The wrapper command cluster begins with `load_quota_history` and uses the
  analytics field cluster at `0x100f2ecf6`.
- The wrapper resolves Tauri state through `StateManager::try_get`; if absent,
  it falls back to Tauri state `CommandArg::from_command`.
- State decode failure returns through `InvokeResolver::return_result` before
  decoding `accountKey` and before calling `load_quota_history`.
- The `accountKey` argument field length is statically `10`.
- `accountKey` decodes through `D as CommandArg<R>::from_command` at
  `0x100614d8c`.
- Successful `accountKey` decode copies the local tuple and calls
  `load_quota_history` from `0x10032bcb4`.
- `accountKey` decode failure returns through `InvokeResolver::return_result`
  before the command owner call.
- Command owner output is copied into the response buffer and sent through
  `InvokeResolver::respond` at `0x10060af0c`.
- Resolved-command and invoke-message state are dropped on wrapper exit.

## Boundaries

This reducer only closes static wrapper/accountKey topology for
`load_quota_history`. It does not prove:

- exact runtime `load_quota_history` request/response IPC envelope bytes;
- omitted/null/wrong-type `accountKey` decode envelope bytes;
- quota history source file/path bytes or before-after/no-write bytes;
- runtime point ordering, timestamp format, account filtering, empty/corrupt/
  permission-error behavior, or point deserializer field matrix;
- frontend chart/query/loading/error consumption state;
- executed source archive acceptance mapping;
- independent Windows closure.

## Gate Effect

No promotion.

- `consumerStartReady`: unchanged.
- `consumerStartBlocked`: unchanged.
- `strictImplementationUse`: false / `0`.
- `readyToImplement`: false / `0`.
- `implementation_use`: false.
- `gate_accepted`: false.
- `full_leaf_100`: false.
- `moduleExitAllowed`: false.

Accounts remains the active module. This reducer is dimension evidence only
and does not allow switching to plugins, relay, system, or tray.
