# Accounts Export Accounts Success Payload Static Reducer - AiMaMi 1.0.9

Scope: accounts-only same-version macOS AiMaMi 1.0.9 static reducer for the
`export_accounts_to_file` command success payload serializer. This complements
`ACCOUNTS-EXPORT-ACCOUNTS-ACCOUNTKEYS-WRITE-STATIC-109.md`, which covers backend
selection/write flow; this reducer only closes the returned payload field names
and serializer offsets.

This reducer consumes IDA Pro MCP HTTP decompilation against the SOT universal
binary and direct byte cross-checks from `<source-location>/source-binary/`.
It writes no raw/intermediate artifact, appends no `INDEX.jsonl` row, edits no
product code or rule/spec file, runs no product test, and does not promote any
gate.

## Evidence

- SOT binary root:
  `<source-location>/source-binary/`
- IDA active input:
  `AiMaMi 1.0.9_ida.app/Contents/MacOS/AiMaMi`
- IDA active instance:
  `<local-tool-endpoint>`
- IDA serializer:
  `0x1001d4378`
  `codexmate_lib::core::models::_::<impl serde_core::ser::Serialize for codexmate_lib::core::models::AccountExportPayload>::serialize`
- Related backend owner already reduced:
  `0x1005ddd0c`
  `codexmate_lib::core::account_io::export_accounts`
- Related command wrapper already reduced:
  `0x10032d0cc`
  `codexmate_lib::commands::account_io::export_accounts_to_file::{closure}::{closure}`

## Serializer Field Map

IDA decompilation of `AccountExportPayload::serialize` emits a JSON map and
calls `serde_core::ser::SerializeMap::serialize_entry` four times. Direct
arm64 slice byte checks against the SOT binary resolve the anonymous field
symbols to:

| Field order | IDA field symbol | Length arg | Value pointer | SOT field bytes |
|---|---:|---:|---:|---|
| 1 | `0x100ee0c70` | `10` | `a1` | `targetPath` |
| 2 | `0x100ee0a66` | `12` | `a1 + 56` | `accountCount` |
| 3 | `0x100edf4f8` | `10` | `a1 + 48` | `exportedAt` |
| 4 | `0x100edf54b` | `7` | `a1 + 24` | `skipped` |

The direct byte mapping used the arm64 fat-slice offset from the universal
binary and read the referenced `__TEXT,__const` anonymous symbols in place.
The values matched the same field clusters visible in SOT strings:

```text
targetPathimportedAccountKeysregistryAccountCount...
accountCountactiveAccountKey...
exportedAtexportedByincludeApiKeysproviders...
skippedRelayExportProvider...
```

## Accepted Static Facts

- `export_accounts_to_file` returns a success payload represented by
  `AccountExportPayload`.
- The returned payload serializer has exactly four statically observed keys:
  `targetPath`, `accountCount`, `exportedAt`, and `skipped`.
- The serializer order is `targetPath` -> `accountCount` -> `exportedAt` ->
  `skipped`.
- `targetPath` serializes from the payload base pointer.
- `skipped` serializes from `a1 + 24`, separate from the backend export-file
  `accounts` list covered by the write reducer.
- This payload-level serializer is distinct from the export-file JSON payload
  fields `schemaVersion`, `kind`, `appVersion`, `exportedAt`,
  `exportedHostname`, `accountCount`, and `accounts`.

## Still Missing Before Strict

- exact runtime IPC success envelope bytes for `export_accounts_to_file`;
- exact JSON value types and values for `targetPath`, `accountCount`,
  `exportedAt`, and `skipped` under accepted fixtures;
- runtime distinction between payload-level `skipped` and export-file row-level
  skipped/error data;
- frontend toast/dialog consumption of `skipped`;
- omitted/null/wrong-type IPC decode behavior for command input;
- export output file bytes, overwrite/write-failure envelope, and temp residue;
- executed source archive acceptance mapping;
- independent Windows closure.

## Gate Effect

- `consumerStartReady`: unchanged.
- `strictImplementationUse`: false / `0`.
- `readyToImplement`: false / `0`.
- `implementation_use`: false.
- `gate_accepted`: false.
- `full_leaf_100`: false.
- `moduleExitAllowed`: false.

Accounts remains the active locked module. This reducer does not permit
switching to plugins, relay, system, or tray.
