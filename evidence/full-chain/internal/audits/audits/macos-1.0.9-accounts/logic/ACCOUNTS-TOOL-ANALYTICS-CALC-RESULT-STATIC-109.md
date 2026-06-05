# Accounts Tool Analytics Calc Result Static - AiMaMi 1.0.9

Scope: accounts-only same-version macOS AiMaMi 1.0.9 static reducer for
`load_tool_analytics` result construction inside `compute_tool_analytics`.

This reducer creates no raw evidence, appends no `INDEX.jsonl` row, edits no
regulation, edits no product code, runs no product test, and promotes no gate.

## Evidence

- Binary SOT root: `<source-location>/source-binary/`.
- SOT executable:
  `<source-location>/source-binary/AiMaMi 1.0.9.app/Contents/MacOS/AiMaMi`.
- SOT universal SHA-256:
  `1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482`.
- IDA database:
  `<source-location>/source-binary/AiMaMi 1.0.9_ida.app/Contents/MacOS/AiMaMi.i64`.
- IDA MCP endpoint: `<local-tool-endpoint>`.

Confirmed static addresses:

| Symbol / fact | Address |
| --- | --- |
| `compute_tool_analytics` | `0x100548aa8` |
| `parse_all_sessions` | `0x100547988` |
| `String::clone` | `0x100d62688` |
| `BuildHasher::hash_one` | `0x1002ecd78` |
| `memcmp` | `0x100db530c` |
| `RawTable::reserve_rehash` | `0x100d7ab20` |
| `Vec<T>::from_iter` for topTools rows | `0x1004a30e4` |
| `driftsort_main` | `0x1004c6f70` |
| `insertion_sort_shift_left` | `0x1005343bc` |

## Accepted Static Facts

- `compute_tool_analytics` calls `parse_all_sessions` at `0x100548ae0`.
- Non-success parse output is propagated into the caller result buffer: parse
  payload regions are copied to `a4 +32/+48/+64/+80`, header data to
  `a4 +8/+24`, and the parse discriminant to `a4 +0`.
- On parse success with no parsed rows, the function initializes
  `distinctCount=0`, `searchCount=0`, `editCount=0`, points at the empty
  hash-table sentinel, and later emits `totalCalls=0`.
- Non-empty parsed rows use row offset `+48` as the per-row tool count; zero
  counts are skipped before map aggregation.
- Tool/function keys are read from the row-owned table at row offset `+24`,
  cloned with `String::clone`, hashed with `BuildHasher::hash_one`, matched
  with `memcmp`, and inserted through `RawTable::reserve_rehash` when needed.
- New map entries initialize their count slot to zero and then add the parsed
  row count; existing map entries add the parsed row count directly.
- The search-like counter later written at result offset `+40` and the
  edit-like counter later written at result offset `+44` consume the same
  parsed row counts as the map aggregation. Exact classifier details remain
  owned by `ACCOUNTS-TOOL-ANALYTICS-CATEGORY-CLASSIFIER-STATIC-109.md`.
- After aggregation, the function iterates hash map entries to compute
  `totalCalls` by summing aggregated counts and uses the map entry count as
  `distinctCount`.
- Top tool rows are materialized through `Vec<T>::from_iter` at `0x1004a30e4`.
  Sort and truncate behavior remains owned by
  `ACCOUNTS-TOOL-ANALYTICS-TOPTOOLS-STATIC-109.md`.

## Result Layout

The successful result discriminant is `10`. The result buffer writes:

| Offset | Static meaning |
| --- | --- |
| `+8/+16/+24` | topTools vector tuple; length is written at `+24` |
| `+32` | `totalCalls` |
| `+36` | `distinctCount` |
| `+40` | `searchCount` |
| `+44` | `editCount` |

Serializer cross-check remains consistent with
`ToolAnalyticsPayload::serialize @ 0x1001d4b48` and the visible fields
`totalCalls`, `distinctCount`, `searchCount`, `editCount`, and `topTools`
already reduced in `ACCOUNTS-TOOL-ANALYTICS-PAYLOAD-SERIALIZERS-STATIC-109.md`.

## Boundaries

This reducer only closes static calc/result-slot evidence for
`load_tool_analytics`. It does not prove:

- exact runtime `load_tool_analytics` request/response IPC envelope bytes;
- source session JSONL fixtures or before-after/no-write bytes;
- parse leaf corrupt/empty/permission error behavior;
- runtime topTools ordering, comparator direction, tie behavior, path
  normalization, or category edge cases;
- frontend chart/query/loading/error consumption state;
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
