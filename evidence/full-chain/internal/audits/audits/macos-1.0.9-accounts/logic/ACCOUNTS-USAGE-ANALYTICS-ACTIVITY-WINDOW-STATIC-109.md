# Accounts Usage Analytics Activity Window Static Reducer - AiMaMi 1.0.9

Scope: accounts-only same-version macOS AiMaMi 1.0.9 static reducer for
`compute_usage_analytics` source scanning, date buckets, today/session summary,
365-day `dailyActivity`, and `activityLevel` bucketing.

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
  `compute_usage_analytics` at `0x1005f699c`
- Directory visitor:
  `analytics::visit_dir` at `0x1005f79f8`
- Date string helper:
  `timestamp_to_date_string` at `0x1005f778c`
- Date bucket helper:
  `hashbrown::rustc_entry` at `0x1004d89f4`
- Time helpers:
  `SystemTime::now` at `0x100d3a030`;
  `SystemTime::duration_since` at `0x100d39fe0`
- Large sort helper for timestamp rows:
  `core::slice::sort::stable::driftsort_main` at `0x1004c72b8`

## Accepted Static Behavior

`compute_usage_analytics` at `0x1005f699c` statically proves:

- it metadata-checks two `CodexPaths` directory members (`a1[16]/a1[17]` and
  `a1[19]/a1[20]`);
- each existing directory is scanned through `analytics::visit_dir` at
  `0x1005f79f8`;
- visited rows are grouped by `timestamp_to_date_string` output through
  `hashbrown::rustc_entry` at `0x1004d89f4`;
- current-day lookup is derived from `SystemTime::now`, `duration_since`, and
  `timestamp_to_date_string`;
- missing current-day bucket yields zero today summary values;
- present current-day bucket sums row counters and extracts timestamps for
  active-minute estimation;
- timestamp rows are sorted before active-minute estimation; vectors with at
  least 21 entries use stable driftsort at `0x1004c72b8`, smaller vectors use
  an inline insertion-sort path, and a single timestamp skips sort;
- active-minute estimation increments by minute gaps and starts a new segment
  when adjacent timestamps differ by at least 301 seconds;
- final active-minute estimate is capped at 1,440 minutes;
- total session count is computed from visited rows;
- total file size is computed by summing row size counters;
- active day count is the populated date-bucket count;
- average sessions per active day is `totalSessions / activeDays` when
  `activeDays >= 1`, otherwise `0.0`;
- most-active date is selected from the date bucket with the greatest session
  count; no bucket yields a null/absent sentinel and count zero;
- the daily activity vector allocates 14,600 bytes, i.e. 365 rows at 40 bytes
  each;
- no-bucket daily activity still backfills 365 zero rows from
  
ow - 31,449,600` seconds and steps by 86,400 seconds per row;
- populated daily activity uses the same 365-day window, looking up each date
  string in the bucket map;
- daily row layout writes date string pointer/length, total file size, session
  count, and activity level;
- non-empty activity levels use
  `floor(log(sessionCount + 1) * 4.0 / log(maxSessionCount + 1))`, clamped via
  `fmax(..., 1.0)` and `fmin(..., 4.0)`;
- empty or absent bucket rows emit `activityLevel=0`;
- success output writes discriminant `0` and payload fields matching the
  existing serializer reducer.

## Reducer Conclusion

`accountsUsageAnalyticsActivityWindowStatic` /
`usageAnalyticsActivityWindowStatic` is accepted as a same-version static
activity-window reducer only. It narrows source root selection, date-bucket
construction, today summary, sessionStats calculation, 365-day activity
backfill, and log-scaled activity-level bucketing for macOS 1.0.9.

This reducer intentionally does not assert exact runtime directory contents,
visited row bytes, IPC transport bytes, concrete chart ordering under fixtures,
frontend rendering, or Windows parity.

## Still Missing Before Strict

- exact runtime `load_usage_analytics` IPC request/response/error envelope
  bytes;
- source directory byte fixtures and before-after/no-write proof;
- exact visited row layout and corrupt/empty/permission error behavior from
  `visit_dir` leaves;
- runtime today/sessionStats/dailyActivity values under empty, sparse,
  multi-day, and high-volume fixtures;
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
