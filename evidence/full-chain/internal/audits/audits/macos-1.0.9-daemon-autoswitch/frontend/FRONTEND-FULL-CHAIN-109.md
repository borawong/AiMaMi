# Frontend Full Chain - AiMaMi 1.0.9 macOS daemon-autoswitch

Scope: additive frontend/current-source archive consumer chain for macOS daemon/autoswitch. This file does not change gate state.

## UI and shell entry

- Shell prompt: `src/main-app.tsx` uses `usePendingAutoSwitchPrompt()` and renders `PendingAutoSwitchDialog`.
- Settings controls: `src/components/settings/settings-page.tsx`.
- CLI/shell daemon entry: `src-tauri/src/lib.rs` handles `daemon-run-once`.

## API and invoke chain

- `api.loadPendingAutoSwitch()` -> `invoke("load_pending_auto_switch")`.
- `api.dismissPendingAutoSwitch()` -> `invoke("dismiss_pending_auto_switch")`.
- `api.confirmPendingAutoSwitch()` -> `invoke("confirm_pending_auto_switch")`.
- `api.confirmPendingAutoSwitchAndRestartCodex()` -> `invoke("confirm_pending_auto_switch_and_restart_codex")`.
- `api.setAutoSwitch(enabled)` -> `invoke("set_auto_switch")`.
- `api.configureAutoSwitch(...)` -> `invoke("configure_auto_switch")`.
- `api.runDaemonOnce()` -> `invoke("run_daemon_once")`.

Backend bindings are split across `src-tauri/src/commands/accounts.rs` and `src-tauri/src/commands/system.rs`, into `AccountManager`, `Repository`, and daemon helpers.

## Shell load and state effects

- `usePendingAutoSwitchPrompt()` loads `load_pending_auto_switch` at shell level.
- The shell listens for `auto-switch-pending`.
- Confirm/dismiss paths update pending prompt state and invalidate accounts/runtime/quota state as needed.
- CLI `daemon-run-once` calls `run_daemon_once_cli()`.
- Native watcher/helper rows are bootstrap or daemon-owned, not visible React button rows.

