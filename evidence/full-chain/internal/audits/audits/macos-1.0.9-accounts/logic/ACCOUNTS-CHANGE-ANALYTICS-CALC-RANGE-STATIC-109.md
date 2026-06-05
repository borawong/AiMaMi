# Accounts Change Analytics Calc Range Static Reducer - AiMaMi 1.0.9

Scope: accounts-only same-version macOS AiMaMi 1.0.9 static reducer for
`compute_change_analytics` command-counter math, `otherCommands` derivation,
range selection, and dated series window construction.

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
- Backend owner:
  `compute_change_analytics` at `0x100549a78`
- Shared parser:
  `parse_all_sessions` at `0x100547988`
- Date bucket helper:
  `hashbrown::rustc_entry` at `0x1004d883c`
- Time helpers:
  `SystemTime::now` at `0x100d3a030`;
  `SystemTime::duration_since` at `0x100d39fe0`
- Date helper:
  `timestamp_to_date` at `0x100547710`
- Series materialization:
  `Vec<T>::from_iter` at `0x1004a5058`

## Accepted Static Behavior

`compute_change_analytics` at `0x100549a78` statically proves:

- it calls `parse_all_sessions` at `0x100547988` and propagates non-success
  parse output;
- each parsed row contributes three command counters from row offsets
  corresponding to total, write, and read categories;
- it clones the date-like row field and groups per-date counters through
  `hashbrown::rustc_entry` at `0x1004d883c`;
- aggregate totals are accumulated separately as total commands, write
  commands, and read commands;
- result offset `+32` receives total commands;
- result offset `+36` receives write commands;
- result offset `+40` receives read commands;
- result offset `+44` receives `otherCommands`, computed as
  `totalCommands - (writeCommands + readCommands)`;
- a five-byte range argument equal to `today` maps to a one-day window;
- a five-byte range argument equal to `month` maps to a thirty-day window;
- any other range length or value falls back to seven days;
- the dated series window is built from `SystemTime::now`, `duration_since`,
  and `timestamp_to_date`, stepping by 86,400 seconds per day;
- generated date rows are materialized through `Vec<T>::from_iter` at
  `0x1004a5058`;
- the success discriminant is written as `10`.

## Reducer Conclusion

`accountsChangeAnalyticsCalcRangeStatic` /
`changeAnalyticsCalcRangeStatic` is accepted as a same-version static
calculation/range reducer only. It narrows command-counter accumulation,
`otherCommands` derivation, range selection, and dated series construction for
macOS 1.0.9.

This reducer intentionally does not assert exact runtime source rows, IPC
transport bytes, concrete chart ordering under fixtures, frontend rendering, or
Windows parity.

## Still Missing Before Strict

- exact runtime `load_change_analytics` IPC request/response/error envelope
  bytes;
- source session file byte fixtures and before-after/no-write proof;
- exact parse row layout and corrupt/empty/permission error behavior from
  `parse_all_sessions` leaves;
- runtime total/write/read/other and per-day values under empty, mixed, and
  multi-day fixtures;
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
