# Accounts Change Analytics Command Wrapper Range Static - AiMaMi 1.0.9

Scope: accounts-only same-version macOS AiMaMi 1.0.9 static Tauri command
wrapper and `range` decode boundary for `load_change_analytics`.

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
- IDA HTTP MCP lookup: owner callsite `0x10031def4` belongs to wrapper
  function `0x10031ddb8`.
- Read-only objdump cross-check: direct branch to `load_change_analytics` at
  `0x10031def4`.

Confirmed static addresses:

| Symbol / fact | Address |
| --- | --- |
| Tauri wrapper closure | `0x10031ddb8` |
| wrapper callsite to `load_change_analytics` | `0x10031def4` |
| `load_change_analytics` owner | `0x1005f8e18` |
| command/field string cluster | `0x100f2ecf6` |
| `StateManager::try_get` | `0x10034b0fc` |
| state fallback `CommandArg::from_command` | `0x100d73fd8` |
| `range` decode `CommandArg::from_command` | `0x1003d3dec` |
| `InvokeResolver::return_result` | `0x10060755c` |
| `InvokeResolver::respond` | `0x100611484` |

## Accepted Static Facts

- `0x10031ddb8` is the same-version Tauri wrapper closure for
  `load_change_analytics`, distinct from the session wrapper `0x1003226ec`,
  sensitive-field wrapper `0x1003280cc`, and tool wrapper `0x10032964c`.
- The wrapper command cluster begins with `load_change_analytics` and uses the
  analytics field cluster at `0x100f2ecf6`.
- The wrapper resolves Tauri state through `StateManager::try_get`; if absent,
  it falls back to Tauri state `CommandArg::from_command`.
- State decode failure returns through `InvokeResolver::return_result` before
  decoding `range` and before calling `load_change_analytics`.
- The `range` argument field length is statically `5`.
- `range` decodes through `D as CommandArg<R>::from_command` at `0x1003d3dec`.
- Successful `range` decode copies the `(ptr, len, cap)`-style local tuple and
  calls `load_change_analytics` from `0x10031def4`.
- Range decode failure returns through `InvokeResolver::return_result` before
  the command owner call.
- Command owner output is copied into the response buffer and sent through
  `InvokeResolver::respond` at `0x100611484`.
- Resolved-command and invoke-message state are dropped on wrapper exit.

## Boundaries

This reducer only closes static wrapper/range topology for
`load_change_analytics`. It does not prove:

- exact runtime `load_change_analytics` request/response IPC envelope bytes;
- omitted/null/wrong-type `range` decode envelope bytes;
- source session JSONL fixtures or before-after/no-write bytes;
- runtime change grouping, range mapping, total/write/read/other counters,
  ordering, or parse leaf behavior;
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
