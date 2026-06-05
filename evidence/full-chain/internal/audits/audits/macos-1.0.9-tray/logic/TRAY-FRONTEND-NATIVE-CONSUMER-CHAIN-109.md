# Tray frontend/native consumer chain - macOS 1.0.9

Scope: supplemental consumer mapping. Existing tray gate remains owned by the system-shell-init reducer.

## Native tray construction

Current source archive source path:

- `src-tauri/src/lib.rs`: Tauri setup creates tray icon/menu with `commands::tray_menu::create_tray_menu(app.handle())`, `commands::tray_icon::load_tray_icon()`, and `TrayIconBuilder::new().menu(&tray_menu).on_menu_event(...)`.
- `src-tauri/src/commands/tray_menu.rs`: builds bootstrap/stateful menu, classifies native event ids, dispatches actions, refreshes menu after relay/account mutations.

## Native event paths

- Open main: menu id `tray_open_main` -> `dispatch_tray_menu_event` -> `focus_main_window`.
- Open router: menu id `tray_router_open` -> `open_router_from_tray` -> emits `tray:navigate`.
- Account switch: menu id prefix `tray_account:` -> confirmation dialog -> `switch_account_from_tray_inner` -> account switch/restart helper.
- Quit: menu id `tray_quit` -> relay-aware quit dialog -> `app.exit(0)` after confirmation.
- Locale: `api.setTrayLocale(language)` -> `invoke("set_tray_locale", {language})` -> refresh tray menu.
- Test/helper IPC: `api.handleTrayMenuEvent(eventId)` -> `invoke("handle_tray_menu_event", {eventId})`.

## React consumer

- `src/main-app.tsx` listens to Tauri event `tray:navigate` and routes to supported app pages.
- `src/main-app.test.tsx` covers tray navigation to relay/subscription/projectConfig and unsupported route rejection.

## Platform scope

This bundle is macOS tray. No `windows-1.0.9-tray` audit package was found in this pass. Windows tray icon bytes exist in current source archive source, but that is current source archive implementation evidence, not AiMaMi Windows tray full leaf evidence.
