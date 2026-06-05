# Accounts Acceptance Coverage - AiMaMi 1.0.9

Scope: accounts-only current AiMaMi 1.0.9 macOS acceptance coverage reducer.

This file consumes existing acceptance workorders and draft mappings. It does
not execute fixtures, create raw evidence, append `INDEX.jsonl`, edit
regulations, run product tests, or promote any gate.

## Evidence Consumed

- `<source-location>/intermediate/aimami/1.0.9/macos/accounts/accounts-runtime-acceptance-workorder/manifest.json`
- `<source-location>/intermediate/aimami/1.0.9/macos/accounts/accounts-runtime-acceptance-workorder/targets/accounts-runtime-acceptance-targets.jsonl`
- `<source-location>/intermediate/aimami/1.0.9/macos/accounts/accounts-runtime-acceptance-workorder/targets/accounts-lane-c-preview-import-export-fixture-rows.jsonl`
- `<source-location>/intermediate/aimami/1.0.9/macos/accounts/accounts-runtime-acceptance-workorder/targets/switch-account-strict-full-leaf-fixture-rows.jsonl`
- `<source-location>/intermediate/aimami/1.0.9/macos/accounts/import-chatgpt-session-account-acceptance-draft/manifest.json`
- `<source-location>/intermediate/aimami/1.0.9/macos/accounts/import-chatgpt-session-account-acceptance-draft/targets/fixture-rows.jsonl`
- `logic/CURRENT-ACCEPTANCE-MAPPING-109.md`

## Per-Target Acceptance State

| Target | acceptanceDraftReady | executedAcceptance | Current gate |
|---|---|---|---|
| `switch_account` | true | false | legacy `consumerStartReady` context only |
| `switch_account_and_restart_codex` | true | false | legacy `consumerStartReady` context only |
| `preview_account_import` | true, fixture matrix present | false | legacy `consumerStartReady` context only |
| `import_accounts_from_file` | true | false | legacy `consumerStartReady` context only |
| `export_accounts_to_file` | true | false | legacy `consumerStartReady` context only |
| `logout` | true | false | legacy `consumerStartReady` context only |
| `remove_accounts` | true | false | legacy `consumerStartReady` context only |
| `begin_add_account_attach_monitor` | true | false | legacy `consumerStartReady` context only |
| `import_chatgpt_session_account` | partial draft only, 14 rows | false | Gate 1 static ready only; strict/highest blocked |

## Coverage Decision

The legacy eight accounts leaves have consumer-start acceptance draft coverage:
main paths, high-risk error cases, rollback/no-write expectations, UI state
checks, and file-system checks are present as a workorder matrix. None of these
rows has an executed runtime trace, exact envelope, durable before/after bytes,
or accepted reducer boolean.

`import_chatgpt_session_account` has a 14-row partial draft covering valid
import, invalid JSON, missing sensitive-field/account id, id sensitive-field build failure,
overwrite conflict, active overwrite rejection, invalid field, write failure,
and null/omitted DTO boundaries. Every row remains non-executed; this blocks
strict/highest gates for `import_chatgpt_session_account`.

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

The next valid acceptance-producing evidence is not another draft. It must be
same-version runtime execution through an accepted AiMaMi WKWebView/Tauri IPC
harness, preferably the low-risk `preview_account_import` missing/invalid
fixture first, with command/body, envelope, no-write bytes, UI state, fixture
PASS/FAIL, and reducer acceptance.
