# Accounts Usage Analytics Visit Dir Source Static Reducer - AiMaMi 1.0.9

Scope: accounts-only same-version macOS AiMaMi 1.0.9 static reducer for
`analytics::visit_dir` source discovery, filename filtering, fallback behavior,
and visited-row layout used by `load_usage_analytics`.

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
- Source visitor:
  `analytics::visit_dir` at `0x1005f79f8`
- Usage analytics consumer:
  `compute_usage_analytics` at `0x1005f699c`
- Directory read:
  `std::sys::fs::read_dir` at `0x100d32404`
- Path helpers:
  `Path::is_dir` at `0x100d38e48`; `Path::file_name` at `0x100d3930c`
- UTF-8 conversion:
  `core::str::from_utf8` at `0x100d6f7d4`
- Metadata helpers:
  `DirEntry::metadata` at `0x100d2cb44`;
  `Metadata::modified` at `0x100d2cc7c`
- Time helper:
  `SystemTime::duration_since` at `0x100d39fe0`

## Accepted Static Behavior

`analytics::visit_dir` at `0x1005f79f8` statically proves:

- it calls `std::sys::fs::read_dir` and returns after dropping the `ReadDir`
  error result when the directory cannot be opened;
- it iterates `ReadDir` through the flattened iterator path, so entry errors
  are skipped rather than surfaced as usage analytics command errors;
- it calls `DirEntry::path` for each accepted entry;
- if `Path::is_dir` is true, it recursively calls `visit_dir` with the child
  path and continues after cleanup;
- non-directory entries must have a `file_name`;
- file names that fail `from_utf8` are skipped;
- file names shorter than eight bytes are skipped;
- the accepted prefix check is `rollout-`;
- the accepted suffix check is `.jsonl`;
- non-matching file names are skipped before metadata reads;
- metadata errors produce a visited row with file size fallback `0`;
- successful metadata reads take the file size from the metadata payload;
- modified-time errors and `duration_since` errors produce timestamp fallback
  `0`;
- successful modified-time conversion stores seconds since epoch as the row
  timestamp;
- vector growth uses `RawVec::grow_one` when capacity is full;
- each pushed row is 16 bytes.

Visited row layout:

- `+0`: file size;
- `+8`: modified timestamp seconds since epoch.

`compute_usage_analytics` at `0x1005f699c` consumes this row shape: offset
`+0` contributes source size totals, and offset `+8` feeds date bucketing,
today lookup, timestamp sorting, and active-minute estimation.

## Reducer Conclusion

`accountsUsageAnalyticsVisitDirSourceStatic` /
`usageAnalyticsVisitDirSourceStatic` is accepted as a same-version static
source/row-layout reducer only. It narrows source discovery and visited-row
semantics for macOS 1.0.9 usage analytics.

This reducer intentionally does not assert exact runtime directory bytes,
permission error envelopes, IPC transport bytes, frontend rendering, executed
acceptance, or Windows parity.

## Still Missing Before Strict

- exact runtime `load_usage_analytics` IPC request/response/error envelope
  bytes;
- source directory byte fixtures and before-after/no-write proof;
- runtime empty/sparse/multi-day/high-volume fixture values and ordering;
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
