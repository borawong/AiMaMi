# Accounts Change Analytics Series Bucket Static Reducer - AiMaMi 1.0.9

Scope: accounts-only same-version macOS AiMaMi 1.0.9 static reducer for
`load_change_analytics` per-day bucket lookup and default-zero
`ChangeDaySeries` materialization.

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
- Per-date bucket insertion/update:
  `hashbrown::rustc_entry` at `0x1004d883c`
- Date helper:
  `timestamp_to_date` at `0x100547710`
- Series materializer:
  `Vec<T>::from_iter` at `0x1004a5058`
- Bucket lookup helper:
  `BuildHasher::hash_one` at `0x1002ecd78`
- Date equality helper:
  `memcmp` at `0x100db530c`
- Output date clone:
  `String::clone` at `0x100d62688`

## Accepted Static Behavior

`compute_change_analytics` and its `Vec<T>::from_iter` materializer statically
prove:

- parsed session rows are grouped by cloned date-like string keys before
  series materialization;
- per-date bucket update uses `hashbrown::rustc_entry` at `0x1004d883c`;
- parsed row counters contribute total/commands, write, and read counters into
  the per-date bucket;
- newly inserted buckets initialize the packed total/write region and read
  region to zero before accumulation;
- generated date-window rows are passed to `Vec<T>::from_iter` at
  `0x1004a5058`;
- the materializer allocates `40` bytes per output series item;
- for each generated date row, if the bucket map is non-empty, it hashes the
  date field through `BuildHasher::hash_one` at `0x1002ecd78`;
- candidate bucket keys are matched by date string length and `memcmp` at
  `0x100db530c`;
- a bucket hit copies the packed total/write counters and read counter into
  the output row;
- an empty bucket map or lookup miss writes zero counters;
- the output date string is cloned through `String::clone` at `0x100d62688`;
- output rows are written in generated date-window order.

Change day series item layout:

- `+0`: cloned `date` string;
- `+24`: packed `commands` / `writeOps` region;
- `+32`: `readOps` region.

The field names are independently covered by
`ACCOUNTS-CHANGE-ANALYTICS-PAYLOAD-SERIALIZERS-STATIC-109.md`; this reducer
narrows bucket lookup/default-zero and materialized row layout only.

## Reducer Conclusion

`accountsChangeAnalyticsSeriesBucketStatic` /
`changeAnalyticsSeriesBucketStatic` is accepted as a same-version static series
bucket reducer only. It narrows how change analytics per-day buckets become
`ChangeDaySeries` rows for macOS 1.0.9.

This reducer intentionally does not assert exact runtime session JSONL bytes,
runtime date normalization/order under fixtures, IPC transport bytes, frontend
rendering, executed acceptance, or Windows parity.

## Still Missing Before Strict

- exact runtime `load_change_analytics` IPC request/response/error envelope
  bytes;
- source session JSONL byte fixtures and before-after/no-write proof;
- corrupt/empty/permission fixture behavior from `parse_all_sessions` leaves;
- runtime date ordering, bucket hit/miss, and multi-day value fixtures;
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
