# Accounts Export Accounts AccountKeys / Write Static Reducer - AiMaMi 1.0.9

Scope: accounts-only same-version macOS AiMaMi 1.0.9 static reducer for
`export_accounts_to_file`, specifically `accountKeys` filtering, no-registry /
no-accounts branches, export payload construction, target filename normalization,
and atomic write handoff.

This reducer consumes existing accepted producer evidence and IDA Pro MCP HTTP
static cross-checks. It writes no raw/intermediate artifact, appends no
`INDEX.jsonl` row, edits no product code or rule/spec file, runs no product
test, and does not promote any gate.

## Evidence

- SOT binary root:
  `<source-location>/source-binary/`
- SOT universal SHA:
  `1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482`
- Ghidra producer arm64 thin SHA:
  `985dae00be620b21164b4a8d35cc0379b750d5a6257b25897b0e813441e4d706`
- IDA input universal SHA:
  `1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482`
- Accepted producer pseudocode:
  `<source-location>/intermediate/aimami/1.0.9/macos/accounts/backend-owner-pseudocode-calltree/run-bundle/ghidra/pseudocode/0005_export_accounts_to_file_16a95718.c`
- Accepted call tree:
  `<source-location>/intermediate/aimami/1.0.9/macos/accounts/backend-owner-pseudocode-calltree/run-bundle/call-trees/export_accounts_to_file.jsonl`
- IDA core owner:
  `0x1005ddd0c`
  `codexmate_lib::core::account_io::export_accounts`
- IDA blocking command body/function start:
  `0x10032ce58`
  `codexmate_lib::commands::account_io::export_accounts_to_file::{closure}::{closure}`
- IDA core-owner callsite inside the blocking command body:
  `0x10032d0cc`

## Command Wrapper Static Boundary

IDA HTTP MCP decompilation of `0x10032ce58` confirms the command wrapper:

- obtains the app state through `tauri::state::StateManager::try_get`;
- locks the state mutex and has a poisoned-lock error string
  `poisoned lock: another task failed inside`;
- copies `targetPath` bytes before calling the backend;
- passes the deserialized `accountKeys` option/vector storage to
  `codexmate_lib::core::account_io::export_accounts`;
- formats non-success `CoreError` through its Display implementation;
- wraps backend success through `CoreEnvelope<T>::ok`.

This proves the wrapper-to-core argument flow, but not direct runtime IPC
decode envelopes for omitted, null, wrong-type, duplicate, or malformed inputs.

## accountKeys Static Branch

Ghidra pseudocode shows the backend builds and consults an account-field hash set
only when the `accountKeys` option is present:

- if the option is absent, per-registry entries continue without hash-set
  membership testing;
- if the option is present, `core::hash::BuildHasher::hash_one` is used against
  the registry entry field;
- a field found in the hash set jumps to the normal export processing block;
- a field not found in the hash set advances the registry loop before snapshot
  metadata, snapshot auth loading, export-row append, hostname collection,
  serialization, or write.

Static proof therefore narrows implementation reading to:

```text
accountKeys absent -> consider all registry entries
accountKeys present and contains registry field -> export that entry if snapshot/auth read succeeds
accountKeys present and does not contain registry field -> skip that entry before snapshot/auth read
```

This is not a runtime nullability or element-type matrix. The frontend wrapper
has prior static evidence that omitted/undefined maps to 
ull`, but direct IPC
omitted/null/wrong-type, empty array, duplicate-field, and non-string-field behavior
still require accepted runtime envelopes before strict use.

## Registry / Snapshot Static Branches

Accepted static branches and strings for this reducer:

- missing registry metadata produces `No AiMaMi account registry found yet`;
- a present registry is read with `std::fs::read_to_string` and decoded through
  `serde_json::de::from_trait`;
- per selected/exported registry row, snapshot path metadata is checked before
  auth loading;
- missing snapshot metadata appends an export error with
  `Snapshot file missing: ...`;
- `auth::load_auth_file` failure appends an export error with
  `Failed to read snapshot: ...`;
- if no row is exported, the backend returns `No accounts to export`;
- successful rows are accumulated before the export-file payload is built.

These branches are static labels and ordering evidence only. Exact runtime
envelope bytes and before/after filesystem state remain unproven.

## Export Payload / Write Static Order

The narrowed static order is:

```text
registry metadata check
  -> read registry JSON
  -> build accountKeys HashSet if option is present
  -> per-registry accountKeys membership test
  -> snapshot metadata check
  -> auth::load_auth_file
  -> append successful ExportedAccount rows or per-row errors
  -> if exported row count is zero, return No accounts to export
  -> hostname::get
  -> SystemTime::now / duration_since UNIX epoch
  -> construct ExportFile with schemaVersion, kind, appVersion,
     exportedAt, exportedHostname, accountCount, accounts
  -> serde serialize map with ExportedAccount fields
  -> normalize target file name to .aimami-accounts.json when needed
  -> relay::atomic_write::write_atomic
```

Static string/serializer evidence names the payload fields:

```text
schemaVersion
kind
appVersion
exportedAt
exportedHostname
accountCount
accounts
ExportedAccount.accountKey
ExportedAccount.email
ExportedAccount.alias
ExportedAccount.accountName
ExportedAccount.workspaceName
ExportedAccount.profileName
ExportedAccount.plan
ExportedAccount.authMode
ExportedAccount.hasActiveSubscription
ExportedAccount.subscriptionExpiresAt
ExportedAccount.subscriptionWillRenew
ExportedAccount.createdAt
ExportedAccount.lastUsedAt
ExportedAccount.auth
```

The target path branch inspects the current file name. If the name does not
already end in the export suffix, the backend trims JSON-like suffixes and sets
the filename through a formatted `*.aimami-accounts.json` pattern before
calling `relay::atomic_write::write_atomic`.

## Still Missing Before Strict

- exact Tauri IPC request/response/error envelope bytes;
- direct IPC omitted/null/wrong-type behavior for `targetPath` and
  `accountKeys`;
- runtime matrix for `accountKeys=null`, empty array, non-empty array,
  duplicate keys, unknown keys, and invalid element types;
- exact export JSON bytes, field ordering as emitted by runtime serde, escaping,
  timestamp format, hostname fallback, and account field null/optional mapping;
- target filename normalization bytes for extension/no-extension/path edge
  cases;
- overwrite/write-failure envelope and temp/no-write residue;
- snapshot missing/read-failure runtime envelopes and row-level error array
  shape;
- frontend runtime close/toast/loading/query-invalidation state;
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
