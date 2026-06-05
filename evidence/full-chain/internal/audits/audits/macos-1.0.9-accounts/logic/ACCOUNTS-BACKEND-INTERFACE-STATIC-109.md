# Accounts Backend Interface Static Reducer - AiMaMi 1.0.9

Scope: accounts-only same-version macOS AiMaMi 1.0.9 backend/interface static
evidence. This reducer consumes the current backend owner/pseudocode/call-tree
producer and summarizes the implementation-facing static boundary. It does not
create raw evidence, does not execute runtime probes, and does not promote any
consumer gate.

Evidence pointer field:
`aimami/1.0.9/macos/accounts/backend-owner-pseudocode-calltree`.

Raw files are referenced through `pointers/evidence-paths.md`; this logic file
keeps only the consumer-readable result.

## Accepted Static Backend Scope

- Same-version AiMaMi 1.0.9 macOS backend owner/pseudocode rows exist for the
  legacy eight accounts targets covered by the backend producer package.
- Same-version raw call-tree rows are accepted by the producer for those legacy
  eight accounts targets.
- Pseudocode is real decompiled Ghidra output, not candidate-only, for those
  legacy eight targets.
- The current accounts universe is 9 rows. The ninth current row,
  `import_chatgpt_session_account`, is covered by separate same-version
  ChatGPT session backend/helper/static reducers and remains blocked before
  strict runtime use.
- Source binding is the AiMaMi 1.0.9 arm64 thin slice SHA
  `985dae00be620b21164b4a8d35cc0379b750d5a6257b25897b0e813441e4d706`,
  derived from the 1.0.9 SOT universal binary SHA
  `1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482`.

This closes only the backend static dimension. It does not close frontend
UI-state, runtime IPC, exact envelopes, side-effect bytes, rollback/no-write
fixtures, executed acceptance, or Windows closure.

## Per-Command Backend Static Matrix

| Command | Backend owner / address | Pseudocode file | Static terminal categories | Unresolved leaves / runtime gaps |
|---|---|---|---|---|
| `switch_account` | `codexmate_lib::core::repository::Repository::switch_account` at `1005e3cd0` | `0001_switch_account_b8aad70d.c` | response serialize; auth/quota/path helper reachability | `auth::current_timestamp`, `auth::load_auth_file`, `auth::make_auth_snapshot`, `platform::paths::CodexPaths::ensure_directories`; runtime registry/quota bytes and rollback missing |
| `switch_account_and_restart_codex` | `codexmate_lib::commands::accounts::switch_account_and_restart_sync` at `1001e6be4` | `0002_switch_account_and_restart_codex_16115849.c` | response serialize; restore/persistence helper | runtime restart/process state, restore bytes, and error envelope missing |
| `preview_account_import` | `codexmate_lib::core::account_io::preview_import` at `1005dd788` | `0003_preview_account_import_0b873145.c` | error return | `Result::unwrap`; runtime missing/invalid fixture envelope and no-write proof missing |
| `import_accounts_from_file` | `codexmate_lib::core::account_io::import_accounts` at `1005dfb6c` | `0004_import_accounts_from_file_ddb23d82.c` | response serialize; persistence commit | `platform::paths::CodexPaths::ensure_directories`, `core::hash::BuildHasher::hash_one`, `auth::make_auth_snapshot`; import bytes, conflict/parse/permission envelopes, rollback missing |
| `export_accounts_to_file` | `codexmate_lib::core::account_io::export_accounts` at `1005ddd0c` | `0005_export_accounts_to_file_16a95718.c` | response serialize; persistence commit | `Result::unwrap`, `auth::load_auth_file`, `core::hash::BuildHasher::hash_one`, `hostname::get`; output bytes, overwrite/error envelope, no-write proof missing |
| `logout` | `codexmate_lib::core::repository::Repository::logout` at `1005f1d84` | `0006_logout_d7a7fe08.c` | response serialize | `platform::paths::CodexPaths::ensure_directories`; active/no-active envelope, auth delete/backup bytes, snooze/registry bytes missing |
| `remove_accounts` | `codexmate_lib::core::repository::Repository::remove_accounts` at `1005e4850` | `0007_remove_accounts_634e350d.c` | response serialize; persistence commit | `core::hash::BuildHasher::hash_one`; missing-field/no-registry/partial-delete/quota failure envelopes and bytes missing |
| `begin_add_account_attach_monitor` | `codexmate_lib::commands::system::begin_add_account_attach_monitor` at `100262db4` | `0008_begin_add_account_attach_monitor_5c9ab575.c` | response serialize; persistence commit | `Result::unwrap`; monitor start/reentry/event sequence, snapshot/thread lifecycle trace missing |

## Interface Boundary Reading

The backend producer's interface map has medium confidence for the legacy
eight-command subset. It identifies owners, pseudocode files, immediate
callees, and call-tree rows, but it does not recover full frontend request
semantics or runtime envelope bytes by itself. It must be read together with
the current `import_chatgpt_session_account` reducers before making any
current 9-row accounts statement.

Static same-version proof can support implementation planning for:

- backend owner selection;
- likely persistence and serialization leaves;
- distinguishing response serialization, error return, and persistence commit
  categories;
- narrowing the next runtime fixture scope.

Static same-version proof cannot support strict implementation use until it is
paired with accepted runtime facts:

- exact request body from the real frontend/Tauri invocation;
- exact success and error envelopes;
- before/after bytes for auth, registry, quota, export/import outputs, and
  temp/no-write paths;
- rollback/no-rollback behavior;
- UI consumption state;
- executed source archive acceptance mapping.

## Gate Decision

- `consumerStartReady`: unchanged.
- `strictImplementationUse`: false for accounts.
- `readyToImplement`: false for accounts.
- `implementation_use`: false.
- `gate_accepted`: false.
- `full_leaf_100`: false.
- `moduleExitAllowed`: false.

Current blocker remains:

`sot_app_present_but_no_accepted_ipc_runtime_harness_or_executed_accounts_acceptance_trace`
