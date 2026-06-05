# Accounts Quota Store Helper Surface Static - AiMaMi 1.0.9

Scope: accounts-only same-version macOS AiMaMi 1.0.9 static reducer for the
shared `quota_store` helper surface used by accounts switch/remove paths.

This reducer consumes IDA Pro MCP HTTP decompilation from the active current
IDA database:

`<source-location>/source-binary/AiMaMi 1.0.9_ida.app/Contents/MacOS/AiMaMi.i64`

It writes no raw/intermediate artifact, appends no `INDEX.jsonl` row, edits no
rule/spec/skill file, runs no product test, changes no product code, and
promotes no gate.

## Functions Reduced

| Function | Address | Static role |
|---|---:|---|
| `quota_store::load_or_default` | `0x1001bc42c` | fallback wrapper around `quota_store::load` |
| `quota_store::load` | `0x1001bc62c` | read JSON quota store file and decode |
| `quota_store::save` | `0x1001bc710` | ensure parent directory, serialize quota store, write file |
| `quota_store::find_item` | `0x1001bca98` | linear lookup by account field bytes |
| `quota_store::upsert_item` | `0x1001bc200` | replace existing item or append/sort changed item |
| `QuotaStoreItem::serialize` | `0x1001bc498` | item serializer surface used by save |

## Load / Default Boundary

`quota_store::load` performs:

```text
std::fs::read_to_string
  -> serde_json::de::from_trait
  -> normalize schemaVersion minimum to 1
  -> return decoded quota store
```

Static error shape:

- read failure returns an IO/CoreError-shaped branch;
- JSON decode failure returns a serde/CoreError-shaped branch;
- successful decode normalizes the file schema version to at least `1`.

`quota_store::load_or_default` calls `quota_store::load`. If load succeeds it
returns the decoded store. If load fails, it drops the error and returns an
empty/default store with schema version `1`.

This is relevant to accounts because `switch_account` reads quota state for
account summary construction and `remove_accounts` reads quota state before
retaining/removing quota rows. It does not prove exact runtime envelopes or
before/after quota bytes.

## Save Boundary

`quota_store::save` performs:

```text
Path::parent
  -> DirBuilder::_create(parent)
  -> clone quota items
  -> normalize schemaVersion minimum to 1
  -> serialize map
  -> std::fs::write
```

The static top-level file fields are:

- `schemaVersion`
- `updatedAt`
- `items`

`save` returns an IO/CoreError-shaped branch if parent directory creation or
file write fails. It returns a serde/CoreError-shaped branch if serialization
fails. It returns success after `std::fs::write` succeeds.

This reducer does not prove whether any caller rolls back prior filesystem
work when `quota_store::save` fails. For accounts, the strict blocker remains
the runtime before/after bytes and partial-write/no-rollback fixture evidence.

## Lookup / Upsert Boundary

`quota_store::find_item` linearly scans quota store items by account-field byte
length and `memcmp`, returning the matching item pointer or no item.

`quota_store::upsert_item` also matches by account-field byte length and
`memcmp`:

- no existing item: append item, update store timestamp, then sort when needed;
- existing item equal to incoming item: drop incoming owned fields and return
  unchanged / false-like status;
- existing item different from incoming item: replace the stored item, update
  store timestamp, then sort when needed.

The sorting branch uses small insertion sort for short vectors and driftsort
for larger vectors. This affects deterministic quota-store ordering, but exact
serialized bytes still require runtime capture.

## Accounts Impact

Accepted static impact:

- `switch_account`: quota lookup is a byte-field lookup against the quota store;
  load failures can be converted to default store through caller/helper usage
  when that path uses `load_or_default`.
- `remove_accounts`: quota rows are retained/removed after registry retention
  and before optional quota save; quota save failure remains a partial-delete
  risk class because snapshot delete and registry persist may already have
  happened.

Rejected as strict proof:

- exact success/error transport envelopes;
- exact quota JSON bytes and ordering as emitted at runtime;
- quota read/decode/write permission failure envelopes;
- before/after quota bytes for switch/remove fixtures;
- rollback/no-rollback after quota save failure;
- frontend runtime UI-state and executed acceptance;
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
