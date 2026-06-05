# Accounts Export Accounts File IDA Raw Leaf - 1.0.9

Scope: accounts-only same-version macOS AiMaMi 1.0.9 reducer for the clean raw
IDA leaf bundle of `export_accounts_to_file`.

This reducer consumes:

- `<source-location>/raw/aimami/1.0.9/macos/accounts/export_accounts_to_file/manifest.json`
- canonical `INDEX.jsonl` row `721`

It does not edit product code, does not run product tests, does not execute
runtime IPC, and does not promote any consumer gate.

## Raw Leaf

- command: `export_accounts_to_file`
- raw path: `<source-location>/raw/aimami/1.0.9/macos/accounts/export_accounts_to_file/`
- source binary SOT:
  `<source-location>/source-binary/AiMaMi 1.0.9.app/Contents/MacOS/AiMaMi`
- source SHA-256:
  `1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482`
- raw manifest SHA-256:
  `d381a9893f092320322366d9543c263c49bc880ebe1195c835917a91af0adb3f`

## IDA Chain

IDA health was OK against the same source SHA, with auto-analysis and Hex-Rays
ready.

| Role | Address | Symbol / fact |
|---|---:|---|
| command closure | `0x10032ce58` | `codexmate_lib::commands::account_io::export_accounts_to_file::{closure}::{closure}` |
| wrapper callsite | `0x10032d0cc` | direct call to `export_accounts` |
| core owner | `0x1005ddd0c` | `codexmate_lib::core::account_io::export_accounts` |
| registry metadata | `0x1005ddd58` | checks registry file metadata |
| registry read | `0x1005dddbc` | calls `std::fs::read_to_string::inner` |
| registry decode | `0x1005dde08` | calls `serde_json::de::from_trait` |
| accountKeys filter | `0x1005de060` / `0x1005de158` | builds/checks selected account-field hash set |
| auth snapshot | `0x1005de3f0` | calls `codexmate_lib::core::auth::load_auth_file` |
| hostname | `0x1005de818` | calls `hostname::get` |
| timestamp | `0x1005de91c` | calls `SystemTime::now` |
| export serialize | `0x1005deaa4` / `0x1005df188` / `0x1005df2b0` | serializes `ExportFile` and nested auth records |
| filename normalization | `0x1005df2f0` / `0x1005df3d8` / `0x1005df420` | normalizes target filename |
| atomic write | `0x1005df458` | calls `relay::atomic_write::write_atomic` |

IDB comments were written at the wrapper, owner, and listed leaf/callsite
addresses, and `idb_save` returned OK.

## Frontend / IPC Chain

- frontend CCF: `frontend-control-flow.jsonl` row `1`
- frontend IPC: `ipc-contracts.jsonl` row `14`
- wrapper contract:
  `exportAccountsToFile(targetPath, accountKeys) -> invoke("export_accounts_to_file", { targetPath, accountKeys: accountKeys ?? null })`
- UI asset:
  `<source-location>/raw/aimami/1.0.9/macos/frontend/macos-109-frontend-ccf-found-app/dumped/assets/accounts-page-CJFT2P5o.js`

## Static Behavior

The command closure retrieves the repository state, locks the repository mutex,
copies `targetPath`, copies nullable/vector `accountKeys`, calls the core owner,
formats `CoreError` through Display on failure, and wraps success through
`CoreEnvelope<T>::ok`.

The core owner statically proves this order:

```text
registry metadata/read/decode
  -> optional accountKeys HashSet filter
  -> auth snapshot reads for selected accounts
  -> hostname + SystemTime timestamp capture
  -> ExportFile/nested AuthFile serialization
  -> target filename normalization
  -> relay::atomic_write::write_atomic
```

Branch facts:

- absent/null `accountKeys` exports all registry accounts with readable auth
  snapshots;
- present `accountKeys` filters registry keys before auth snapshot loading;
- missing registry/read/decode/auth/write errors stay in the core error path
  and are formatted by the wrapper;
- success payload is the normalized/written export path plus selected/exported
  account count as recorded in the raw leaf;
- target write uses the shared atomic-write helper, not an ad-hoc direct file
  write.

## Remaining Strict Gaps

This raw leaf strengthens the backend owner/body/call-tree/interface dimension,
but accounts strict/highest gates remain blocked by:

- exact runtime IPC request/response/error envelopes for omitted/null/wrong-type
  `targetPath` and `accountKeys`;
- exact exported JSON bytes under fixture accounts, sensitive-field shapes, timestamp, and
  hostname;
- write-failure residue and atomic temp/rename bytes;
- rendered frontend file-picker/toast/query state under live fixtures;
- executed source archive acceptance mapping;
- independent Windows closure.

## Gate Effect

- `consumerStartReady`: unchanged; accounts remains Gate 1 static only.
- `strictImplementationUse`: `0/9`.
- `readyToImplement`: `0/9`.
- `implementation_use`: false.
- `gate_accepted`: false.
- `full_leaf_100`: false.
- `moduleExitAllowed`: false.

Do not switch modules based on this reducer.
