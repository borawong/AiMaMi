# Accounts Tool Analytics TopTools Static Reducer - AiMaMi 1.0.9

Scope: accounts-only same-version macOS AiMaMi 1.0.9 static reducer for the
`topTools` aggregation, sort-call, and maximum output boundary inside
`compute_tool_analytics`.

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
  `compute_tool_analytics` at `0x100548aa8`
- Shared parser:
  `parse_all_sessions` at `0x100547988`
- Vector materialization:
  `Vec<T>::from_iter` at `0x1004a30e4`
- Large-vector sort:
  `core::slice::sort::stable::driftsort_main` at `0x1004c6f70`
- Small-vector sort:
  `core::slice::sort::shared::smallsort::insertion_sort_shift_left` at
  `0x1005343bc`

## Accepted Static Behavior

`compute_tool_analytics` at `0x100548aa8` statically proves:

- it calls `parse_all_sessions` at `0x100547988` and propagates non-success
  parse output;
- for each parsed session row, it walks the row's tool/function-name map and
  clones each tool/path string field;
- it builds an in-memory hash map keyed by that cloned tool/path string;
- existing keys add the parsed count into the stored aggregate;
- new keys insert a zero counter and then add the parsed count;
- it separately accumulates search-like and edit-like totals while walking the
  parsed rows;
- after aggregation, it materializes the hash map into a vector through
  `Vec<T>::from_iter` at `0x1004a30e4`;
- vectors with at least 21 rows use stable driftsort at `0x1004c6f70`;
- vectors with 2 through 20 rows use insertion sort at `0x1005343bc`;
- vectors with 0 or 1 rows skip sort;
- after sort, rows beyond 10 entries are dropped/deallocated: the code sets the
  retained end pointer to `base + 320`, and each topTools row is 32 bytes;
- the resulting payload writes retained `topTools` count, total call count,
  distinct count, search count, and edit count into the success result.

## Reducer Conclusion

`accountsToolAnalyticsTopToolsStatic` / `toolAnalyticsTopToolsStatic` is
accepted as a same-version static aggregation and max-output reducer only. It
proves the aggregate source, the sort-call split, and the maximum 10-entry
`topTools` output boundary for macOS 1.0.9.

The exact comparator direction and runtime tie behavior are not asserted here.
Those remain strict blockers until accepted runtime fixtures or stronger
comparator evidence close them.

## Still Missing Before Strict

- exact runtime `load_tool_analytics` IPC request/response/error envelope bytes;
- source JSONL fixtures and before-after/no-write proof;
- exact comparator direction and tie ordering under equal counts;
- path normalization under real session data;
- runtime command strings that exercise category and topTools edge cases;
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
