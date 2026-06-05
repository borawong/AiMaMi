# Accounts Usage Analytics Command Wrapper Static - AiMaMi 1.0.9

Scope: accounts-only same-version macOS AiMaMi 1.0.9 static Tauri command
wrapper boundary for `load_usage_analytics`.

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
- IDA HTTP MCP lookup: owner callsite `0x1003285d4` belongs to wrapper
  function `0x100328508`.
- Read-only objdump cross-check: direct branch to `load_usage_analytics` at
  `0x1003285d4`.

Confirmed static addresses:

| Symbol / fact | Address |
| --- | --- |
| Tauri wrapper closure | `0x100328508` |
| wrapper callsite to `load_usage_analytics` | `0x1003285d4` |
| `load_usage_analytics` owner | `0x1005f894c` |
| command/field string cluster | `0x100f2ecf6` |
| `StateManager::try_get` | `0x10034b0fc` |
| state fallback `CommandArg::from_command` | `0x100d73fd8` |
| `InvokeResolver::return_result` | `0x10060755c` |
| `InvokeResolver::respond` | `0x10060fdd0` |

## Accepted Static Facts

- `0x100328508` is the same-version Tauri wrapper closure for
  `load_usage_analytics`, distinct from the session/sensitive-field/tool/change analytics
  wrappers.
- The wrapper command cluster begins with `load_usage_analytics` and uses the
  analytics field cluster at `0x100f2ecf6`.
- The wrapper resolves Tauri state through `StateManager::try_get`; if absent,
  it falls back to Tauri state `CommandArg::from_command`.
- State decode failure returns through `InvokeResolver::return_result` before
  calling `load_usage_analytics`.
- Unlike the session/sensitive-field/tool/change analytics wrappers, this wrapper has no
  second `range` command-argument decode before the owner call.
- Successful state decode directly calls `load_usage_analytics` from
  `0x1003285d4`.
- Command owner output is copied into the response buffer and sent through
  `InvokeResolver::respond` at `0x10060fdd0`.
- Resolved-command and invoke-message state are dropped on wrapper exit.

## Boundaries

This reducer only closes static wrapper/state topology for
`load_usage_analytics`. It does not prove:

- exact runtime `load_usage_analytics` request/response IPC envelope bytes;
- omitted/null/wrong-type state decode envelope bytes;
- source directory byte fixtures or before-after/no-write bytes;
- runtime usage row discovery, activity-window values, date ordering, or
  `visit_dir` leaf behavior;
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
