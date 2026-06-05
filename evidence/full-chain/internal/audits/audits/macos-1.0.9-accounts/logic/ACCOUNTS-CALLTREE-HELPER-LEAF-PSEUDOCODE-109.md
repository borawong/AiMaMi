# Accounts 1.0.9 Call-tree Helper Leaf Pseudocode

Target: AiMaMi `1.0.9` macOS accounts only.

Raw evidence:

`<source-location>/intermediate/aimami/1.0.9/macos/accounts/calltree-helper-leaf-pseudocode/manifest.json`

Source binary:

`<source-location>/source-binary/AiMaMi 1.0.9.app`

Source SHA256:

`1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482`

## Result

This package decompiled 12 same-version helper leaves that were opaque or
unresolved in the accepted accounts backend call-tree package:

- `platform::paths::CodexPaths::ensure_directories`
- `auth::current_timestamp`
- `auth::load_auth_file`
- `auth::make_auth_snapshot`
- `quota_store::load_or_default`
- `quota_store::load`
- `quota_store::save`
- `quota_store::find_item`
- `relay::atomic_write::write_atomic`
- `repository::Repository::rebuild_registry`
- `FileRestoreState::restore`
- `hostname::get`

Ghidra processed 12 target rows, attempted 12 unique functions, and recorded 0
misses. The raw manifest and file manifest carry the pseudocode file hashes.

## Target Impact

| Target | Helper leaf reduction |
|---|---|
| `switch_account` | Adds same-version pseudocode for directory creation, timestamp, auth loading, auth snapshot, quota load/default, and quota lookup helpers. |
| `switch_account_and_restart_codex` | Adds same-version pseudocode for `FileRestoreState::restore`. |
| `preview_account_import` | No new helper leaf in this package; `Result::unwrap` remains outside this package. |
| `import_accounts_from_file` | Adds same-version pseudocode for directory creation, auth snapshot, registry rebuild, and atomic write. Hash helper coverage remains outside this package. |
| `export_accounts_to_file` | Adds same-version pseudocode for auth loading, hostname lookup, and atomic write. `Result::unwrap` and hash helper coverage remain outside this package. |
| `logout` | Adds same-version pseudocode for directory creation. |
| `remove_accounts` | Adds same-version pseudocode for quota load/save. Hash helper coverage remains outside this package. |
| `begin_add_account_attach_monitor` | No new helper leaf in this package; `Result::unwrap` remains outside this package. |

## Gate Effect

This is backend helper-leaf evidence only. It does not re-run or override the
previous accepted command owner rows and does not promote any consumer gate.

Still false:

- `strictImplementationUse`
- `readyToImplement`
- `implementation_use`
- `gate_accepted`
- `full_leaf_100`
- `moduleExitAllowed`

Remaining blockers are outside this helper package: accepted frontend UI-state,
real AiMaMi `1.0.9` WKWebView/Tauri IPC invocation, exact request/response/error
envelopes, durable side-effect bytes, rollback/no-rollback fixtures, executed source archive
acceptance, and independent Windows closure.
