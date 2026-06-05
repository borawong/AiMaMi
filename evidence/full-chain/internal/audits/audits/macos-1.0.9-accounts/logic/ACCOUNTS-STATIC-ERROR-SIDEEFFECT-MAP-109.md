# Accounts Static Error / Side-Effect Map - AiMaMi 1.0.9

Scope: accounts-only static interface/error/side-effect reducer for AiMaMi
1.0.9 macOS.

This reducer consumes same-version pseudocode grep evidence from:

`<source-location>/intermediate/aimami/1.0.9/macos/accounts/static-error-sideeffect-map/manifest.json`

It creates no runtime proof. It does not promote `consumerStartReady`,
`strictImplementationUse`, `readyToImplement`, `implementation_use`,
`gate_accepted`, or `full_leaf_100`.

## What This Closes

This closes a static wording gap only: error strings and side-effect callsites
are now normalized per accounts command in one current 1.0.9 evidence map.

It does not close exact runtime envelopes, before/after bytes, rollback bytes,
frontend runtime state, executed acceptance, or Windows closure.

## Static Error / Side-Effect Matrix

| Target | Static error / warning strings | Static side-effect callsites | Still missing before strict |
|---|---|---|---|
| `switch_account` | `No AiMaMi registry exists yet`, `Account not found: ...`, `Snapshot file missing: ...`; warning path reaches `CoreEnvelope<T>::ok_with_warnings` with `CLIENT_RESTART_RECOMMENDED` / `Restart Codex clients for the new auth snapshot to take effect.` | `ensure_directories`, backup copy of current auth, target snapshot copy, `persist_registry`, `clear_auto_switch_transient_state`, `auth::load_auth_file`, `auth::make_auth_snapshot`, quota load/find helpers, account summary construction | exact envelope, auth/registry/quota/backup bytes, rollback/no-rollback, visible pure-switch UI-state |
| `switch_account_and_restart_codex` | `Codex restart failed: ...`, `Rollback failed: ...`, `Codex recovery failed: ...`, `RUNTIME_REFRESH_FAILED_AFTER_SWITCH` warning candidate | `capture_switch_rollback_state` before `switch_account_sync`, repeated `FileRestoreState::restore` rollback/recovery helpers, `append_switch_warning`, two relaunch-attempt candidates around rollback/recovery | restart observation, switch-failure rollback bytes, restart/recovery envelope, executed acceptance |
| `preview_account_import` | no command-specific static error string accepted from grep; helper paths prove read/parse boundary | `read_to_string`, `serde_json::de::from_trait`, `read_active_account_key`, `read_registry_or_empty_keys` | missing-path / invalid-json / non-UTF8 envelope, no-write bytes, dialog/loading/toast runtime state |
| `import_accounts_from_file` | `Rebuild registry failed: ...` | `parse_import_file`, `ensure_directories`, input read/metadata, JSON parse, `auth::make_auth_snapshot`, `to_vec_pretty`, `write_atomic`, `rebuild_registry`; static order reaches atomic write before registry rebuild | selectedKeys null/empty/omitted semantics, overwrite conflict envelope, before/after auth/registry/quota/temp bytes, partial write vs rebuild failure bytes, rollback/no-rollback |
| `export_accounts_to_file` | `No AiMaMi account registry found yet`, `No accounts to export` | registry read, `auth::load_auth_file`, `hostname::get`, serde serialize map/struct calls, `write_atomic`; static path proves output assembly candidate only | accountKeys null/empty/omitted semantics, exact export JSON bytes, existing target overwrite behavior, target write failure envelope, temp residue/no-write bytes |
| `logout` | none accepted from grep | `ensure_directories`, `std::sys::fs::copy`, `std::sys::fs::remove_file`, `CoreEnvelope<T>::ok` | active/no-active envelope, auth backup/delete bytes, snooze/registry bytes, terminal frontend CCF/UI-state |
| `remove_accounts` | `Cannot remove the currently active account snapshot.`, `No local account registry found yet.`, `No accounts found for keys: ...` | active-account guard before deletion, metadata-gated `std::sys::fs::remove_file` delete candidate, remove-file error appears non-fatal/static drop candidate, `persist_registry`, `quota_store::load`/retain/`save`, `clear_auto_switch_snooze`, `CoreEnvelope<T>::ok` | missing-field/no-registry/no-match envelope, partial-delete/delete-skip bytes, quota failure bytes, snooze bytes, destructive dialog runtime state |
| `begin_add_account_attach_monitor` | `failed to spawn thread`, `poisoned lock: another task failed inside` | `Repository::load_snapshot_local`, thread spawn closure | terminal frontend CCF/native callback, monitor lifecycle/event trace, re-entry behavior, snapshot/thread lifecycle bytes |
| `import_chatgpt_session_account` | `ChatGPT session JSON missing accessToken`, `ChatGPT session JSON missing account id`, `Account already exists locally. Enable overwrite to replace its saved snapshot.`, `Cannot overwrite the currently active account snapshot.` | `convert_chatgpt_session_to_axonhub_auth`, `ensure_directories`, `to_vec_pretty`, `write_atomic`, `rebuild_registry` | runtime DTO null/default semantics, exact success/error envelope, auth snapshot/registry/temp bytes, rollback/no-write bytes |

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

This map is useful for implementation planning and future fixture design, but
it is not strict upstream parity proof without runtime IPC, exact envelopes,
side-effect bytes, executed acceptance, and independent platform closure.
