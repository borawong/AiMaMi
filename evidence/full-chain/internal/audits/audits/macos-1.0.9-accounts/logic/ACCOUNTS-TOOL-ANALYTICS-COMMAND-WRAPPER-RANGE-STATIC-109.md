# Accounts Tool Analytics Command Wrapper Range Static - AiMaMi 1.0.9

Scope: accounts-only same-version macOS AiMaMi 1.0.9 static Tauri command
wrapper and `range` decode boundary for `load_tool_analytics`.

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
- Read-only objdump cross-check: direct branch to `load_tool_analytics` at
  `0x100329788`.

Confirmed static addresses:

| Symbol / fact | Address |
| --- | --- |
| Tauri wrapper closure | `0x10032964c` |
| wrapper callsite to `load_tool_analytics` | `0x100329788` |
| `load_tool_analytics` owner | `0x1005f81c8` |
| command/field string cluster | `0x100f2ecf6` |
| `StateManager::try_get` | `0x10034b0fc` |
| state fallback `CommandArg::from_command` | `0x100d73fd8` |
| `range` decode `CommandArg::from_command` | `0x1003d3dec` |
| `InvokeResolver::return_result` | `0x10060755c` |
| `InvokeResolver::respond` | `0x10060cbd4` |

## Accepted Static Facts

- `0x10032964c` is the same-version Tauri wrapper closure for
  `load_tool_analytics`, not the earlier session analytics wrapper at
  `0x1003226ec`.
- The wrapper command cluster begins with `load_tool_analytics` and shares the
  analytics field cluster at `0x100f2ecf6`.
- The wrapper resolves Tauri state through `StateManager::try_get`; if absent,
  it falls back to Tauri state `CommandArg::from_command`.
- State decode failure returns through `InvokeResolver::return_result` before
  decoding `range` and before calling `load_tool_analytics`.
- The `range` argument field length is statically `5`.
- `range` decodes through `D as CommandArg<R>::from_command` at `0x1003d3dec`.
- Successful `range` decode calls `load_tool_analytics` from `0x100329788`.
- Range decode failure returns through `InvokeResolver::return_result` before
  the command owner call.
- Command owner output is copied into the response buffer and sent through
  `InvokeResolver::respond` at `0x10060cbd4`.

## Boundaries

This reducer only closes static wrapper/range topology for
`load_tool_analytics`. It does not prove:

- exact runtime `load_tool_analytics` request/response IPC envelope bytes;
- omitted/null/wrong-type `range` decode envelope bytes;
- source session JSONL fixtures or before-after/no-write bytes;
- runtime aggregation, topTools ordering, category edge, or parse leaf behavior;
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
