# Accounts Quota History IO Serde Discriminant Static - AiMaMi 1.0.9

Scope: accounts-only same-version macOS AiMaMi 1.0.9 static IO/serde
discriminant and error-propagation matrix for quota history append, load, and
the `load_quota_history` owner.

This reducer consumes IDA HTTP MCP pseudocode over the current binary SOT. It
writes no raw/intermediate artifact, appends no `INDEX.jsonl` row, edits no
product code or rule/spec file, runs no product test, and does not promote any
gate.

## Evidence

- Binary SOT root:
  `<source-location>/source-binary/`.
- SOT executable:
  `<source-location>/source-binary/AiMaMi 1.0.9.app/Contents/MacOS/AiMaMi`.
- SOT universal SHA-256:
  `1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482`.
- IDA database:
  `<source-location>/source-binary/AiMaMi 1.0.9_ida.app/Contents/MacOS/AiMaMi.i64`.
- IDA HTTP MCP endpoint: `<local-tool-endpoint>`.
- `quota_history::append_snapshot_at`: `0x1001be824`.
- `quota_history::load_history`: `0x1001be170`.
- `commands::analytics::load_quota_history`: `0x1005f7dfc`.
- `repository::apply_usage_result`: `0x1005f2798`; direct
  `append_snapshot_at` callsite `0x1005f2a84`.
- `QuotaHistoryPoint::serialize`: `0x1001beb3c`.
- `serde_json::de::from_trait` in load loop: `0x10031103c`.
- `read_to_string`: `0x100d2c1f4`.
- `std::fs::write::inner`: `0x100d2c974`.

## Accepted Static Facts

### Append result discriminants

- `append_snapshot_at` returns success discriminant `10` immediately when both
  primary and secondary quota result pointers are absent; this path performs no
  directory creation, serialization, open, or write.
- Parent directory creation failure returns IO discriminant `2`.
- `QuotaHistoryPoint::serialize @ 0x1001beb3c` failure returns serde
  discriminant `3`.
- A serializer sentinel state with serialized buffer length
  `0x8000000000000000` also falls into the serde discriminant `3` return path.
- `OpenOptions::_open` failure returns IO discriminant `2`.
- `std::io::Write::write_fmt` failure returns IO discriminant `2`.
- Successful append/write returns discriminant `10`.

### Append caller behavior

- `repository::apply_usage_result @ 0x1005f2798` calls
  `append_snapshot_at` at `0x1005f2a84` on the changed-usage path.
- If the append result discriminant is not `10`, the caller formats the
  `CoreError`, records an issue label string `QUOTA_HISTORY_APPEND_FAILED`,
  drops the temporary error object, and continues into later quota store upsert
  work instead of treating the history append failure as the terminal result of
  usage application.

### Load result discriminants

- `load_history @ 0x1001be170` treats metadata failure as an empty successful
  payload: it returns discriminant `10` with the current empty vector state.
- Primary `OpenOptions::_open` failure returns IO discriminant `2`.
- The primary line iterator read error branch returns IO discriminant `2` and
  frees accepted point storage before leaving the function.
- Per-line `serde_json::de::from_trait @ 0x10031103c` parse failure is dropped
  by disposing the serde error and continuing the scan; it does not return
  discriminant `3`.
- After EOF, second `read_to_string @ 0x100d2c1f4` failure is dropped and the
  function still returns the already accepted/sorted points with discriminant
  `10`.
- Compaction `std::fs::write::inner @ 0x100d2c974` failure is dropped and does
  not change the returned accepted/sorted point payload; the function still
  returns discriminant `10`.

### Command owner behavior

- `commands::analytics::load_quota_history @ 0x1005f7dfc` recognizes
  `load_history` discriminant `10` as success and wraps the payload through
  `CoreEnvelope<T>::ok`.
- Any non-`10` `load_history` result is formatted through `CoreError` display
  and returned as an error-shaped command result.
- A poisoned state lock is also returned as an error-shaped command result with
  the static text `poisoned lock: another task failed inside`.

## Boundary

This reducer closes only the static IO/serde discriminant and propagation
matrix across quota history append/load/owner paths. It does not prove:

- exact runtime `load_quota_history` request or response IPC envelope bytes;
- exact runtime file before/after bytes, append ordering, or compaction bytes;
- final user-visible UI chart, toast, dialog, or logging behavior;
- live malformed JSON fixture behavior beyond the static parse/drop branch;
- filesystem permission behavior under executed fixtures;
- executed source archive acceptance mapping;
- independent Windows closure.

## Gate Effect

No promotion.

- `consumerStartReady`: true for this static leaf only.
- `consumerStartBlocked`: false for this static leaf only.
- `strictImplementationUse`: false / `0`.
- `readyToImplement`: false / `0`.
- `implementation_use`: false.
- `gate_accepted`: false.
- `full_leaf_100`: false.
- `moduleExitAllowed`: false.

Accounts remains the active module. This reducer is dimension evidence only
and does not allow switching to plugins, relay, system, or tray.
