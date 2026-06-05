# Accounts ChatGPT Session Backend Proof - AiMaMi 1.0.9

Scope: AiMaMi 1.0.9 macOS accounts-only backend proof for
`import_chatgpt_session_account`.

This reducer consumes the raw backend bundle:

`<source-location>/intermediate/aimami/1.0.9/macos/accounts/import-chatgpt-session-account-backend-owner-pseudocode-calltree/`

It is now paired with the helper-leaf reducer:

`<source-location>/intermediate/aimami/1.0.9/macos/accounts/import-chatgpt-session-helper-leaf-pseudocode/`

and the subhelper-leaf reducer:

`<source-location>/intermediate/aimami/1.0.9/macos/accounts/import-chatgpt-session-subhelper-leaf-pseudocode/`

It does not add product code, does not run product tests, and by itself does
not promote `consumerStartReady`, `strictImplementationUse`,
`readyToImplement`, `implementation_use`, `gate_accepted`, or
`full_leaf_100`. The later Gate 1 static closure reducer supersedes the old
blocked-start wording for the whole ChatGPT import leaf; this backend proof by
itself remains non-promoting.

## Raw Evidence

- `INDEX.jsonl` row: `509`
- Helper `INDEX.jsonl` row: `513`
- Subhelper `INDEX.jsonl` row: `515`
- Manifest:
  `<source-location>/intermediate/aimami/1.0.9/macos/accounts/import-chatgpt-session-account-backend-owner-pseudocode-calltree/manifest.json`
- Source app SOT:
  `<source-location>/source-binary/AiMaMi 1.0.9.app`
- Source app SHA256:
  `1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482`
- Arm64 thin SHA256:
  `985dae00be620b21164b4a8d35cc0379b750d5a6257b25897b0e813441e4d706`

Ghidra decompiled 4/4 requested target rows with 0 misses:

| Address | Role | Matched function |
|---|---|---|
| `0x10032d430` | command closure, shared locator with import file closure area | `codexmate_lib::commands::account_io::import_chatgpt_session_account::{{closure}}::{{closure}}` |
| `0x10032dbf0` | command closure | `codexmate_lib::commands::account_io::import_chatgpt_session_account::{{closure}}::{{closure}}` |
| `0x1005e1d6c` | core body | `codexmate_lib::core::account_io::import_chatgpt_session` |
| `0x1005e2974` | core closure | `codexmate_lib::core::account_io::import_chatgpt_session::{{closure}}` |

## Backend Behavior Now Proven

The command closure retrieves Tauri state and calls:

```text
core::account_io::import_chatgpt_session(sessionJson, overwriteExisting)
```

The core body statically proves the following backend path:

- convert ChatGPT session JSON through
  `auth::convert_chatgpt_session_to_axonhub_auth`;
- conversion helper parses JSON with serde, accepts camelCase and snake_case
  sensitive-field/account variants, synthesizes Codex/AxonHub auth fields, and statically
  exposes invalid JSON, missing access sensitive-field, id-sensitive-field build failure, and
  missing account id errors;
- nested session object discovery is reduced through
  `find_session_like_object::visit`;
- the relevant `BuildHasher::hash_one` and chrono timestamp helpers are reduced
  for account-field / `exp` lookup and `iat` / `exp` / `last_refresh`
  derivation;
- ensure account directories with `CodexPaths::ensure_directories`;
- validate the converted account field with `is_valid_account_key`;
- read existing registry keys through `read_registry_or_empty_keys`;
- read the active account field through `read_active_account_key`;
- reject an existing local account when `overwriteExisting=false` with:
  `Account already exists locally. Enable overwrite to replace its saved snapshot.`;
- reject overwriting the active account snapshot with:
  `Cannot overwrite the currently active account snapshot.`;
- serialize the auth file through `serde_json::ser::to_vec_pretty`;
- write the snapshot through `relay::atomic_write::write_atomic`;
- rebuild the registry through `repository::Repository::rebuild_registry`.

This closes the previous macOS backend-owner/body gap for the current
ChatGPT session import boundary. It also proves that old
`import_accounts_from_file` is not the implementation body for this command.

## Remaining Backend Gaps

The raw call-tree is useful but not full-leaf complete. It still has unresolved
or terminal-only leaves:

- runtime success bytes and envelopes for
  `auth::convert_chatgpt_session_to_axonhub_auth`
- `platform::paths::CodexPaths::ensure_directories`
- runtime side-effect bytes for hash/timestamp-dependent branches
- `Result::unwrap`
- `tauri::state::StateManager::try_get`

The bundle reaches persistence-related terminals
`serde_json::ser::to_vec_pretty`, `relay::atomic_write::write_atomic`, and
`repository::Repository::rebuild_registry`, but exact before/after bytes,
rollback/no-write behavior, runtime envelopes, frontend runtime consumption,
and executed acceptance are not present.

Static side-effect branch detail now reduced for fixture planning:

- parse/conversion failures, invalid converted field, existing-account conflict
  with `overwriteExisting=false`, active-account overwrite rejection, and
  serialization failure all occur before the snapshot write terminal in static
  pseudocode;
- `write_atomic` failure prevents registry rebuild, but temp file cleanup and
  exact no-write bytes are runtime-only;
- `rebuild_registry` failure occurs after the snapshot write terminal, so the
  exact partial-write/rollback behavior requires executed before/after bytes.

This is a static no-promotion side-effect boundary. It does not replace
accepted runtime byte fixtures.

## Gate Effect

Backend dimension is reduced:

- `accepted_backend_owner=true`
- `accepted_backend_body_pseudocode=true`
- `backend_calltree_present=true`

Current consumer gate effect after the Gate 1 reducer:

- `consumerStartReady=true` for Gate 1 static context only
- `consumerStartBlocked=false` for Gate 1 static context only
- `strictImplementationUse=false`
- `readyToImplement=false`
- `implementation_use=false`
- `gate_accepted=false`
- `full_leaf_100=false`

This target remains blocked before strict/highest gates because exact DTO
runtime semantics, happy path execution, boundary/error paths, side-effect byte
proof, frontend runtime consumption, acceptance execution, and independent
platform closure are still missing.

The acceptance draft now exists separately, but it is not executed and cannot
replace accepted runtime fixture output.
