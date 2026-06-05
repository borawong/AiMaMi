# Accounts ChatGPT Session Persistence Leaf Pseudocode - AiMaMi 1.0.9

Scope: accounts-only static persistence reducer for
`import_chatgpt_session_account` in AiMaMi 1.0.9 macOS.

This reducer consumes existing raw evidence only. It creates no raw evidence,
appends no `INDEX.jsonl` row, moves no bundle, edits no regulation, edits no
product code, runs no product test, and promotes no gate.

## Evidence Consumed

- `<source-location>/intermediate/aimami/1.0.9/macos/accounts/import-chatgpt-session-account-backend-owner-pseudocode-calltree/manifest.json`
- `<source-location>/intermediate/aimami/1.0.9/macos/accounts/import-chatgpt-session-helper-leaf-pseudocode/manifest.json`
- `<source-location>/intermediate/aimami/1.0.9/macos/accounts/import-chatgpt-session-subhelper-leaf-pseudocode/manifest.json`
- `<source-location>/intermediate/aimami/1.0.9/macos/accounts/calltree-helper-leaf-pseudocode/manifest.json`

## Static Persistence Chain

| Evidence source | Accepted static fact |
|---|---|
| backend owner pseudocode manifest row | Core path calls `auth::convert_chatgpt_session_to_axonhub_auth`, validates the account field, reads registry and active account state, enforces overwrite/conflict guards, serializes the auth snapshot with `serde_json::ser::to_vec_pretty`, calls `relay::atomic_write::write_atomic`, then calls `repository::Repository::rebuild_registry`. |
| calltree helper pseudocode manifest row for `CodexPaths::ensure_directories` | `CodexPaths::ensure_directories` creates the required Codex directory set through `std::fs::DirBuilder::_create`. |
| calltree helper pseudocode manifest row for `write_atomic` | `write_atomic` rejects missing parent paths, creates parent dirs, constructs a temp path from process id and UUID, opens the temp file, writes, syncs, closes, renames, syncs the parent directory on success, and removes the temp file on rename failure. |
| calltree helper pseudocode manifest row for `Repository::rebuild_registry` | `Repository::rebuild_registry` calls `ensure_directories`, loads the registry, traverses account auth snapshots, and persists the rebuilt registry. |

Static branch order reduced from the consumed pseudocode:

1. Session conversion, account-field validation, active-account overwrite guard,
   and existing-account overwrite guard happen before auth snapshot write.
2. Serialization happens before `write_atomic`; serialization failure prevents
   the snapshot write.
3. `write_atomic` failure prevents `rebuild_registry`.
4. `rebuild_registry` happens after the snapshot write. Exact partial-write,
   rollback/no-rollback, bytes-on-disk, and error envelope behavior still need
   runtime fixtures.

## Gate Effect

Accepted:

- `accepted_static_persistence_leaf_pseudocode`: true.

Current controlling state: the whole `import_chatgpt_session_account` leaf is
Gate 1 static ready through
`logic/ACCOUNTS-CHATGPT-CONSUMER-START-STATIC-CLOSURE-109.md`.

Still not accepted:

- `accepted_runtime_ipc`: false.
- `accepted_envelope`: false.
- `accepted_side_effect_bytes`: false.
- `accepted_acceptance`: false.
- `strictImplementationUse`: false.
- `readyToImplement`: false.
- `implementation_use`: false.
- `gate_accepted`: false.
- `full_leaf_100`: false.
- `moduleExitAllowed`: false.

This reducer lowers only the static persistence-leaf wording gap for
`import_chatgpt_session_account`. It does not independently promote a gate,
does not make accounts strict/ready, and does not allow switching modules.
