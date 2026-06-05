# Frontend Full Chain - AiMaMi 1.0.9 Windows tray

Scope: additive frontend/current-source archive consumer chain for the accepted Windows tray closure. This file does not change gate state.

## Native entry

- App setup: `src-tauri/src/lib.rs` creates `TrayIconBuilder::with_id("main")`, attaches the menu, and wires `.on_menu_event(...)`.
- Backend menu/event model: `src-tauri/src/commands/tray_menu.rs`.
- Native upstream IDA closure covers menu build, snapshot refresh, runtime-state refresh, callback wrappers, and Shell_NotifyIcon/Menu terminal layer.

## Frontend event chain

- `src/main-app.tsx` listens to `tray:navigate`.
- `api.handleTrayMenuEvent(eventId)` -> `invoke("handle_tray_menu_event")`.
- `api.setTrayLocale(language)` -> `invoke("set_tray_locale")`.
- Account menu items route through tray event handling into account switch behavior.
- Current source archive `tray_router_open` emits route `relayModel` through `tray:navigate` only if the menu item exists.

## Shell load and state effects

- Tray is created during Tauri setup, before any React route interaction.
- Runtime state update can rebuild the tray menu from the current account/runtime snapshot.
- Language changes refresh tray locale.

## Current source archive delta

Windows AiMaMi 1.0.9 IDA has no `tray_router_open` or `relayModel` menu item. Current source archive has the classifier/listener path, but current menu construction does not insert `tray_router_open`; treat it as source archive extra/inert unless a menu item is added.

