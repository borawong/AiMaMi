# Accounts Quota History Append Snapshot Static - AiMaMi 1.0.9

Scope: accounts-only same-version macOS AiMaMi 1.0.9 static quota history
snapshot append, write, and caller error boundary.

This reducer consumes IDA Pro MCP HTTP decompilation against the SOT universal
binary. It writes no raw/intermediate artifact, appends no `INDEX.jsonl` row,
edits no product code or rule/spec file, runs no product test, and does not
promote any gate.

## Evidence

- Binary SOT root:
  `<source-location>/source-binary/`.
- SOT executable:
  `<source-location>/source-binary/AiMaMi 1.0.9.app/Contents/MacOS/AiMaMi`.
- SOT universal SHA-256:
  `1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482`.
- IDA database:
  `<source-location>/source-binary/AiMaMi 1.0.9_ida.app/Contents/MacOS/AiMaMi.i64`.
- IDA MCP endpoint: `<local-tool-endpoint>`.
- `quota_history::append_snapshot_at`:
  `0x1001be824`.
- Caller `repository::apply_usage_result`:
  `0x1005f2798`; direct callsite `0x1005f2a84`.
- `QuotaHistoryPoint::serialize`:
  `0x1001beb3c`.
- Caller failure label string:
  `QUOTA_HISTORY_APPEND_FAILED`.

## Accepted Static Facts

- `append_snapshot_at` returns success discriminant `10` immediately when both
  primary and secondary quota result pointers are absent. In that case no
  directory creation, serialization, open, or write path is entered.
- The function derives the parent directory from the history path and attempts
  directory creation with mode `0x1ff`; directory-create failure returns an IO
  error discriminant `2`.
- Non-empty account field bytes are copied into an owned buffer before the point
  is serialized. Empty account field uses a one-byte empty-string representation.
- Primary and secondary percent values are optional. Present values are read
  from the result structures at offset `+24`; absent values are encoded as
  absent option fields.
- The point layout passed to the serializer carries:
  primary percent, secondary percent, account field bytes, and timestamp.
- Serialization uses `QuotaHistoryPoint::serialize` at `0x1001beb3c`, whose
  accepted field map is `timestamp`, `accountKey`, `primaryUsedPercent`, and
  `secondaryUsedPercent`.
- Serialization failure returns discriminant `3` and frees the temporary
  account-field buffer.
- Successful serialization opens the history path through `OpenOptions::_open`
  with create/append/write-style flags and mode `0o666` (`438` decimal).
- The writer calls `std::io::Write::write_fmt` with the serialized point string
  and newline format. Write/open failure returns IO error discriminant `2`.
- Successful write returns discriminant `10`, closes the file descriptor, and
  frees temporary serialized/account-field buffers.
- `repository::apply_usage_result` calls `append_snapshot_at` at `0x1005f2a84`
  only on the changed-usage path. When the append result is not success
  discriminant `10`, the caller records a formatted issue labeled
  `QUOTA_HISTORY_APPEND_FAILED`.

## Boundaries

This reducer closes static quota-history append/write topology. It does not
prove:

- exact runtime `append_snapshot_at` file path bytes;
- exact append-mode OpenOptions bits beyond the static flag/mode constants;
- exact runtime serialized JSON line bytes under concrete quota fixtures;
- before-after file bytes, newline behavior, append ordering, or retention
  interaction under live files;
- caller UI/toast/log surface for `QUOTA_HISTORY_APPEND_FAILED`;
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
