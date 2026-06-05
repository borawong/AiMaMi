# Accounts Session Analytics Series Item Static Reducer - AiMaMi 1.0.9

Scope: accounts-only same-version macOS AiMaMi 1.0.9 static reducer for the
nested `SessionDaySeries` serializer used inside the `load_session_analytics`
session analytics payload.

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
- Parent payload serializer:
  `SessionAnalyticsPayload::serialize` at `0x1001d65ac`
- Nested series serializer:
  `SessionDaySeries::serialize` at `0x1001d32c0`
- Field refs:
  `0x100ee0998` -> `date`,
  `0x100ee0ba2` -> `count`

## Accepted Static Field Map

`SessionDaySeries::serialize` emits two nested fields for each
`SessionAnalyticsPayload.series[]` item:

| Order | Field | Field ref / source | Length arg | Value source |
|---:|---|---:|---:|---|
| 1 | `date` | `0x100ee0998` | `4` | struct offset `0` |
| 2 | `count` | `0x100ee0ba2` | `5` | struct offset `24` |

The parent `SessionAnalyticsPayload::serialize` reducer already proves the
top-level fields `totalSessions`, `avgTurns`, `activeDays`, and `series`. This
reducer closes only the static nested item field names for `series[]`.

## Accounts Boundary

This evidence complements:

- `ACCOUNTS-SESSION-ANALYTICS-PAYLOAD-SERIALIZER-STATIC-109.md` for top-level
  session analytics payload fields;
- `ACCOUNTS-SESSION-ANALYTICS-OWNER-STATIC-109.md` for the command owner,
  compute owner, range defaulting, active-day bucket aggregation, and date
  series construction.

## Still Missing Before Strict

- exact runtime `load_session_analytics` request/response/error envelope bytes;
- source session file byte fixtures and before-after/no-write proof;
- runtime `series[]` values, ordering, and date/count normalization under real
  session data;
- corrupt/empty/permission error behavior from `parse_all_sessions` leaves;
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
