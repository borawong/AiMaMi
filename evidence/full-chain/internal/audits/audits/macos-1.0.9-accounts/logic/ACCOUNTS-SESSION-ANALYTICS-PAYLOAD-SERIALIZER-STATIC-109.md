# Accounts Session Analytics Payload Serializer Static Reducer - AiMaMi 1.0.9

Scope: accounts-only same-version macOS AiMaMi 1.0.9 static reducer for the
`SessionAnalyticsPayload` serializer used by the `load_session_analytics`
accounts usage/session analytics surface.

This reducer consumes IDA Pro MCP HTTP decompilation against the SOT universal
binary and direct SOT arm64-slice string checks from
`<source-location>/source-binary/`. It writes no
raw/intermediate artifact, appends no `INDEX.jsonl` row, edits no product code
or rule/spec file, runs no product test, and does not promote any gate.

## Evidence

- SOT binary root:
  `<source-location>/source-binary/`
- IDA active endpoint:
  `<local-tool-endpoint>`
- SOT universal SHA:
  `1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482`
- `SessionAnalyticsPayload::serialize`:
  `0x1001d65ac`
- SOT field refs / strings:
  `0x100ee0ef7` -> `totalSessions`,
  `0x100ee0f04` -> `avgTurns`,
  `0x100ee0f0c` -> `activeDays`,
  `0x100ee0de8` -> `series`
- SOT command string cluster includes:
  `load_session_analytics`

## Accepted Static Field Map

`SessionAnalyticsPayload::serialize` emits four top-level fields:

| Order | Field | Field ref / source | Length arg |
|---:|---|---:|---:|
| 1 | `totalSessions` | `0x100ee0ef7` | `13` |
| 2 | `avgTurns` | `0x100ee0f04` | `8` |
| 3 | `activeDays` | `0x100ee0f0c` | `10` |
| 4 | `series` | `0x100ee0de8` | `6` |

This closes only the static DTO serializer field names for the session
analytics payload.

## Accounts Boundary

This evidence complements:

- `ACCOUNTS-sensitive-field-ANALYTICS-SERIALIZERS-STATIC-109.md` for sensitive-field analytics DTO
  serializer shape;
- `ACCOUNTS-QUOTA-HISTORY-PAYLOAD-SERIALIZERS-STATIC-109.md` for quota history
  DTO serializer shape;
- `ACCOUNTS-ACCOUNT-SUMMARY-SERIALIZER-STATIC-109.md` for account summary
  fields that analytics UI can correlate with active account state.

## Still Missing Before Strict

- exact runtime `load_session_analytics` request and response IPC envelope
  bytes;
- session source file/path discovery and before-after bytes;
- runtime series item field map and value calculation semantics;
- empty-session, corrupt-session, permission-error, null/default, and
  time-window behavior;
- frontend chart/query/loading/error state;
- executed source archive acceptance mapping;
- independent Windows closure.

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
