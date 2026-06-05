# Accounts Change Analytics Owner Static Reducer - AiMaMi 1.0.9

Scope: accounts-only same-version macOS AiMaMi 1.0.9 static reducer for the
`load_change_analytics` command owner and `compute_change_analytics` backend
owner/body boundary. This is not the change analytics serializer reducer; the
serializer field map is already covered by
`ACCOUNTS-CHANGE-ANALYTICS-PAYLOAD-SERIALIZERS-STATIC-109.md`.

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
- Command owner:
  `codexmate_lib::commands::analytics::load_change_analytics::hbb1835b7b3f8ea99`
  at `0x1005f8e18`
- Backend owner:
  `codexmate_lib::core::session_analytics::compute_change_analytics::h7aff9295fb2fc4db`
  at `0x100549a78`
- Success envelope helper:
  `CoreEnvelope<T>::ok::h81c012e0c2709f1d` at `0x1001da404`
- Error display helper:
  `CoreError as Display::fmt::hd79541fadf72ffdf` at `0x10020c20c`

## Command Owner Boundary

`load_change_analytics` at `0x1005f8e18` is the same-version macOS command
owner for the change analytics IPC surface.

Confirmed static behavior:

- initializes/loads shared state through `OnceBox::initialize` at `0x100d7fec8`;
- locks the shared mutex through `Mutex::lock` at `0x100d3499c`;
- handles poisoned lock state by formatting the literal
  `poisoned lock: another task failed inside` and returning an error-shaped
  wrapper result;
- clones `CodexPaths` through `CodexPaths::clone` at `0x1006169b8`;
- unlocks through `Mutex::unlock` at `0x100d349b8`;
- delegates to `compute_change_analytics` at `0x100549a78` with cloned paths
  and range-like arguments;
- treats compute discriminant `10` as success and wraps payload through
  `CoreEnvelope<T>::ok` at `0x1001da404`;
- formats non-success `CoreError` through `CoreError as Display::fmt` at
  `0x10020c20c`;
- drops `CoreError`, drops `CodexPaths`, and deallocates the optional argument
  buffer through `__rust_dealloc` at `0x1000013dc`.

## Backend Owner Boundary

`compute_change_analytics` at `0x100549a78` is the same-version macOS backend
owner for change analytics computation.

Confirmed static behavior:

- calls `parse_all_sessions` at `0x100547988`; non-success parse output is
  propagated directly as the function result;
- iterates parsed session rows and reads three per-row change counters from
  offsets corresponding to total/write/read categories;
- clones date-like strings and accumulates per-date counters in a hash map
  through hashbrown entry logic at `0x1004d883c`;
- accumulates total commands, write commands, and read commands across all
  parsed sessions;
- computes `otherCommands` as total commands minus write/read commands;
- resolves the requested range length using the range-like command argument:
  `today` maps to one day, `month` maps to thirty days, and other/unknown range
  falls back to seven days;
- calls `SystemTime::now` at `0x100d3a030`, `duration_since` at `0x100d39fe0`,
  and `timestamp_to_date` at `0x100547710` to build the date series window;
- constructs the series vector through `Vec<T> as SpecFromIterNested::from_iter`
  at `0x1004a5058`;
- writes success discriminant `10` plus payload fields matching the existing
  serializer reducer: `totalCommands`, `writeCommands`, `readCommands`,
  `otherCommands`, and `series`.

## Reducer Conclusion

`accountsChangeAnalyticsOwnerStatic` / `changeAnalyticsOwnerStatic` is accepted
as a same-version static owner/body reducer only. It proves the command wrapper,
compute owner, date-bucket aggregation, range defaulting, command/write/read
counter accumulation, other-command derivation, series construction, success
envelope helper, and error display helper for the macOS 1.0.9 accounts change
analytics surface.

## Still Missing Before Strict

- exact runtime `load_change_analytics` IPC request/response/error envelope bytes;
- source session file byte fixtures and before-after/no-write proof;
- exact parse row layout and corrupt/empty/permission error behavior from
  `parse_all_sessions` leaves;
- exact per-day grouping/order under real session data;
- frontend chart/query/loading/error consumption state;
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
