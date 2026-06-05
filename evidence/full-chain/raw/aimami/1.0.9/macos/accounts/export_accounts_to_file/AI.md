# AI Handoff - export_accounts_to_file

## Target

- Product: AiMaMi
- Version: 1.0.9
- Platform: macOS
- Module: accounts
- Command: `export_accounts_to_file`
- Source binary SOT:
  `<source-location>/source-binary/AiMaMi 1.0.9_ida.app/Contents/MacOS/AiMaMi`
- Source SHA-256:
  `1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482`

## IDA Evidence

IDA health was OK on the local IDB for the same source binary path. Auto
analysis and Hex-Rays were ready.

- Command closure owner: `0x10032ce58`
  `codexmate_lib::commands::account_io::export_accounts_to_file::{closure}::{closure}`
- Wrapper-to-core callsite: `0x10032d0cc`
- Core owner: `0x1005ddd0c`
  `codexmate_lib::core::account_io::export_accounts`
- `xrefs_to(0x1005ddd0c)` returned one code xref from `0x10032d0cc` inside
  command closure `0x10032ce58`.
- `xrefs_to(0x10032ce58)` returned the Tokio blocking task poll caller.
- IDB comments were written at:
  `0x10032ce58`, `0x10032d0cc`, `0x1005ddd0c`, `0x1005ddd58`,
  `0x1005dddbc`, `0x1005dde08`, `0x1005de060`, `0x1005de3f0`,
  `0x1005de818`, `0x1005de91c`, `0x1005deaa4`, `0x1005df188`,
  `0x1005df2b0`, `0x1005df3d8`, `0x1005df458`.
- `idb_save` returned OK for the active IDB.

## Frontend / Interface

- Frontend control-flow row:
  `raw/aimami/1.0.9/macos/frontend/macos-109-frontend-ccf-found-app/frontend/frontend-control-flow.jsonl` row 1.
- IPC contract row:
  `raw/aimami/1.0.9/macos/frontend/macos-109-frontend-ccf-found-app/frontend/ipc-contracts.jsonl` row 14.
- Wrapper: `exportAccountsToFile(t, e)`.
- Command: `export_accounts_to_file`.
- Arg keys: `targetPath`, `accountKeys`.
- Frontend argument normalization: `accountKeys: e ?? null`.

## Backend Chain

- Wrapper state lookup: `tauri::state::StateManager::try_get`.
- Mutex: `std::sys::pal::unix::sync::mutex::Mutex::lock`.
- Poisoned mutex message:
  `poisoned lock: another task failed inside`.
- Core call: `0x10032d0cc -> 0x1005ddd0c`.
- Registry existence/read/decode:
  `std::sys::fs::metadata`, `std::fs::read_to_string::inner`,
  `serde_json::de::from_trait`.
- Selection filter:
  HashSet extend plus `BuildHasher::hash_one` membership checks for
  `accountKeys`.
- Snapshot/auth read:
  `codexmate_lib::core::auth::load_auth_file` at callsite `0x1005de3f0`.
- Export metadata:
  `hostname::get` at `0x1005de818`; `SystemTime::now` at `0x1005de91c`.
- JSON construction:
  serialize-map calls beginning at `0x1005deaa4`, nested `AuthFile`
  serialization at `0x1005df188`, serializer end near `0x1005df2b0`.
- Filename normalization:
  `Path::file_name`, UTF-8 conversion, `trim_end_matches` at
  `0x1005df3d8`, `PathBuf::set_file_name`.
- Persistence:
  `relay::atomic_write::write_atomic` at `0x1005df458`.

## Still Missing

These gaps keep accounts below strict implementation use:

- exact runtime IPC request/response/error envelopes;
- direct IPC omitted/null/wrong-type behavior for `targetPath` and
  `accountKeys`;
- runtime matrix for `accountKeys=null`, empty array, non-empty array,
  duplicate keys, unknown keys, and invalid element types;
- exact exported JSON bytes, field ordering as emitted at runtime, escaping,
  timestamp format, hostname fallback, and null/optional account field mapping;
- target filename normalization bytes for extension/no-extension/path edge
  cases;
- overwrite/write-failure envelope and temp/no-write residue;
- snapshot missing/read-failure runtime envelopes and row-level error array
  shape;
- frontend runtime save-dialog close/toast/loading/query-invalidation state;
- executed upstream acceptance mapping;
- non-macOS closure outside this macOS leaf.

## Gate

Accepted static IDA raw leaf only:

- `strictImplementationUse=false`
- `readyToImplement=false`
- `implementation_use=false`
- `gate_accepted=false`
- `full_leaf_100=false`
- `moduleExitAllowed=false`

