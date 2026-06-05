# Accounts Backend Side-Effect Gap Refinement - AiMaMi 1.0.9

Scope: accounts-only current AiMaMi 1.0.9 macOS static backend side-effect
boundary refinement for legacy accounts leaves and the current ChatGPT session
import boundary.

This file consumes existing backend owner/call-tree/helper raw only. It creates
no raw evidence, appends no `INDEX.jsonl` row, edits no regulations, runs no
product tests, and promotes no gate.

## Evidence Consumed

- `<source-location>/intermediate/aimami/1.0.9/macos/accounts/backend-owner-pseudocode-calltree/manifest.json`
- `<source-location>/intermediate/aimami/1.0.9/macos/accounts/calltree-helper-leaf-pseudocode/manifest.json`
- `<source-location>/intermediate/aimami/1.0.9/macos/accounts/preview-import-helper-leaf-pseudocode/manifest.json`
- `<source-location>/intermediate/aimami/1.0.9/macos/accounts/import-chatgpt-session-account-backend-owner-pseudocode-calltree/manifest.json`
- `<source-location>/intermediate/aimami/1.0.9/macos/accounts/import-chatgpt-session-helper-leaf-pseudocode/manifest.json`
- `<source-location>/intermediate/aimami/1.0.9/macos/accounts/import-chatgpt-session-subhelper-leaf-pseudocode/manifest.json`

## Static Side-Effect Map

| Target | Static side-effect boundary now reduced | Still missing before strict |
|---|---|---|
| `switch_account` | directory ensure, registry missing/account missing/snapshot missing branches, current-auth backup copy, target snapshot copy, `persist_registry`, `clear_auto_switch_transient_state`, auth load/snapshot, quota load/find, summary construction, `CLIENT_RESTART_RECOMMENDED` warning envelope candidate | accepted visible pure-switch UI, exact success/warning/error envelope, auth/registry/quota/backup before-after bytes, rollback/no-rollback, executed acceptance |
| `switch_account_and_restart_codex` | `capture_switch_rollback_state`, `switch_account_sync`, restart/recovery branch strings, repeated `FileRestoreState::restore` rollback/recovery helpers, `RUNTIME_REFRESH_FAILED_AFTER_SWITCH` warning candidate, two relaunch-attempt candidates | runtime restart/process trace, restore before-after bytes, refresh warning envelope, rollback/no-rollback, executed acceptance |
| `preview_account_import` | `parse_import_file`, `read_registry_or_empty_keys`, `read_active_account_key`; static read/parse/classify path only | runtime IPC, exact envelopes, no-write bytes, UI state, executed acceptance |
| `import_accounts_from_file` | directory ensure, input read/metadata, JSON parse, auth snapshot creation, registry rebuild, atomic write path | `selectedKeys` null/empty/omitted runtime semantics, overwrite conflict envelopes, before/after bytes, rollback/no-rollback, executed acceptance |
| `export_accounts_to_file` | registry/auth snapshot read, `auth::load_auth_file`, hostname read, JSON serialization, atomic output write | `accountKeys` null/empty/missing runtime semantics, overwrite/write failure envelopes, exact output/temp bytes, executed acceptance |
| `logout` | directory ensure, auth file metadata, timestamped backup name join, backup copy, auth file removal, registry load/persist, two `clear_auto_switch_snooze` candidates, `CoreEnvelope<T>::ok` | terminal frontend UI-state, active/no-active envelopes, backup/delete bytes, snooze/registry bytes, executed acceptance |
| `remove_accounts` | active-account guard before deletion, no-match error candidate, registry load/persist, snapshot metadata/remove_file, remove_file error non-fatal/drop candidate, quota load/retain/save, `clear_auto_switch_snooze`, success envelope candidate | missing-field/no-registry/no-match/partial-delete/quota failure envelopes, delete/skip bytes, quota/snooze bytes, destructive UI-state acceptance |
| `begin_add_account_attach_monitor` | mutex lock/unlock, poisoned-lock error string, `Repository::load_snapshot_local`, thread spawn closure, failed spawn string, Tauri command closure caller candidate | accepted UI/native callback, monitor event sequence, snapshot failure/thread lifecycle trace, exact resolver envelope, executed acceptance |
| `import_chatgpt_session_account` | conversion, field validation, registry/active-field reads, conflict checks, `to_vec_pretty`, `write_atomic`, `rebuild_registry` | DTO runtime semantics, success/error envelopes, auth/registry/temp bytes, no-write/partial-write/rollback proof, executed acceptance |

## Important Boundaries

The current raw is useful for implementation planning because it identifies
the static fs / registry / quota / auth / process / monitor terminals and
their approximate branch order. It is not a durable side-effect proof. The
strict gate still requires before/after bytes for success, no-write, partial
write, rollback/no-rollback, and failure-state fixtures.

`BuildHasher::hash_one` is already statically reduced by `INDEX.jsonl` row
`515`; remaining hash-related blockers are runtime branch semantics and bytes,
not a missing static helper body. `Result::unwrap` remains a generic support
frame and does not close business-leaf proof.

`write_atomic` evidence is static-only. It can guide fixture design around temp
file, sync, rename, rename-failure, and temp-removal candidates, but it is not
target-file before/after proof and does not prove rollback or no-rollback.

## Gate Effect

No promotion.

- `consumerStartReady`: accounts total is `9/9` for Gate 1 static context only;
  strict/highest remains blocked.
- `consumerStartBlocked`: `0/9` for Gate 1 static context only.
- `strictImplementationUse`: `0` for accounts.
- `readyToImplement`: `0` for accounts.
- `implementation_use`: false.
- `gate_accepted`: false.
- `full_leaf_100`: false.
- `moduleExitAllowed`: false.
