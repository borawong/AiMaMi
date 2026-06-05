# Frontend current source archive consumer chain - accounts 1.0.9

Scope: supplemental frontend implementation mapping only. It does not rewrite the existing accounts gate state. Current repository baseline was refreshed with `git fetch origin --prune`; checked branch `master` equals `origin/master` at `8327295d0233933a8fcbf2dda24e5bd56fc61693`.

## Current source archive entrypoints

All paths below are current source archive source paths, not raw upstream frontend proof:

- `src/components/accounts/accounts-page.tsx`
- `src/lib/api.ts`
- `src/components/accounts/accounts-page.test.tsx`

## Command chain

| upstream leaf | current source archive frontend chain | TanStack/state behavior | consumer note |
|---|---|---|---|
| `switch_account` | API wrapper exists: `api.switchAccount(accountKey)` -> `invoke("switch_account", {accountKey})`; visible `AccountsPage` does not use it. | None in visible page. | Backend full leaf exists, but current source archive visible page consumes restart variant. |
| `switch_account_and_restart_codex` | account row action -> confirm state `confirmSwitchAccount` -> `useMutation` -> `api.switchAccountAndRestartCodex(accountKey)` -> `invoke("switch_account_and_restart_codex", {accountKey})`. | On success closes confirm, shows toast, no broad query invalidation in mutation body. Busy is `switchAction.busy || switchMutation.isPending`. | Current visible switch path. |
| `preview_account_import` | toolbar import action -> Tauri dialog `open()` -> `api.previewAccountImport(filePath)` -> `invoke("preview_account_import", {filePath})`. | On success stores `ImportPreviewPayload` in local `importPreview`; error toast unless dialog cancelled. | Dialog cancel is frontend-only `CANCELLED`, not backend error. |
| `import_accounts_from_file` | import preview dialog submit -> `api.importAccountsFromFile(filePath, overwriteExisting, selectedKeys)` -> `invoke("import_accounts_from_file", {filePath, overwriteExisting, selectedKeys})`. | On success closes preview, invalidates account caches, shows import result toast with warnings. | Current source archive includes `selectedKeys`; do not drop it. |
| `export_accounts_to_file` | export selection/risk dialog -> Tauri dialog `save()` -> `api.exportAccountsToFile(filePath, submittedKeys)` -> `invoke("export_accounts_to_file", {targetPath, accountKeys})`. | On success closes risk dialog, clears submitted keys, shows success/partial warning toast. | Current source archive uses selected account keys, not always all accounts. |
| `logout` | add-account mutation first step -> `api.logout()` -> `invoke("logout")`. | Sequenced in one mutation with restart and monitor attach; success toast says current account logged out. | No standalone visible logout button in current accounts page. |
| `remove_accounts` | account remove confirmation -> `useMutation` -> `api.removeAccounts([accountKey])` -> `invoke("remove_accounts", {accountKeys:[accountKey]})`. | On success clears pending remove + selected field, invalidates account caches, success toast. | Current visible UI removes one selected account per action. |
| `begin_add_account_attach_monitor` | add-account mutation third step -> `api.beginAddAccountAttachMonitor()` -> `invoke("begin_add_account_attach_monitor")`; preceding frontend sequence is `logout()` then `restartCodex()`. | On success closes add dialog, invalidates account caches, success toast. Busy is `addAction.busy || addMutation.isPending`. | Current source archive inserted `restart_codex` before monitor attach; keep this delta explicit. |
| `import_chatgpt_session_account` | not found in current visible `AccountsPage` source in this pass; upstream raw/backend full leaf exists. | No current page TanStack path found. | Treat as backend-ready but current source archive frontend route absent unless another feature surface owns it. |

## Platform scope

This mapping is frontend/current-source archive only and can be consumed by both macOS and Windows implementation work where the same current source archive source is used. It does not prove same-platform backend behavior; backend platform gates stay in `macos-1.0.9-accounts` and `windows-1.0.9-accounts`.
