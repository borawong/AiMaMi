# Frontend Full Chain - AiMaMi 1.0.9 Windows system

Scope: additive frontend/current-source archive consumer chain for the Windows system bundle. This file records shell and UI paths and does not change gate state.

## UI entry

- Settings page: `src/components/settings/settings-page.tsx`.
- Maintenance page: `src/components/maintenance/maintenance-page.tsx`.
- Main shell: `src/main-app.tsx`.

## API and invoke chain

- `api.loadSnapshot(true|false)` -> `invoke("load_snapshot")`.
- `api.loadBootstrapState()` -> `invoke("load_bootstrap_state")`.
- `api.forceKillCodex()` -> `invoke("force_kill_codex")`.
- `api.resetCodexConfig()` -> `invoke("reset_codex_config")`.
- `api.getImageCompat()` -> `invoke("get_image_compat")`.
- `api.setImageCompat(enabled)` -> `invoke("set_image_compat")`.
- `api.getSystemInfo()` -> `invoke("get_system_info")`.
- `api.checkUpdateInstallability()` -> `invoke("check_update_installability")`.

Backend binding is `src-tauri/src/commands/system.rs` into `src-tauri/src/core/repository.rs`, `src-tauri/src/platform/process.rs`, `src-tauri/src/platform/update.rs`, and usage refresh daemon helpers.

## Shell load and state effects

- `src/main-app.tsx` startup calls `useCoreSnapshot()`.
- Startup first tries `load_bootstrap_state`, seeds bootstrap caches, then loads `load_snapshot(true)`.
- `usage:refreshed`, `runtime-state-updated`, and manual full refresh reload runtime snapshot.
- `src-tauri/src/lib.rs` setup creates the main window, starts usage refresh daemon scheduling, registers single-instance behavior, tray setup, and app lifecycle handlers.
- `reset_codex_config`/clean/rebuild style maintenance actions invalidate broad query state.

## Platform note

- Windows has no `has_notch`/notch UI path.
- Current Windows package has `force_kill_codex` as strict-only in gate-report because upstream dim1 is product-decision/internal-helper; current source archive does expose a MaintenancePage UI/API path.

