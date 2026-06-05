# Accounts QuotaStoreFile Deserializer Matrix Static Reducer - AiMaMi 1.0.9

Scope: accounts-only same-version macOS AiMaMi 1.0.9 static reducer for the
top-level `QuotaStoreFile` JSON deserializer used by `quota_store::load` in
accounts switch/remove quota-state paths.

This reducer creates no raw/intermediate artifact, appends no `INDEX.jsonl`
row, edits no rule/spec file, edits no product code, runs no product test, and
promotes no gate.

## Evidence

- Binary SOT root:
  `<source-location>/source-binary/`
- SOT universal SHA:
  `1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482`
- IDA database:
  `<source-location>/source-binary/AiMaMi 1.0.9_ida.app/Contents/MacOS/AiMaMi.i64`
- `quota_store::load`:
  `0x1001bc62c`
- `QuotaStoreFile::__Visitor::expecting`:
  `0x1001ec774`
- top-level serde_json `deserialize_struct` specialization:
  `0x10036db58`
- field/string cluster:
  `0x100f2f5e4` / `0x100f2f6b8` / `0x100f2f6c1`
  containing `schemaVersion`, `updatedAt`, `items`, and
  `struct QuotaStoreFile with 3 elements`.
- IDB writeback:
  comments added at `0x10036db58`, `0x1001bc62c`, and `0x1001ec774`;
  `idb_save` returned OK.

## Load Entry

`quota_store::load` performs:

```text
std::fs::read_to_string(path)
  -> serde_json::de::from_trait<QuotaStoreFile>
  -> on decode success, normalize schemaVersion to at least 1
  -> return decoded quota store
```

Read failure and JSON decode failure remain separate error-shaped branches as
already recorded by `ACCOUNTS-QUOTA-STORE-HELPER-SURFACE-STATIC-109.md`.

## Top-Level Map Matrix

The top-level map deserializer recognizes these fields:

| Field | Static type path | Required/default behavior |
|---|---|---|
| `schemaVersion` | `deserialize_i32` | required; caller later normalizes minimum to `1` |
| `updatedAt` | `deserialize_i64` | required |
| `items` | `deserialize_seq` into `Vec<QuotaStoreItem>` | required |

Static map behavior:

- missing `schemaVersion` produces a custom missing-field style error for
  `schemaVersion`;
- missing `updatedAt` produces a custom missing-field style error for
  `updatedAt`;
- missing `items` produces a custom missing-field style error for `items`;
- duplicate recognized `schemaVersion`, `updatedAt`, or `items` routes to a
  custom duplicate-field style error;
- unknown fields are ignored through `serde_json::de::Deserializer::ignore_value`
  and do not block decode;
- explicit 
ull` or wrong-type values for `schemaVersion`, `updatedAt`, or
  `items` follow the corresponding serde_json type decoder error path, not a
  default path.

## Sequence Matrix

The same deserializer also accepts sequence form in this order:

```text
[schemaVersion, updatedAt, items]
```

Static sequence behavior:

- element 0 is decoded as `i32` `schemaVersion`;
- element 1 is decoded as `i64` `updatedAt`;
- element 2 is decoded as sequence `items`;
- fewer than three elements routes to `invalid_length`;
- extra sequence handling is delegated to serde_json `end_seq`; this reducer
  does not claim exact runtime error bytes for extra elements.

## Accounts Boundary

This fills the gap left by
`ACCOUNTS-QUOTA-STORE-ITEM-DESERIALIZER-FIELDMAP-STATIC-109.md`: that reducer
covered `QuotaStoreItem` field names, while this reducer covers the top-level
`QuotaStoreFile` required/default/duplicate/unknown/null/wrong-type static
shape.

This still does not prove exact runtime JSON bytes, exact serde error text,
permission/decode envelopes, quota ordering after save, or caller rollback
behavior.

## Still Missing Before Strict

- exact quota JSON bytes and runtime item ordering;
- quota read/decode/write permission failure transport envelopes;
- exact serde error bytes for missing, duplicate, null, wrong-type, and extra
  sequence fixtures;
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
