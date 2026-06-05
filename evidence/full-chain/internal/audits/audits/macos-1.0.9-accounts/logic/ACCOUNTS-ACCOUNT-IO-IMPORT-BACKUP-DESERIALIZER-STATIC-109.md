# Accounts Account IO Import Backup Deserializer Static - AiMaMi 1.0.9

Scope: accounts-only same-version macOS AiMaMi 1.0.9 static reducer for the
read-side backup JSON deserializers used by `preview_account_import` and
`import_accounts_from_file`.

This reducer consumes IDA HTTP MCP pseudocode over the current binary SOT. It
writes no raw/intermediate artifact, appends no `INDEX.jsonl` row, edits no
product code or rule/spec file, runs no product test, and does not promote any
gate.

## Evidence

- Binary SOT root:
  `<source-location>/source-binary/`.
- SOT executable:
  `<source-location>/source-binary/AiMaMi 1.0.9.app/Contents/MacOS/AiMaMi`.
- SOT universal SHA-256:
  `1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482`.
- IDA database:
  `<source-location>/source-binary/AiMaMi 1.0.9_ida.app/Contents/MacOS/AiMaMi.i64`.
- IDA HTTP MCP endpoint: `<local-tool-endpoint>`.
- `account_io::parse_import_file`: `0x1005e13fc`.
- `ExportFile` main `deserialize_struct`: `0x100378acc`.
- `ExportedAccount` main `deserialize_struct`: `0x10037ac04`.
- `ExportFile::__FieldVisitor::visit_str`: `0x1005fb8b4`.
- `ExportedAccount::__FieldVisitor::visit_str`: `0x1005fcc40`.
- `serde_json::de::from_trait` used by `parse_import_file`: `0x100310118`.

## Accepted Static Facts

### Parser entry

- `parse_import_file @ 0x1005e13fc` checks metadata before reading file bytes.
- Files larger than `0xA00000` bytes are rejected before `std::fs::read`.
- Successful metadata and size check reaches `std::fs::read::inner`, then
  calls `serde_json::de::from_trait @ 0x100310118`.
- A JSON decode error is formatted with the static prefix
  `Not a valid AiMaMi accounts backup: ` before returning the parser error.
- After deserialization succeeds, `parse_import_file` validates backup kind
  `aimami-accounts-export`, schema version `1`, account count not greater than
  `500`, and non-empty accounts.

### ExportFile deserializer

- `ExportFile::__FieldVisitor::visit_str @ 0x1005fb8b4` recognizes
  `schemaVersion`, `kind`, `appVersion`, `exportedAt`, `exportedHostname`,
  `accountCount`, and `accounts`.
- Unknown `ExportFile` fields resolve to the ignored-field marker and are
  skipped by the main struct decoder instead of becoming a hard unknown-field
  error.
- `ExportFile` main `deserialize_struct @ 0x100378acc` dispatches through the
  field visitor and the serde map access loop before materializing the struct.
- Duplicate recognized `ExportFile` fields take the serde custom-error path.
- `exportedHostname` is decoded through the optional/default-none path.
- Required core `ExportFile` fields that are not materialized by the map path
  enter missing/custom-error handling before a valid `ExportFile` can be
  returned.

### ExportedAccount deserializer

- `ExportedAccount::__FieldVisitor::visit_str @ 0x1005fcc40` recognizes
  `accountKey`, `email`, `alias`, `accountName`, `workspaceName`,
  `profileName`, `plan`, `authMode`, `hasActiveSubscription`,
  `subscriptionExpiresAt`, `subscriptionWillRenew`, `createdAt`, `lastUsedAt`,
  and `auth`.
- Unknown `ExportedAccount` fields resolve to the ignored-field marker and are
  skipped by the main struct decoder instead of becoming a hard unknown-field
  error.
- `ExportedAccount` main `deserialize_struct @ 0x10037ac04` supports both map
  (`{}`) and sequence (`[]`) serde decode paths.
- Non-object/non-sequence inputs enter `peek_invalid_type` / fixed-position
  error handling.
- Sequence decode uses `invalid_length` errors when required positional
  elements are missing.
- The map path dispatches through the field visitor and uses custom-error
  branches for duplicate recognized fields before returning a valid
  `ExportedAccount`.
- Optional account fields use `Option<T>` decode paths where visible in the
  static deserializer body; runtime null/wrong-type display bytes remain
  outside this reducer.

## Boundary

This reducer closes only the static read-side backup JSON deserializer shape
and the major required/default/duplicate/unknown branches visible in IDA. It
does not prove:

- exact runtime Tauri IPC request/response/error envelope bytes;
- duplicate, missing, null, wrong-type, and unknown-field exact serde error
  text bytes under executed fixtures;
- exact backup JSON fixture bytes, account ordering, or nested `auth` sensitive-field
  runtime decode bytes;
- preview/import before-after auth, registry, quota, or temp bytes;
- rollback or no-rollback behavior under import write/rebuild failures;
- frontend dialog/toast/query-invalidation runtime state;
- executed source archive acceptance mapping;
- independent Windows closure.

## Gate Effect

No promotion.

- `consumerStartReady`: true for this static leaf only.
- `consumerStartBlocked`: false for this static leaf only.
- `strictImplementationUse`: false / `0`.
- `readyToImplement`: false / `0`.
- `implementation_use`: false.
- `gate_accepted`: false.
- `full_leaf_100`: false.
- `moduleExitAllowed`: false.

Accounts remains the active module. This reducer is dimension evidence only
and does not allow switching to plugins, relay, system, or tray.
