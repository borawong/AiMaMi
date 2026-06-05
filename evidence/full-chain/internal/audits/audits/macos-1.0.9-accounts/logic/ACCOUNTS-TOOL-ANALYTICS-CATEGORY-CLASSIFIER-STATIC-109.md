# Accounts Tool Analytics Category Classifier Static Reducer - AiMaMi 1.0.9

Scope: accounts-only same-version macOS AiMaMi 1.0.9 static reducer for the
`searchCount` / `editCount` category classifier inside
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
- Search/category string cluster:
  `0x100f3aa56`
- List string cluster:
  `0x100f33e40`
- Read/view string cluster:
  `0x100f3e5c8`

## Accepted Static Behavior

`compute_tool_analytics` at `0x100548aa8` statically proves:

- it calls `parse_all_sessions` at `0x100547988` and propagates non-success
  parse output;
- while walking parsed tool/function-name rows it accumulates category totals
  from the same per-tool count used by the `topTools` aggregate;
- the search-like counter increments on the accepted category branch
  (`LABEL_9`) and is later written into the payload slot at result offset
  `+40`;
- the edit-like fallback counter increments on the fallback branch
  (`LABEL_70`) and is later written into the payload slot at result offset
  `+44`;
- exact small-string equality checks decode to:
  - length 6: `search`;
  - length 5: `query`;
  - length 4: `list`, `read`, or `view`;
  - length 7 overlapping check: `resolve`;
  - length 5 late check: `fetch`;
- longer or non-exact rows are also checked through static `StrSearcher`
  substring probes against the IDA string clusters at `0x100f3aa56`,
  `0x100f33e40`, and `0x100f3e5c8`;
- rows that do not enter the accepted search/list/read/view/resolve/fetch
  branch fall through to the edit-like fallback counter.

## Reducer Conclusion

`accountsToolAnalyticsCategoryClassifierStatic` /
`toolAnalyticsCategoryClassifierStatic` is accepted as a same-version static
category-classifier reducer only. It closes the static owner/body link between
parsed tool rows and the `searchCount` / `editCount` payload counters for
macOS 1.0.9.

This reducer intentionally does not assert runtime category parity for shell
commands, mixed case, aliases, concatenated command strings, or false-positive
substring edges. The string clusters are accepted as static branch evidence,
not as a complete natural-language category policy.

## Still Missing Before Strict

- exact runtime `load_tool_analytics` IPC request/response/error envelope bytes;
- source JSONL fixtures and before-after/no-write proof;
- runtime category outputs for search/query/list/read/view/resolve/fetch and
  fallback rows;
- shell-wrapper, mixed-case, alias, newline, semicolon, and substring
  false-positive edge cases;
- topTools comparator direction and tie ordering under equal counts;
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
