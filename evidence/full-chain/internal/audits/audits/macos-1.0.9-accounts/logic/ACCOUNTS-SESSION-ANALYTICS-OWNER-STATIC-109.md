# Accounts Session Analytics Owner Static Reducer - AiMaMi 1.0.9

Scope: accounts-only same-version macOS AiMaMi 1.0.9 static reducer for the
`load_session_analytics` command owner and `compute_session_analytics` backend
owner/body boundary. This is not the session analytics serializer reducer; the
serializer field map is already covered by
`ACCOUNTS-SESSION-ANALYTICS-PAYLOAD-SERIALIZER-STATIC-109.md`.

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
- Command owner:
  `codexmate_lib::commands::analytics::load_session_analytics::h6d9f63c3e1990fcd`
  at `0x1005f91bc`
- Backend owner:
  `codexmate_lib::core::session_analytics::compute_session_analytics::h2c8d9227c789aa3c`
  at `0x10054a0a4`
- Session parser:
  `codexmate_lib::core::session_analytics::parse_all_sessions::h6a095e92c7badce0`
  at `0x100547988`
- Success envelope helper:
  `CoreEnvelope<T>::ok::hddc087a15db88728` at `0x1001dadb4`
- Error display helper:
  `CoreError as Display::fmt::hd79541fadf72ffdf` at `0x10020c20c`

## Command Owner Boundary

`load_session_analytics` at `0x1005f91bc` is the same-version macOS command
owner for the session analytics IPC surface.

Confirmed static behavior:

- initializes/loads the shared state through `OnceBox::initialize` at
  `0x100d7fec8` when the state pointer is not initialized;
- locks the shared mutex through `Mutex::lock` at `0x100d3499c`;
- handles a poisoned lock by formatting the literal
  `poisoned lock: another task failed inside` and returning an error-shaped
  wrapper result;
- clones `CodexPaths` through `CodexPaths::clone` at `0x1006169b8`;
- unlocks the mutex through `Mutex::unlock` at `0x100d349b8`;
- passes the cloned paths plus the range-like input arguments into
  `compute_session_analytics` at `0x10054a0a4`;
- treats the compute result discriminant `10` as success and wraps the payload
  through `CoreEnvelope<T>::ok` at `0x1001dadb4`;
- formats non-success `CoreError` through `CoreError as Display::fmt` at
  `0x10020c20c`;
- drops `CoreError`, drops `CodexPaths`, and deallocates the optional argument
  buffer before returning.

## Backend Owner Boundary

`compute_session_analytics` at `0x10054a0a4` is the same-version macOS backend
owner for session analytics computation.

Confirmed static behavior:

- calls `parse_all_sessions` at `0x100547988`; non-success parse output is
  propagated directly as the function result;
- iterates parsed session rows and accumulates a total turn/session activity
  counter from row fields;
- computes `avgTurns` as the accumulated counter divided by parsed session
  count, with empty input yielding zero;
- groups parsed rows by cloned date-like string through hashbrown map entry
  logic at `0x1004d7fc8`;
- records the number of active date buckets as `activeDays`;
- resolves the requested range length using the range-like command argument:
  `today` maps to one day, `month` maps to thirty days, and other/unknown or
  non-five-byte input falls back to seven days;
- calls `SystemTime::now` at `0x100d3a030`, `duration_since` at `0x100d39fe0`,
  and `timestamp_to_date` at `0x100547710` to build the date series window;
- allocates the series vector, maps day rows through
  `Vec<T> as SpecFromIterNested::from_iter` at `0x1004ad1c4`, and writes the
  success result with discriminant `10`.

The resulting static DTO value is structurally consistent with the existing
serializer reducer for fields:

```json
{
  "totalSessions": "<number>",
  "avgTurns": "<number>",
  "activeDays": "<number>",
  "series": [
    {
      "date": "<string>",
      "sessions": "<number>"
    }
  ]
}
```

`sessions` is the implementation-facing meaning inferred from the owner body;
the exact runtime nested series field names/bytes remain unproven by this
static owner reducer and stay in the strict blocker list below.

## Reducer Conclusion

`accountsSessionAnalyticsOwnerStatic` / `sessionAnalyticsOwnerStatic` is
accepted as a same-version static owner/body reducer only. It proves the
command wrapper, compute owner, parser handoff, range defaulting, active-day
bucket aggregation, date series construction, success envelope helper, and
error display helper for the macOS 1.0.9 accounts session analytics surface.

## Still Missing Before Strict

- exact runtime `load_session_analytics` IPC request/response/error envelope
  bytes;
- source session file byte fixtures and before-after/no-write proof;
- exact parsed row layout and corrupt/empty/permission error behavior from
  `parse_all_sessions` leaves;
- exact nested series item field names/bytes and ordering under real session
  data;
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
