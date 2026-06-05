# Accounts Quota History Load History Compaction Static - AiMaMi 1.0.9

Scope: accounts-only same-version macOS AiMaMi 1.0.9 static compaction,
sorting, and retention rewrite boundary inside `quota_history::load_history`.

This reducer consumes IDA HTTP MCP pseudocode over the current binary SOT. It
writes no raw/intermediate artifact, appends no `INDEX.jsonl` row, edits no
product code or rule/spec file, runs no product test, and does not promote any
gate.

## Evidence

- Binary SOT root:
  `<source-location>/source-binary/`.
- IDA HTTP MCP endpoint: `<local-tool-endpoint>`.
- IDA database:
  `<source-location>/source-binary/AiMaMi 1.0.9_ida.app/Contents/MacOS/AiMaMi.i64`.
- Current executable:
  `<source-location>/source-binary/AiMaMi 1.0.9.app/Contents/MacOS/AiMaMi`.
- Current executable SHA-256:
  `1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482`.
- `quota_history::load_history`: `0x1001be170`.
- EOF/close/sort/compaction region: `0x1001be408` through `0x1001be6f0`.
- `read_to_string` helper: `0x100d2c1f4`.
- line-slice vector builder: `0x1004a9b48`.
- retention in-place collect helper: `0x1004caa28`.
- join helper: `0x1003a6544`.
- file write helper: `0x100d2c974`.
- stable large sort helper: `0x1004c7a64`.
- small insertion sort helper: `0x100533e18`.

## Accepted Static Facts

- `load_history` computes cutoff seconds as 
ow_seconds - 86400 * history_days`
  before reading rows.
- During the primary read loop, non-empty trimmed lines are parsed through
  `serde_json::de::from_trait @ 0x10031103c`.
- Parse failures are dropped by disposing the serde error and continuing the
  loop.
- Accepted parsed points are filtered by timestamp being greater than or equal
  to the cutoff and, when an account field filter is present, by exact
  `memcmp(accountKey, filter, filter_len)`.
- Accepted point rows are stored as 64-byte records.
- After EOF, the buffered reader allocation is freed and the file descriptor is
  closed before sorting or compaction begins.
- If the accepted point count is less than 2, no sort helper is called.
- If the accepted point count is at least 2 and less than `0x15` / 21,
  `insertion_sort_shift_left @ 0x100533e18` sorts the accepted point records.
- If the accepted point count is at least `0x15` / 21,
  `driftsort_main @ 0x1004c7a64` sorts the accepted point records.
- The compaction path then calls `read_to_string @ 0x100d2c1f4` on the same
  history path. If this second read fails, the function drops that error and
  still returns the already accepted/sorted points.
- The line-slice builder `0x1004a9b48` splits the full file content into
  non-empty line slices and strips LF or CRLF line endings from each slice.
- If the resulting line-slice count is less than `0x7d0` / 2000, compaction is
  skipped and the function returns the accepted/sorted points.
- At or above `0x7d0` / 2000 line slices, `in_place_collect @ 0x1004caa28`
  reparses each original line through `serde_json::de::from_trait`.
- The in-place retention helper drops parse failures and keeps only original
  line slices whose parsed point timestamp is greater than or equal to the same
  cutoff.
- The retained original line slices are joined with delimiter `"\n"` through
  `join_generic_copy @ 0x1003a6544`.
- Before writing, the joined buffer is extended with one additional trailing
  newline byte.
- The compacted text is written back to the same history path through
  `std::fs::write::inner @ 0x100d2c974`.
- Write failure on the compaction path is disposed and does not change the
  returned accepted/sorted point payload.

## Boundary

This reducer closes only the static sort and compaction/rewrite structure. It
does not prove:

- exact runtime `load_quota_history` request/response IPC envelope bytes;
- concrete before-after file bytes for compaction or failed compaction;
- final sort comparator direction under executed fixtures;
- exact runtime error text or logging for second-read/write failures;
- filesystem permission behavior under live files;
- frontend rendered chart state under concrete fixtures;
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
