# Accounts Backend Helper Gap Status - AiMaMi 1.0.9

Scope: accounts-only backend helper gap cleanup for the current AiMaMi 1.0.9
macOS bundle.

This reducer consumes existing raw evidence only. It writes no raw evidence,
appends no `<source-location>/INDEX.jsonl` row,
edits no regulations, and promotes no gate.

## Consumed Evidence

- `<source-location>/intermediate/aimami/1.0.9/macos/accounts/backend-owner-pseudocode-calltree/manifest.json`
- `<source-location>/intermediate/aimami/1.0.9/macos/accounts/calltree-helper-leaf-pseudocode/manifest.json`
- `<source-location>/intermediate/aimami/1.0.9/macos/accounts/preview-import-helper-leaf-pseudocode/manifest.json`
- `<source-location>/intermediate/aimami/1.0.9/macos/accounts/import-chatgpt-session-subhelper-leaf-pseudocode/manifest.json`

## Helper Status

| Helper / gap | Current status | Gate effect |
|---|---|---|
| `core::hash::BuildHasher::hash_one` | Same-version macOS static pseudocode and call-tree evidence is accepted in row 515 under `import-chatgpt-session-subhelper-leaf-pseudocode`. This updates the old wording: the hash helper itself is no longer missing as a static helper. Legacy call-site runtime branch semantics, persistence bytes, and exact envelopes for `import_accounts_from_file`, `export_accounts_to_file`, and `remove_accounts` remain missing. | No promotion |
| `Result::unwrap` | Preview/export display-formatting panic guards are reduced by `ACCOUNTS-DISPLAY-UNWRAP-PANIC-GUARD-STATIC-109.md`. Other generic panic/display terminals remain non-primary and are not business leaves or strict closure. | No promotion |
| `tauri::state::StateManager::try_get` | Present on the `import_chatgpt_session_account` command closure route as a generic Tauri state accessor. Current evidence is enough to preserve backend owner mapping into core, but does not reduce the helper body or absent-state error envelope. | No promotion |

## Corrected Wording

Use this wording going forward:

- Hash helper static pseudocode is present through the row 515
  `BuildHasher::hash_one` reduction.
- Legacy accounts call-sites that use hash lookups still lack runtime branch
  semantics, before/after side-effect bytes, and executed acceptance.
- Generic panic/display terminals and `StateManager::try_get` remain
  non-primary helpers and must not be used to claim strict leaf closure.
  Preview/export display unwrap guards are narrowed statically only.

## Gate Decision

Accounts current Gate 1 state:

- `consumerStartReady`: accounts total is `9/9` for Gate 1 static context only;
  strict/highest remains blocked.
- `consumerStartBlocked`: `0/9` for Gate 1 static context only.
- `strictImplementationUse`: `0` for accounts.
- `readyToImplement`: `0` for accounts.
- `implementation_use`: false.
- `gate_accepted`: false.
- `full_leaf_100`: false.
- `moduleExitAllowed`: false.

The next useful accounts proof remains runtime / acceptance evidence for a
low-risk target such as `preview_account_import`, not more generic helper
label cleanup.
