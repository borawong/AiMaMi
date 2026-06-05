# Frontend Full Chain - AiMaMi 1.0.9 macOS bootstrap

Scope: additive frontend/current-source archive shell entry map for macOS bootstrap. This file does not promote the bootstrap gate.

## Shell entry

- `src-tauri/src/lib.rs` performs Tauri setup, main window lifecycle, tray setup, managed state registration, daemon startup, and single-instance activation.
- `src/main-app.tsx` performs React bootstrap via `useCoreSnapshot()`.

## Frontend startup sequence

1. `api.loadBootstrapState()` -> `invoke("load_bootstrap_state")`.
2. Seed query cache slices from bootstrap payload.
3. `api.loadSnapshot(true)` -> `invoke("load_snapshot")`.
4. Register listeners for `usage:refreshed`, `runtime-state-updated`, `tray:navigate`, and auto-switch pending events.

## Current gate boundary

The canonical macOS bootstrap package is consumerStartReady only. `system-shell-init` is a local outtake and must not be consumed as a gate source.

