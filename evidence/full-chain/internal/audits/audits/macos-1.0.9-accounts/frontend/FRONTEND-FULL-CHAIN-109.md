# Frontend Full Chain - AiMaMi 1.0.9 macOS accounts

Scope: additive frontend/current-source archive consumer chain for the already accepted macOS accounts IDA closure. This file does not promote or change gate state.

## UI entry

- Route/sidebar: `src/components/layout/sidebar.tsx` route `accounts`.
- Page: `src/components/accounts/accounts-page.tsx`.
- Primary actions: list, switch/restart, remove, logout, add-account monitor, preview import, import, export, snapshot refresh.

## API and invoke chain

- `api.loadSnapshot(false|true)` -> `invoke("load_snapshot")`.
- `api.switchAccountAndRestartCodex(accountKey)` -> `invoke("switch_account_and_restart_codex")`.
- `api.removeAccounts(accountKeys)` -> `invoke("remove_accounts")`.
- `api.logout()` -> `invoke("logout")`.
- `api.beginAddAccountAttachMonitor()` -> `invoke("begin_add_account_attach_monitor")`.
- `api.previewAccountImport(filePath)` -> `invoke("preview_account_import")`.
- `api.importAccountsFromFile(filePath, overwriteExisting, selectedKeys?)` -> `invoke("import_accounts_from_file")`.
- `api.exportAccountsToFile(targetPath, accountKeys?)` -> `invoke("export_accounts_to_file")`.

Backend command binding is `src-tauri/src/commands/accounts.rs`, with restart support through `src-tauri/src/commands/system.rs`, into `src-tauri/src/core/accounts.rs` and `src-tauri/src/core/repository.rs`.

## Shell load and state effects

- `src/main-app.tsx` calls `useCoreSnapshot()`.
- Shell startup tries `api.loadBootstrapState()`, seeds query caches, then calls `api.loadSnapshot(true)`.
- Accounts page consumes shell snapshot when provided and falls back to `loadSnapshot(false)`.
- `usage:refreshed` and `runtime-state-updated` listeners reload snapshot and refresh account/quota state.
- Successful account mutations invalidate or refresh `["accounts"]`, `["runtime-state","display"]`, and quota-history related query keys.

## Current source archive deltas

- Current source archive import/export carries `selectedKeys` and optional `accountKeys`; this addresses the older DTO parity gap in the current frontend chain.
- Visible add-account flow is `logout` -> `restart_codex` -> `begin_add_account_attach_monitor`; the monitor command itself is local snapshot/preflight plus scheduled refresh.

