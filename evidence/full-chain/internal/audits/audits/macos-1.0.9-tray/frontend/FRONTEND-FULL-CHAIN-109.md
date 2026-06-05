# Frontend Full Chain - AiMaMi 1.0.9 macOS tray

Scope: additive frontend/current-source archive consumer chain for macOS tray. This file does not change gate state.

## Native entry

- App setup: `src-tauri/src/lib.rs` creates the tray icon/menu and wires menu event dispatch.
- Backend menu/event model: `src-tauri/src/commands/tray_menu.rs`.

## Frontend event chain

- `src/main-app.tsx` listens to `tray:navigate`.
- `api.handleTrayMenuEvent(eventId)` -> `invoke("handle_tray_menu_event")`.
- `api.setTrayLocale(language)` -> `invoke("set_tray_locale")`.
- Account menu items route through tray event handling into account switch behavior.
- Router navigation is a current source archive route helper and must be distinguished from upstream tray evidence.

## Shell load and state effects

- Tray is created during Tauri setup, before React route interaction.
- Runtime state updates can refresh the tray menu from current snapshot/account state.
- Language changes refresh tray labels.

