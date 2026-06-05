# Accounts Tool Analytics Owner Static Reducer - AiMaMi 1.0.9

Scope: accounts-only same-version macOS AiMaMi 1.0.9 static reducer for the
`load_tool_analytics` command owner and `compute_tool_analytics` backend
owner/body boundary. This is not the tool analytics serializer reducer; the
serializer field map is already covered by
`ACCOUNTS-TOOL-ANALYTICS-PAYLOAD-SERIALIZERS-STATIC-109.md`.

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
  `codexmate_lib::commands::analytics::load_tool_analytics::hc90a8be8567a7c46`
  at `0x1005f81c8`
- Backend owner:
  `codexmate_lib::core::session_analytics::compute_tool_analytics::h2230710da21e2b74`
  at `0x100548aa8`
- Success envelope helper:
  `CoreEnvelope<T>::ok::hddc087a15db88728` at `0x1001dadb4`
- Error display helper:
  `CoreError as Display::fmt::hd79541fadf72ffdf` at `0x10020c20c`

## Command Owner Boundary

`load_tool_analytics` at `0x1005f81c8` is the same-version macOS command owner
for the tool analytics IPC surface.

Confirmed static behavior:

- initializes/loads shared state through `OnceBox::initialize` at `0x100d7fec8`;
- locks the shared mutex through `Mutex::lock` at `0x100d3499c`;
- handles poisoned lock state by formatting the literal
  `poisoned lock: another task failed inside` and returning an error-shaped
  wrapper result;
- clones `CodexPaths` through `CodexPaths::clone` at `0x1006169b8`;
- unlocks through `Mutex::unlock` at `0x100d349b8`;
- delegates to `compute_tool_analytics` at `0x100548aa8` with cloned paths and
  range-like arguments;
- treats compute discriminant `10` as success and wraps payload through
  `CoreEnvelope<T>::ok` at `0x1001dadb4`;
- formats non-success `CoreError` through `CoreError as Display::fmt` at
  `0x10020c20c`;
- drops `CoreError`, drops `CodexPaths`, and deallocates the optional argument
  buffer through `__rust_dealloc` at `0x1000013dc`.

## Backend Owner Boundary

`compute_tool_analytics` at `0x100548aa8` is the same-version macOS backend
owner for tool analytics computation.

Confirmed static behavior:

- calls `parse_all_sessions` at `0x100547988`; non-success parse output is
  propagated directly as the function result;
- iterates parsed session rows and nested per-session tool/call maps;
- clones tool path/name strings and inserts or updates counts in a hash map
  using `BuildHasher::hash_one` at `0x1002ecd78`, `memcmp`, and hashbrown raw
  table insertion/reserve helpers;
- accumulates total call count, distinct tool count, search-like count, and
  edit/read/other-like count buckets;
- classifies search/read/edit buckets through static string-pattern checks,
  including `search`, `query`, `resolve`, `fetch`, `list`, `read`, `view`,
  `sed`, `tee`, `cat`, and related command substrings;
- builds the `topTools` vector through
  `Vec<T> as SpecFromIterNested::from_iter` at `0x1004a30e4`;
- sorts the vector with stable driftsort at `0x1004c6f70` for larger vectors
  or insertion-sort shift-left at `0x1005343bc` for small vectors;
- writes success discriminant `10` plus payload fields for total calls,
  distinct count, search count, edit count, and sorted top tool rows.

The resulting static DTO value is structurally consistent with the existing
serializer reducer for fields:

```json
{
  "totalCalls": "<number>",
  "distinctCount": "<number>",
  "searchCount": "<number>",
  "editCount": "<number>",
  "topTools": [
    {
      "path": "<string>",
      "count": "<number>"
    }
  ]
}
```

## Reducer Conclusion

`accountsToolAnalyticsOwnerStatic` / `toolAnalyticsOwnerStatic` is accepted as
a same-version static owner/body reducer only. It proves the command wrapper,
compute owner, high-level tool-count aggregation, static string category
classifier, top tool vector construction/sort, success envelope helper, and
error display helper for the macOS 1.0.9 accounts tool analytics surface.

## Still Missing Before Strict

- exact runtime `load_tool_analytics` IPC request/response/error envelope bytes;
- source session file byte fixtures and before-after/no-write proof;
- exact parse row layout and corrupt/empty/permission error behavior from
  `parse_all_sessions` leaves;
- exact category classifier normalization and ordering under real session data;
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
