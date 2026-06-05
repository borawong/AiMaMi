# Accounts Session Analytics Command Wrapper Range Static Reducer - AiMaMi 1.0.9

Scope: accounts-only same-version macOS AiMaMi 1.0.9 static reducer for the
Tauri command wrapper that decodes `load_session_analytics` state and the
`range` command argument before calling the analytics command owner.

This reducer consumes IDA Pro MCP HTTP decompilation against the SOT binary
under `<source-location>/source-binary/`. It writes
no raw/intermediate artifact, appends no `INDEX.jsonl` row, edits no product
code or rule/spec file, runs no product test, and does not promote any gate.

## Evidence

- SOT binary root:
  `<source-location>/source-binary/`
- IDA active endpoint:
  `<local-tool-endpoint>`
- SOT executable:
  `<source-location>/source-binary/AiMaMi 1.0.9.app/Contents/MacOS/AiMaMi`
- SOT executable SHA-256:
  `1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482`
- IDA database:
  `<source-location>/source-binary/AiMaMi 1.0.9_ida.app/Contents/MacOS/AiMaMi.i64`
- Tauri wrapper:
  `codexmate_lib::run::{{closure}}::{{closure}}` at `0x1003226ec`
- Command owner callsite:
  `load_session_analytics` call at `0x100322828`
- Command owner:
  `commands::analytics::load_session_analytics` at `0x1005f91bc`
- Command/field string cluster:
  `0x100f2ecf6`
- State lookup:
  `StateManager::try_get` at `0x10034b0fc`
- Tauri state fallback decode:
  `State<T> as CommandArg<R>::from_command::{closure}` at `0x100d73fd8`
- `range` argument decode:
  `D as CommandArg<R>::from_command` at `0x1003d3dec`
- Decode-error return path:
  `InvokeResolver::return_result` at `0x10060755c`
- Response path:
  `InvokeResolver::respond` at `0x1006124c8`

## Accepted Static Behavior

The wrapper at `0x1003226ec` statically proves:

- it is in the analytics command cluster containing `load_session_analytics`,
  `load_token_analytics`, `load_tool_analytics`, and `load_change_analytics`;
- the command/field string cluster at `0x100f2ecf6` also contains argument keys
  including `range`;
- it first tries to recover Tauri state through `StateManager::try_get` at
  `0x10034b0fc`;
- when the direct state lookup is absent, it calls the Tauri state
  `CommandArg::from_command` fallback at `0x100d73fd8`;
- state decode failure copies the decoded error shape into the resolver payload
  and returns through `InvokeResolver::return_result` at `0x10060755c`;
- after state success, the wrapper prepares the argument field pointer for
  `range` and sets the field length to `5`;
- it calls `D as CommandArg<R>::from_command` at `0x1003d3dec` for the `range`
  argument;
- successful `range` decode copies the decoded argument tuple from the local
  decode buffer into `(ptr, len, cap)`-style local storage before command call;
- it calls `commands::analytics::load_session_analytics` at `0x1005f91bc`
  from callsite `0x100322828`;
- command decode failure for `range` returns through
  `InvokeResolver::return_result` at `0x10060755c` before the command owner is
  called;
- command owner output is shaped for `InvokeResolver::respond` at
  `0x1006124c8`;
- the wrapper drops resolved-command and invoke-message state on exit.

## Reducer Conclusion

`accountsSessionAnalyticsCommandWrapperRangeStatic` /
`sessionAnalyticsCommandWrapperRangeStatic` is accepted as a same-version
static wrapper/range-decode reducer only. It narrows the Tauri wrapper topology
for `load_session_analytics` and proves the static `range` field decode path
before the backend owner.

This reducer intentionally does not assert runtime serde bytes, omitted/null/
wrong-type decode envelopes, exact IPC transport bytes, frontend rendering,
executed acceptance, or Windows parity.

## Still Missing Before Strict

- exact runtime `load_session_analytics` IPC request/response/error envelope
  bytes;
- omitted/null/wrong-type `range` decode envelope bytes;
- source session file byte fixtures and before-after/no-write proof;
- exact per-fixture grouping/order/value behavior;
- exact frontend chart/query/loading/error consumption state;
- executed source archive acceptance mapping;
- independent Windows 1.0.9 closure.

## Gate Effect

- `consumerStartReady`: unchanged.
- `consumerStartBlocked`: unchanged.
- `strictImplementationUse`: false / `0`.
- `readyToImplement`: false / `0`.
- `implementation_use`: false.
- `gate_accepted`: false.
- `full_leaf_100`: false.
- `moduleExitAllowed`: false.

Accounts remains the active locked module. This reducer does not permit
switching to plugins, relay, system, or tray.
