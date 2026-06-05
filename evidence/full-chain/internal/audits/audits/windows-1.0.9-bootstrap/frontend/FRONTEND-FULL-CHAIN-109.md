# Frontend Full Chain - AiMaMi 1.0.9 Windows bootstrap

Scope: additive frontend/current-source archive shell entry map for Windows bootstrap. This file does not promote the bootstrap gate.

## Shell entry

- `src-tauri/src/lib.rs` performs Tauri setup, main window lifecycle, tray setup, managed state registration, daemon startup, and single-instance activation.
- `src/main-app.tsx` performs React bootstrap via `useCoreSnapshot()`.

## Frontend startup sequence

1. `api.loadBootstrapState()` -> `invoke("load_bootstrap_state")`.
2. Seed query cache slices from bootstrap payload.
3. `api.loadSnapshot(true)` -> `invoke("load_snapshot")`.
4. Register listeners for `usage:refreshed`, `runtime-state-updated`, `tray:navigate`, and auto-switch pending events.

## Current gate boundary

The Windows bootstrap package is currently partial/candidate in `data/task-plan.json`. The IDA MCP is now available in this session, so bootstrap can be promoted only after same-platform run/setup, thread spawn, managed state registry, bootstrap cache, and dim6 acceptance are closed.

