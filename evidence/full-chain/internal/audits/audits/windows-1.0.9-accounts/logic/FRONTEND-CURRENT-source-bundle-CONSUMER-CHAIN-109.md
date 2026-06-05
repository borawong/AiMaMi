# Frontend current source archive consumer chain - accounts 1.0.9 Windows

Scope: supplemental frontend implementation mapping only. It mirrors the current source archive source mapping in the macOS accounts bundle and does not rewrite Windows backend gate state.

Current repository baseline was refreshed with `git fetch origin --prune`; checked branch `master` equals `origin/master` at `8327295d0233933a8fcbf2dda24e5bd56fc61693`.

## Current source archive command paths

- `switch_account`: `api.switchAccount(accountKey)` -> `invoke("switch_account", {accountKey})`; wrapper exists, no visible `AccountsPage` consumer found.
- `switch_account_and_restart_codex`: row action confirm -> `useMutation` -> `api.switchAccountAndRestartCodex(accountKey)` -> `invoke("switch_account_and_restart_codex", {accountKey})`.
- `preview_account_import`: import toolbar -> Tauri `open()` -> `api.previewAccountImport(filePath)` -> `invoke("preview_account_import", {filePath})`.
- `import_accounts_from_file`: import preview submit -> `api.importAccountsFromFile(filePath, overwriteExisting, selectedKeys)` -> `invoke("import_accounts_from_file", {filePath, overwriteExisting, selectedKeys})`.
- `export_accounts_to_file`: export dialog -> Tauri `save()` -> `api.exportAccountsToFile(filePath, submittedKeys)` -> `invoke("export_accounts_to_file", {targetPath, accountKeys})`.
- `logout`: add-account mutation first step -> `api.logout()` -> `invoke("logout")`.
- `remove_accounts`: remove confirmation -> `api.removeAccounts([accountKey])` -> `invoke("remove_accounts", {accountKeys:[accountKey]})`.
- `begin_add_account_attach_monitor`: add-account mutation third step -> `api.beginAddAccountAttachMonitor()` -> `invoke("begin_add_account_attach_monitor")`; current source archive sequence inserts `api.restartCodex()` between `logout` and monitor attach.
- `import_chatgpt_session_account`: no current visible `AccountsPage` consumer found in this pass.

## TanStack and UI state

Switch/remove/add/import/export are `useMutation` paths. Successful destructive/import/export paths update local dialog state, invalidate account caches where the page currently does so, and surface toast messages. Dialog cancellation is frontend-only and must not be implemented as a backend error.

## Platform note

This is a current source archive frontend/source mapping, not Windows backend proof. Windows same-platform proof remains in `windows-1.0.9-accounts`.
