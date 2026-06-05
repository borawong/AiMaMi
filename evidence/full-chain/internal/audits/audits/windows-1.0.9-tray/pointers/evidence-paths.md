# Evidence paths: Windows 1.0.9 tray

- IDB: `<source-location>/source-binary/AiMaM 1.0.9 win64.exe.i64`
- Binary SOT: `<source-location>/source-binary/AiMaM 1.0.9 win64.exe`
- Current package: `<source-location>/audits/windows-1.0.9-tray/`

IDA candidates found in the Windows 1.0.9 IDB:

App-specific owners:

- `0x140009BB0` (`tray_create_menu_snapshot_or_bootstrap`): sync menu owner; chooses cached snapshot path or bootstrap fallback.
- `0x14000B710`: bootstrap menu builder; uses `tray_bootstrap_header`, `tray_bootstrap_title`, `tray_bootstrap_subtitle`, `tray_open_main`, `tray_quit`.
- `0x14000D710`: stateful snapshot menu builder; uses `tray_active_header`, `tray_accounts_header`, `tray_account:<field>`, `tray_open_main`, `tray_quit`.
- `0x14000CA80` (`tray_append_codex_router_section`): appends `tray_codex_router_header` and `tray_codex_router_status`; reads relay state through `relay_models_relay_active_by_ide_update_inplace_sys`.
- `0x14000A1E0` (`tray_refresh_menu_from_repository`): creates menu and calls tray `set_menu`; called by relay mutation/import/router paths.
- `0x14000F3E0` (`tray_refresh_menu_from_snapshot`): snapshot refresh/set-menu path called by runtime state update.
- `0x1400AF970`: `runtime-state-updated` helper that calls `0x14000F3E0`.
- `0x14000A410`: menu event dispatcher for `tray_quit`, `tray_open_main`, title/subtitle focus rows, and `tray_account:<field>`.
- `0x140277240`, `0x14028F5F0`: native callback wrappers to `0x14000A410`.

App-specific strings:

- `tray_open_main`: `0x141251102`.
- `tray_active_title`: `0x141251110`.
- `tray_active_subtitle`: `0x141251121`.
- `tray_bootstrap_title`: `0x141251135`.
- `tray_bootstrap_subtitle`: `0x141251149`.
- `tray_codex_router_status`: `0x141251160`.
- `tray_quit`: `0x141251178`.
- `tray_account:`: `0x141251181`.
- `tray_bootstrap_header`: `0x1412511f4`.
- `tray_codex_router_header`: `0x14125127c`.
- `tray_active_header`: `0x141251299`.
- `tray_accounts_header`: `0x1412512ab`.
- Quit relay warning: `0x1412512e3`.
- Quit relay dialog title: `0x141251356`.

Absent from Windows AiMaMi 1.0.9 IDA string universe: `tray_router_open`, `relayModel`.

Native terminal layer:

- `0x1406e3980`: `Shell_NotifyIconW` add/modify terminal, tooltip/icon path.
- `0x1406b46e0`: wrapper into `0x1406e3980`.
- `0x140e8c120`: native tray window create, `RegisterClassW`, `CreateWindowExW`, `Shell_NotifyIconW`, string `tray_icon_app`.
- `0x140e8d0a0`: tray window proc, `TaskbarCreated`, `Shell_NotifyIconW`, `TrackPopupMenu`.
- `0x140e9dc20`: generic native menu append/set-item terminal.
- `0x140e9ffc0`: generic native menu append/set-item terminal variant.
- `0x140e9dc20` caller wrappers: `0x140e93700`, `0x140e93810`, `0x140e93920`; upstream wrappers observed at `0x1406b5830`, `0x1406be780`, `0x1406b9330`.
- `0x140e9ffc0` caller wrappers: `0x140e964d0`, `0x140e96550`, `0x140e96770`; upstream wrappers observed at `0x1406bddc0`, `0x1406c3ae0`, `0x1406bdfa0`.
- Generic event bridge: `0x140e8d0a0 -> 0x140e8a6a0 -> 0x140e8e900 -> crossbeam-channel helpers`.

source archive acceptance comparison paths:

- `src-tauri/src/lib.rs`: `TrayIconBuilder::with_id("main")`, `.menu(&tray_menu)`, `.on_menu_event(...)`.
- `src-tauri/src/commands/tray_menu.rs`: menu model, classifier, quit/account/focus/router helpers, unit tests.
- `src/main-app.tsx`: `tray:navigate` listener and route normalization.
- `src/main-app.test.tsx`: tray navigation tests.
