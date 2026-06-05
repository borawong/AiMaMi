# Accounts Usage Analytics Owner Static Reducer - AiMaMi 1.0.9

Scope: accounts-only same-version macOS AiMaMi 1.0.9 static reducer for the
`load_usage_analytics` command owner and `compute_usage_analytics` backend
owner/body boundary. This is not the usage analytics serializer reducer; the
serializer field map is already covered by
`ACCOUNTS-USAGE-ANALYTICS-PAYLOAD-SERIALIZERS-STATIC-109.md`.

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
  `codexmate_lib::commands::analytics::load_usage_analytics::he500d63527a57377`
  at `0x1005f894c`
- Backend owner:
  `codexmate_lib::core::analytics::compute_usage_analytics::h5a9a32c1a445bfdc`
  at `0x1005f699c`
- Success envelope helper:
  `CoreEnvelope<T>::ok::h14e082b3d3aesource archive52` at `0x1001d9230`
- Error display helper:
  `CoreError as Display::fmt::hd79541fadf72ffdf` at `0x10020c20c`

## Command Owner Boundary

`load_usage_analytics` at `0x1005f894c` is the same-version macOS command owner
for the usage analytics IPC surface.

Confirmed static behavior:

- initializes/loads shared state through `OnceBox::initialize` at `0x100d7fec8`;
- locks the shared mutex through `Mutex::lock` at `0x100d3499c`;
- handles poisoned lock state by formatting the literal
  `poisoned lock: another task failed inside` and returning an error-shaped
  wrapper result;
- clones `CodexPaths` through `CodexPaths::clone` at `0x1006169b8`;
- unlocks through `Mutex::unlock` at `0x100d349b8`;
- delegates the cloned paths to `compute_usage_analytics` at `0x1005f699c`;
- formats non-success `CoreError` through `CoreError as Display::fmt` at
  `0x10020c20c`;
- on successful compute output, reacquires the shared state lock and calls
  `CodexPaths::ensure_directories` at `0x1005267f8`;
- when directory validation succeeds, calls `bootstrap_cache::update` at
  `0x1001bf67c` before final success wrapping;
- wraps success through `CoreEnvelope<T>::ok` at `0x1001d9230`;
- drops `CoreError`, drops `CodexPaths`, and unlocks state before returning.

## Backend Owner Boundary

`compute_usage_analytics` at `0x1005f699c` is the same-version macOS backend
owner for usage analytics computation.

Confirmed static behavior:

- checks metadata for two `CodexPaths` directory members and calls
  `analytics::visit_dir` at `0x1005f79f8` for each existing directory;
- stores visited rows in an in-memory vector and groups them by date string
  using `timestamp_to_date_string` at `0x1005f778c`;
- uses hashbrown map entry logic at `0x1004d89f4`, random hash keys, and
  `BuildHasher::hash_one` at `0x1002ecd78` for date-bucket aggregation;
- computes the current date with `SystemTime::now` at `0x100d3a030` and
  `duration_since` at `0x100d39fe0`;
- locates today's bucket if present and computes today's session/file-size and
  active-minute estimate values from bucket rows;
- computes total sessions, total file size, active day count, average sessions
  per active day, most active date, and most active count;
- allocates a 365-row daily activity vector and backfills missing days with zero
  activity rows;
- for populated days, computes total file size, session count, and an activity
  level bucket using logarithmic scaling bounded to a small integer range;
- writes success output with payload fields matching the existing serializer
  reducer: `today`, `sessionStats`, and `dailyActivity`.

## Reducer Conclusion

`accountsUsageAnalyticsOwnerStatic` / `usageAnalyticsOwnerStatic` is accepted as
a same-version static owner/body reducer only. It proves the command wrapper,
compute owner, directory scan entrypoints, date-bucket aggregation, 365-day
activity series construction, bootstrap cache side call on success, success
envelope helper, and error display helper for the macOS 1.0.9 accounts usage
analytics surface.

## Still Missing Before Strict

- exact runtime `load_usage_analytics` IPC request/response/error envelope bytes;
- source directory byte fixtures and before-after/no-write proof;
- exact visited row layout and corrupt/empty/permission error behavior from
  `visit_dir` leaves;
- exact daily ordering, active-minute estimate, and activity-level behavior
  under real session data;
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
