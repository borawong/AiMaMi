# Accounts Session Analytics Calc Range Static Reducer - AiMaMi 1.0.9

Scope: accounts-only same-version macOS AiMaMi 1.0.9 static reducer for
`compute_session_analytics` session-count math, average turn calculation,
active-day grouping, range selection, and dated series window construction.

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
  `compute_session_analytics` at `0x10054a0a4`
- Shared parser:
  `parse_all_sessions` at `0x100547988`
- Date bucket helper:
  `hashbrown::rustc_entry` at `0x1004d7fc8`
- Time helpers:
  `SystemTime::now` at `0x100d3a030`;
  `SystemTime::duration_since` at `0x100d39fe0`
- Date helper:
  `timestamp_to_date` at `0x100547710`
- Series materialization:
  `Vec<T>::from_iter` at `0x1004ad1c4`

## Accepted Static Behavior

`compute_session_analytics` at `0x10054a0a4` statically proves:

- it calls `parse_all_sessions` at `0x100547988` and propagates non-success
  parse output;
- the parsed row count is the static `totalSessions` input to the result;
- an empty parsed row set keeps total-session count, average-turn value, and
  active-day count at zero while still constructing a dated series window;
- each parsed row contributes the integer counter at row offset `+104` into the
  aggregate turn/activity total;
- `avgTurns` remains `0.0` for fewer than one parsed row and otherwise computes
  `turnTotal / totalSessions`;
- it clones the date-like row field and groups per-date session counts through
  `hashbrown::rustc_entry` at `0x1004d7fc8`;
- newly inserted date buckets initialize count `0`, then increment once for
  the current parsed row;
- `activeDays` is the number of grouped date buckets and remains `0` for an
  empty parsed row set;
- a five-byte range argument equal to `today` maps to a one-day window;
- a five-byte range argument equal to `month` maps to a thirty-day window;
- any other range length or value falls back to seven days;
- the dated series window is built from `SystemTime::now`, `duration_since`,
  and `timestamp_to_date`, stepping by 86,400 seconds per day;
- generated date rows are materialized through `Vec<T>::from_iter` at
  `0x1004ad1c4`;
- result memory stores the series vector at `a4 + 8`, series length at
  `a4 + 24`, `avgTurns` at `a4 + 32`, `totalSessions` at `a4 + 40`, and
  `activeDays` at `a4 + 44`;
- the success discriminant is written as `10`.

Serializer order remains covered by
`ACCOUNTS-SESSION-ANALYTICS-PAYLOAD-SERIALIZER-STATIC-109.md`; the offsets
above describe the backend result layout consumed by that serializer, not a
claim about JSON field order.

Result offset map:

- `+8`: series vector;
- `+24`: series length;
- `+32`: `avgTurns`;
- `+40`: `totalSessions`;
- `+44`: `activeDays`.

## Reducer Conclusion

`accountsSessionAnalyticsCalcRangeStatic` /
`sessionAnalyticsCalcRangeStatic` is accepted as a same-version static
calculation/range reducer only. It narrows total session count, average turn
calculation, active-day grouping, range selection, and dated series
construction for macOS 1.0.9.

This reducer intentionally does not assert exact runtime source rows, IPC
transport bytes, concrete series ordering under fixtures, frontend rendering,
or Windows parity.

## Still Missing Before Strict

- exact runtime `load_session_analytics` IPC request/response/error envelope
  bytes;
- source session file byte fixtures and before-after/no-write proof;
- exact parse row layout and corrupt/empty/permission error behavior from
  `parse_all_sessions` leaves;
- exact per-day grouping field normalization and ordering under real session
  data;
- runtime totalSessions/avgTurns/activeDays/series values under empty, mixed,
  and multi-day fixtures;
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
