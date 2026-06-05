# Accounts QuotaStoreItem Deserializer Field Map Static Reducer - AiMaMi 1.0.9

Scope: accounts-only same-version macOS AiMaMi 1.0.9 static reducer for the
`QuotaStoreItem` deserializer field visitor used by quota store JSON load paths
behind account switch/remove summary behavior.

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
- `QuotaStoreFile::__Visitor::expecting`:
  `0x1001ec774`
- `QuotaStoreItem::__Visitor::expecting`:
  `0x1001ec788`
- `QuotaStoreItem::__FieldVisitor::visit_str`:
  `0x1001edd0c`
- SOT field string clusters include:
  `schemaVersion`, `updatedAt`, `items`, `accountKey`, `capturedAt`,
  `usageSource`, `primaryWindow`, `secondaryWindow`, and `tokenStatus`.

## Accepted Static Field Map

`QuotaStoreItem::__FieldVisitor::visit_str` resolves this accepted field map:

| Field id | Accepted field |
|---:|---|
| 0 | `accountKey` |
| 1 | `capturedAt` |
| 2 | `usageSource` |
| 3 | `primaryWindow` |
| 4 | `secondaryWindow` |
| 5 | `tokenStatus` |
| 6 | unknown / ignored field marker |

The top-level `QuotaStoreFile` read/write surface remains the previously
registered static shape: `schemaVersion`, `updatedAt`, and `items`. This
reducer adds the item-level read-side field map that the helper-surface reducer
did not independently register.

## Accounts Boundary

This evidence complements:

- `ACCOUNTS-QUOTA-STORE-HELPER-SURFACE-STATIC-109.md` for load/default/save,
  lookup, upsert, and item serialization helper behavior;
- `ACCOUNTS-INLINE-ENUM-DESERIALIZERS-STATIC-109.md` for `usageSource` and
  sensitive-field-status enum parse values;
- `ACCOUNTS-RATE-LIMIT-WINDOW-SERIALIZER-STATIC-109.md` and
  `ACCOUNTS-sensitive-field-STATUS-SERIALIZER-STATIC-109.md` for nested output
  serializer surfaces.

## Still Missing Before Strict

- `QuotaStoreFile` full main deserializer required/default matrix;
- duplicate-field, missing-field, null, and wrong-type quota JSON behavior;
- exact quota JSON bytes and runtime item ordering;
- quota read/decode/write failure transport envelopes;
- before/after quota bytes for switch/remove fixtures;
- rollback/no-rollback after quota save failure;
- frontend runtime UI-state and query invalidation;
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
