# Accounts Quota History Point Deserializer Fieldmap Static - AiMaMi 1.0.9

Scope: accounts-only same-version macOS AiMaMi 1.0.9 static field matrix
for the `QuotaHistoryPoint` JSON deserializer used by `load_quota_history`.

This reducer consumes IDA HTTP MCP pseudocode over the current binary SOT. It
writes no raw/intermediate artifact, appends no `INDEX.jsonl` row, edits no
product code or rule/spec file, runs no product test, and does not promote any
gate.

## Evidence

- Binary SOT root:
  `<source-location>/source-binary/`.
- IDA HTTP MCP endpoint: `<local-tool-endpoint>`.
- IDA database:
  `<source-location>/source-binary/AiMaMi 1.0.9_ida.app/Contents/MacOS/AiMaMi.i64`.
- Current executable:
  `<source-location>/source-binary/AiMaMi 1.0.9.app/Contents/MacOS/AiMaMi`.
- Current executable SHA-256:
  `1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482`.
- `quota_history::load_history`: `0x1001be170`.
- JSONL parse callsite: `0x1001be320` calls
  `serde_json::de::from_trait @ 0x10031103c`.
- `QuotaHistoryPoint` deserializer body:
  `deserialize_struct @ 0x1003687b0`.
- `QuotaHistoryPoint::__Visitor::expecting`: `0x1001ee2a0`.
- Visitor/vtable refs: `0x1012c9468` / `0x1012c9480`.
- Field string region: `0x100f2f918`.
- `Option<f64>` helper: `0x1005c6ee0`; it accepts literal 
ull` and
  otherwise calls `deserialize_f64 @ 0x10035dsource archivec`.

## Accepted Static Facts

- `load_history @ 0x1001be170` trims each non-empty JSONL line and calls
  `serde_json::de::from_trait @ 0x10031103c` at `0x1001be320`.
- Successful parsed rows are copied as 64-byte point records and then filtered
  by timestamp cutoff and optional `accountKey` byte comparison.
- The point deserializer at `0x1003687b0` accepts both JSON object `{...}` and
  positional sequence `[...]` forms.
- Object form recognizes exactly these field keys for point construction:
  `timestamp`, `accountKey`, `primaryUsedPercent`, and
  `secondaryUsedPercent`.
- Unknown object keys are consumed through
  `serde_json::de::Deserializer::ignore_value @ 0x100311684` rather than
  hard-failing the whole row.
- `timestamp` is matched at compare block `0x100368a1c` and decoded through
  `deserialize_i64 @ 0x100368c00`; it is required.
- `accountKey` is matched at compare block `0x100368938` and decoded through
  `deserialize_string @ 0x100368b60`; it is required.
- Missing `timestamp` or missing `accountKey` produces a custom missing-field
  error before the map result is accepted.
- `primaryUsedPercent` is matched at compare block `0x100368a9c` and decoded
  through `Option<f64>` helper `0x1005c6ee0`; explicit 
ull` maps to `None`,
  otherwise the helper calls `deserialize_f64 @ 0x10035dsource archivec`.
- `secondaryUsedPercent` is matched at compare block `0x1003689ac` and decoded
  through the same `Option<f64>` helper; explicit 
ull` maps to `None`,
  otherwise the helper calls `deserialize_f64 @ 0x10035dsource archivec`.
- Missing `primaryUsedPercent` and missing `secondaryUsedPercent` default to
  `None` in object form.
- Duplicate object fields for any recognized field route to custom duplicate
  field errors before an accepted point is produced.
- Sequence form expects positional fields in this order:
  `timestamp`, `accountKey`, `primaryUsedPercent`, `secondaryUsedPercent`.
- Sequence form uses `invalid_length` errors when required positional elements
  are absent.

## Field Matrix

| Field | Decode | Required/default | Duplicate |
| --- | --- | --- | --- |
| `timestamp` | `deserialize_i64` | required | error |
| `accountKey` | `deserialize_string` | required | error |
| `primaryUsedPercent` | `Option<f64>`; 
ull` accepted | default `None` | error |
| `secondaryUsedPercent` | `Option<f64>`; 
ull` accepted | default `None` | error |

## Boundary

This reducer closes only the static deserializer field matrix. It does not
prove:

- exact runtime `load_quota_history` request/response IPC envelope bytes;
- concrete JSONL fixture bytes for success, corrupt row, missing field,
  duplicate field, null percent, or unknown field cases;
- exact runtime display/error text for serde failures;
- runtime sort/filter/retention rewrite outputs under live files;
- frontend rendered chart state under concrete fixtures;
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
