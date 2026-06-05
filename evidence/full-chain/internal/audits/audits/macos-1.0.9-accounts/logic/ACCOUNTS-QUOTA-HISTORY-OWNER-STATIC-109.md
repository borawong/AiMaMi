# Accounts Quota History Owner Static - AiMaMi 1.0.9

Scope: accounts-only same-version macOS AiMaMi 1.0.9 static command owner and
backend owner/body boundary for `load_quota_history`.

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
- `load_quota_history` owner:
  `0x1005f7dfc`.
- `quota_history::load_history`:
  `0x1001be170`.
- `quota_history::append_snapshot_at`:
  `0x1001be824` (nearby quota-history writer/snapshot symbol; not reduced by
  this owner reducer).
- `QuotaHistoryPoint::serialize`:
  `0x1001beb3c`.
- `QuotaHistoryPayload::serialize`:
  `0x1001bec90`.

## Accepted Static Facts

- `load_quota_history` at `0x1005f7dfc` locks the shared state, handles poisoned
  lock display text, clones `CodexPaths`, unlocks, then delegates to
  `quota_history::load_history` at `0x1001be170`.
- The owner passes a fixed history window argument of `7` days into
  `load_history`.
- The decoded wrapper argument is consumed as an optional account filter:
  when the account tuple carries the sentinel `0x8000000000000000`, the owner
  passes a null/zero account pointer; otherwise it passes `accountKey` pointer
  and length into `load_history`.
- On success, the owner recognizes the success discriminant `10`, moves the
  returned quota-history payload, and wraps it through `CoreEnvelope<T>::ok`.
- On error, the owner formats `CoreError` through the display formatter and
  returns an error envelope.
- `load_history` first metadata-checks the history path. A missing/non-readable
  metadata result returns an empty success payload rather than opening the file.
- `load_history` computes 
ow - 86400 * days` and uses it as the lower
  timestamp cutoff.
- `load_history` opens the history file and iterates lines through
  `std::io::Lines`; empty/whitespace-only lines are ignored after trimming.
- Non-empty lines are deserialized through `serde_json::de::from_trait`.
  Deserialization errors are dropped and do not abort the scan.
- Parsed rows are accepted only when timestamp is within the cutoff and, if an
  account filter was provided, the parsed row's `accountKey` length and bytes
  match the requested account field by `memcmp`.
- Accepted rows are appended into the result vector. After EOF, rows are sorted
  with stable driftsort for larger vectors and insertion sort for small vectors.
- After reading, `load_history` reads the full file back and, when the resulting
  line vector is at least `2000`, rebuilds a filtered string joined by `\n`,
  appends a trailing newline, and writes it back to the same history path. This
  is quota-history retention/compaction behavior, not a no-write read.

## Boundaries

This reducer closes the static owner/core-loader topology for
`load_quota_history`. It does not prove:

- exact runtime `load_quota_history` request/response IPC envelope bytes;
- omitted/null/wrong-type `accountKey` decode envelope bytes;
- exact quota history file path bytes and before-after write/no-write bytes;
- runtime point ordering, timestamp format, account filtering, empty/corrupt/
  permission-error behavior, or retention rewrite byte-for-byte behavior;
- deserializer field matrix for `QuotaHistoryPoint`;
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
