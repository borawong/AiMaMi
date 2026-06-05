# Accounts Export Accounts IDB Owner / Callsite Correction - AiMaMi 1.0.9

Scope: accounts-only same-version macOS AiMaMi 1.0.9 static correction for
`export_accounts_to_file` IDB owner and callsite labels.

This reducer uses the IDB-first method fused into
`${CODEX_HOME:-$HOME/.codex}/skills/rust-reverse-pipeline/SKILL.md`: owner lookup,
decompile, callees/xrefs, interface read, and inline IDB writeback. It writes
no raw/intermediate artifact, appends no `INDEX.jsonl` row, edits no product
code or rule/spec file, runs no product test, and does not promote any gate.

## Evidence

- SOT binary root:
  `<source-location>/source-binary/`
- IDA source:
  `<source-location>/source-binary/AiMaMi 1.0.9_ida.app/Contents/MacOS/AiMaMi.i64`
- IDA input universal SHA:
  `1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482`
- Blocking command body/function start:
  `0x10032ce58`
  `codexmate_lib::commands::account_io::export_accounts_to_file::{closure}::{closure}`
- Core owner:
  `0x1005ddd0c`
  `codexmate_lib::core::account_io::export_accounts`
- Core-owner callsite inside the blocking command body:
  `0x10032d0cc`

## Correction

The prior reducer
`logic/ACCOUNTS-EXPORT-ACCOUNTS-ACCOUNTKEYS-WRITE-STATIC-109.md` used
`0x10032d0cc` as the command body label. IDB direct query shows that address
is the callsite from the blocking command body to the core owner, not the
function start.

Correct labels:

```text
0x10032ce58 = export_accounts_to_file blocking command body/function start
0x10032d0cc = callsite inside 0x10032ce58 to core export_accounts
0x1005ddd0c = core export_accounts owner
```

## Interface Boundary

IDA decompilation of `0x10032ce58` narrows the wrapper/body boundary:

- obtains app state through `tauri::state::StateManager::try_get`;
- locks the shared state mutex;
- uses the poisoned-lock string
  `poisoned lock: another task failed inside`;
- copies `targetPath` bytes from the command request storage;
- copies the optional/vector `accountKeys` storage from the command request;
- calls core owner `0x1005ddd0c` at callsite `0x10032d0cc`;
- formats non-success `CoreError` through its Display implementation;
- wraps backend success through `CoreEnvelope<T>::ok`.

This correction preserves the previously accepted static semantics for
`accountKeys`, no-registry/no-accounts branches, export payload construction,
target filename normalization, and atomic write handoff. It only fixes the IDB
owner/callsite pointer so future consumers start from the right function.

## IDB Writeback

Inline IDB comments were written at:

- `0x10032ce58`: blocking command body/function start;
- `0x10032d0cc`: callsite, not owner;
- `0x1005ddd0c`: core owner.

`idb_save` returned OK for:
`<source-location>/source-binary/AiMaMi 1.0.9_ida.app/Contents/MacOS/AiMaMi.i64`.

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
