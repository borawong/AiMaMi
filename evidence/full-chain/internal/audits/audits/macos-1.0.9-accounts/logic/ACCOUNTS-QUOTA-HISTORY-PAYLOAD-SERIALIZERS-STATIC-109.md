# Accounts Quota History Payload Serializers Static Reducer - AiMaMi 1.0.9

Scope: accounts-only same-version macOS AiMaMi 1.0.9 static reducer for quota
history payload serializers used by the `load_quota_history` account quota /
usage history surface.

This reducer consumes IDA Pro MCP HTTP decompilation against the SOT universal
binary and direct SOT string-cluster checks from
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
- `QuotaHistoryPoint::serialize`:
  `0x1001beb3c`
- `QuotaHistoryPayload::serialize`:
  `0x1001bec90`
- `QuotaHistoryPoint::__Visitor::expecting`:
  `0x1001ee2a0`
- IDA field refs:
  `0x100edef75`, `0x100edee6e`, `0x100edef7e`, `0x100edef90`,
  `0x100edefa4`
- SOT string clusters include:
  `load_quota_history`, `timestamp`, `accountKey`, `primaryUsedPercent`,
  `secondaryUsedPercent`, `struct QuotaHistoryPoint with 4 elements`, and
  `points`.

## Accepted Static Field Map

`QuotaHistoryPoint::serialize` emits four point fields:

| Order | Field | Field ref / source | Length arg |
|---:|---|---:|---:|
| 1 | `timestamp` | `0x100edef75` | `9` |
| 2 | `accountKey` | `0x100edee6e` | `10` |
| 3 | `primaryUsedPercent` | `0x100edef7e` | `18` |
| 4 | `secondaryUsedPercent` | `0x100edef90` | `20` |

`QuotaHistoryPayload::serialize` emits one top-level field:

| Order | Field | Field ref / source | Length arg |
|---:|---|---:|---:|
| 1 | `points` | `0x100edefa4` | `6` |

The exposed `QuotaHistoryPoint::__Visitor::expecting` symbol confirms a
same-version deserializer type surface exists, but this reducer only accepts
serializer field names and does not claim the point deserializer field matrix.

## Accounts Boundary

This evidence complements:

- `ACCOUNTS-QUOTA-STORE-HELPER-SURFACE-STATIC-109.md` for quota store read/write
  helper behavior;
- `ACCOUNTS-QUOTA-STORE-ITEM-DESERIALIZER-FIELDMAP-STATIC-109.md` for quota
  item read-side field recognition;
- `ACCOUNTS-sensitive-field-ANALYTICS-SERIALIZERS-STATIC-109.md` for sensitive-field analytics DTO
  serializer shape.

## Still Missing Before Strict

- exact runtime `load_quota_history` request and response IPC envelope bytes;
- quota history source file/path and before-after bytes;
- runtime point ordering, timestamp format, and account filtering semantics;
- empty-history, corrupt-history, permission-error, and null/default behavior;
- deserializer field matrix for `QuotaHistoryPoint`;
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
