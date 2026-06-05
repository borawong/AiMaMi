# Accounts 1.0.9 Frontend Static UI Branch Matrix

Target: AiMaMi `1.0.9` macOS accounts only.

Raw evidence:

`<source-location>/intermediate/aimami/1.0.9/macos/accounts/frontend-static-ui-branch-matrix/manifest.json`

Source inputs:

- `<source-location>/raw/aimami/1.0.9/macos/frontend/macos-109-frontend-ccf-found-app/dumped/assets/accounts-page-CJFT2P5o.js`
- `<source-location>/raw/aimami/1.0.9/macos/frontend/macos-109-frontend-ccf-found-app/dumped/assets/index-CL22l5v8.js`
- `<source-location>/intermediate/aimami/1.0.9/macos/accounts/frontend-ccf-accounts-repair/relocated-raw-bundle/frontend/frontend-control-flow.jsonl`
- `<source-location>/intermediate/aimami/1.0.9/macos/accounts/frontend-absence-proof/manifest.json`

## Result

This reducer adds a consumer-readable static frontend UI branch matrix for the
legacy eight-command accounts subset. The current accounts universe is 9 rows;
the ninth current row, `import_chatgpt_session_account`, is covered by the
separate ChatGPT session frontend/DTO/side-effect reducers. This file does not
execute AiMaMi, does not enter a live WebView, and does not invoke a Tauri
command at runtime.

The matrix confirms 5 partial UI branches:

| Target | Static branch result |
|---|---|
| `switch_account_and_restart_codex` | Selected account detail opens switch confirm dialog; confirm calls `W.switchAccountAndRestartCodex(accountKey)`; success toast consumes `activeAccount.email`; active account and pending states disable the action. |
| `preview_account_import` | Import button opens native file picker with JSON filter, calls `W.previewAccountImport(filePath)`, and opens preview dialog on success. Cancel is swallowed; preview error is destructive toast. |
| `import_accounts_from_file` | Preview dialog confirm passes `overwriteExisting` and `selectedKeys`; success closes preview, clears preview state, invalidates `quota-history`, and shows success/warning/import-nothing toast. |
| `export_accounts_to_file` | Export button opens export confirm, then native save dialog, then calls `W.exportAccountsToFile(targetPath, accountKeys)`; success clears export state and shows toast. |
| `remove_accounts` | Selected account detail opens destructive confirm; confirm calls `W.removeAccounts([accountKey])`; active account remove is disabled; success clears selection and shows toast. |

The matrix preserves 3 wrapper-only / absence rows:

| Target | Static branch result |
|---|---|
| `switch_account` | Global wrapper exists, but accounts page has no visible pure-switch terminal callsite. |
| `logout` | Global wrapper exists, but accounts page has no visible terminal callsite. |
| `begin_add_account_attach_monitor` | Global wrapper exists, but accounts page has no visible terminal callsite. |

## Gate Effect

This is same-version frontend static evidence only. It reduces ambiguity for
future runtime acceptance scripts, but it is not accepted frontend runtime/UI
proof and cannot promote accounts.

Still false:

- `strictImplementationUse`
- `readyToImplement`
- `implementation_use`
- `gate_accepted`
- `full_leaf_100`
- `moduleExitAllowed`

Remaining blockers: real AiMaMi `1.0.9` WKWebView/Tauri IPC invocation, exact
request/response/error envelopes, durable side-effect bytes, rollback/no-write
fixtures, executed source archive acceptance, and independent Windows closure.
