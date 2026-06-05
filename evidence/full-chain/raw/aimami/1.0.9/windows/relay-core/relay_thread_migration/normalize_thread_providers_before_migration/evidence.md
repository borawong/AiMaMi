# evidence — normalize_thread_providers_before_migration (Windows)

**VA**: `0x1403EABC0`  
**IDA name**: `normalize_thread_providers_before_migration_sys`  
**Binary SHA**: `a5822387fa3f56dc03893111f4ffdd074daa882e8887ec4e7c394879c0e9fe0b`  
**Size**: 0x1509 bytes (5385 bytes)  
**Source module**: `codex_thread_visibility.rs`  
**Produced**: 2026-06-02 deep-win phase  

## Confirmed

- VA confirmed via 6 unique `[pre-migrate-normalize]` string xrefs → `0x1403EABC0`
- Strings owned: `found`, `update thread`, `commit failed`, `normalized`, `begin tx failed`, `load threads failed`, `read thread columns failed`, `open codex db failed`
- Called ONLY from `switch_account_stop_codex_restart` (0x14014A0)
- Args: `(relay_state_ptr, thread_list_ptr, thread_list_len)`  
- Algorithm:
  1. Opens codex SQLite DB (error: `open codex db failed`)
  2. Reads thread columns (error: `read thread columns failed`)
  3. Loads thread list (error: `load threads failed`)
  4. BEGIN TRANSACTION (error: `begin tx failed`)
  5. Per thread: calls `thread_sqlite_update_router_field_sys` (0x1403D7370) — updates model_provider field
  6. COMMIT (error: `commit failed`)
  7. Logs `normalized N threads` (`[pre-migrate-normalize] normalized`)
- Source module confirms: `codexmate_lib::core::relay::codex_thread_visibility` + `src\core\relay\codex_thread_visibility.rs`
- Calls `sub_1403D6600` (DB handle/connection getter), `sub_1403D7750` (thread table scan)
- Called before `migrate_threads_for_router_with_scope_sys` in the account-switch sequence
- Purpose: normalize thread model_provider values to canonical form before migration runs

## Inferred

- Normalization target: threads with non-canonical model_provider values (e.g. aliased provider names) set to canonical form
- Runs in single transaction for atomicity across all threads
- Does NOT write rollout JSON files — only SQLite UPDATE

## Unknown

- Which model_provider values are non-canonical / normalization rules
- Whether normalization is idempotent (safe to run twice)
