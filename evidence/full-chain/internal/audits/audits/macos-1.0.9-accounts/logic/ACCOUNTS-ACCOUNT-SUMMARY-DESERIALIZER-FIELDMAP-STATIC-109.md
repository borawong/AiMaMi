# Accounts AccountSummary Deserializer Field Map Static Reducer - AiMaMi 1.0.9

Scope: accounts-only same-version macOS AiMaMi 1.0.9 static reducer for the
`AccountSummary` deserializer field visitor. This closes the DTO read-side
field-name map for `AccountSummary`; it does not prove runtime IPC envelopes,
runtime source values, side-effect bytes, frontend state, or accepted fixture
execution.

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
- `AccountSummary::__Visitor::expecting`:
  `0x1001e9c10`
- `AccountSummary::__FieldVisitor::visit_bytes`:
  `0x1001eab14`
- `AccountSummary::__FieldVisitor::visit_str`:
  `0x1001eb63c`
- SOT field string clusters include:
  `accountKey`, `email`, `alias`, `accountName`, `workspaceName`,
  `profileName`, `plan`, `authMode`, `hasActiveSubscription`,
  `subscriptionExpiresAt`, `subscriptionWillRenew`, `isActive`, `createdAt`,
  `lastUsedAt`, `lastUsageAt`, `usageSource`, `primaryWindow`,
  `secondaryWindow`, and `tokenStatus`.

## Accepted Static Field Map

`visit_bytes` and `visit_str` resolve the same 19 accepted field IDs:

| Field id | Accepted field |
|---:|---|
| 0 | `accountKey` |
| 1 | `email` |
| 2 | `alias` |
| 3 | `accountName` |
| 4 | `workspaceName` |
| 5 | `profileName` |
| 6 | `plan` |
| 7 | `authMode` |
| 8 | `hasActiveSubscription` |
| 9 | `subscriptionExpiresAt` |
| 10 | `subscriptionWillRenew` |
| 11 | `isActive` |
| 12 | `createdAt` |
| 13 | `lastUsedAt` |
| 14 | `lastUsageAt` |
| 15 | `usageSource` |
| 16 | `primaryWindow` |
| 17 | `secondaryWindow` |
| 18 | `tokenStatus` |
| 19 | unknown / ignored field marker |

Unknown field names set field id `19`. The reducer accepts only the static
field-name recognition map; it does not claim missing-field defaults, duplicate
field errors, nested visitor behavior, or runtime JSON decode envelopes.

## Accounts Boundary

This evidence complements:

- `ACCOUNTS-ACCOUNT-SUMMARY-SERIALIZER-STATIC-109.md` for write-side 19-field
  serializer order;
- `ACCOUNTS-ACCOUNT-SUMMARY-INLINE-ENUM-SERIALIZERS-STATIC-109.md` and
  `ACCOUNTS-INLINE-ENUM-DESERIALIZERS-STATIC-109.md` for enum value names;
- `ACCOUNTS-RATE-LIMIT-WINDOW-SERIALIZER-STATIC-109.md` and
  `ACCOUNTS-sensitive-field-STATUS-SERIALIZER-STATIC-109.md` for nested serializer
  surfaces.

## Still Missing Before Strict

- main `AccountSummary` deserializer body field-required/default matrix;
- duplicate-field, missing-field, null, and wrong-type runtime decode behavior;
- exact command/event returning or accepting `AccountSummary`;
- exact Tauri IPC request/response/decode envelope bytes;
- runtime value source matrix for each account summary field;
- auth, registry, quota, and temp before-after bytes;
- frontend rendering/query state for parsed account summaries;
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
