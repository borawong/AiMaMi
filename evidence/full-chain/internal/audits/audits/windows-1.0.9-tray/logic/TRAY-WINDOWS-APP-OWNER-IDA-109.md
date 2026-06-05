# Windows tray app-owner IDA closure: AiMaMi 1.0.9

target_batch=aimami/1.0.9/windows-x64/tray
commands=create_tray_icon_window,create_or_refresh_tray_menu,handle_tray_menu_event,tray_relay_usage_quota_model
rule_files_read=<source-location>/local-archive <source-location>/AGENTS.md; <source-location>/CLAUDE.md; <source-location>/AGENTS.md; <source-location>/CLAUDE.md; <source-location>/GATE-SPEC.md; <source-location>/AI-EXECUTION-QUEUE.md; <source-location>/task-plan.json; target AGENTS.md/CLAUDE.md/manifest/gate-report/task-plan/pointers
closed_commands=create_tray_icon_window,create_or_refresh_tray_menu,handle_tray_menu_event,tray_relay_usage_quota_model
verify_only_commands=none
open_commands=none
index_key_counts={}
audit_handoff_exists={tray:true}
raw_leaf_exists={tray:false}
conflicting_owner_or_agent=none
decision=ida-bulk-close
write_scope=<source-location>/audits/windows-1.0.9-tray/

## IDA owner map

- `0x140009BB0` (`tray_create_menu_snapshot_or_bootstrap`): sync owner that loads cached display snapshot via `sub_1400B0F80`; on valid snapshot calls `0x14000D710`, otherwise locks repository state and falls back to `0x14000B710`.
- `0x14000B710`: bootstrap menu builder. It emits bootstrap header/title/subtitle, open-main and quit rows.
- `0x14000D710`: stateful menu builder. It emits active account rows, account switch check-items, router section, open-main and quit rows.
- `0x14000CA80` (`tray_append_codex_router_section`): router section builder. It reads repository/relay state through `sub_1400DA320 -> sub_140153300 -> relay_models_relay_active_by_ide_update_inplace_sys`, then emits router header/status.
- `0x14000A1E0` (`tray_refresh_menu_from_repository`): builds a menu through `0x140009BB0`, resolves tray id through the Tauri tray lookup path, then calls tray `set_menu`.
- `0x14000F3E0` (`tray_refresh_menu_from_snapshot`): builds from a supplied snapshot through `0x14000D710`, then calls tray `set_menu`.
- `0x1400AF970`: `runtime-state-updated` helper. It updates progressive runtime state and calls `0x14000F3E0`; this is the usage/quota-to-tray refresh edge.
- `0x14000A410`: native menu event dispatcher. It handles quit, focus/open-main, title/subtitle focus rows, and `tray_account:<field>` account switch.
- `0x140277240` and `0x14028F5F0`: native callback wrappers that forward event id bytes into `0x14000A410`.

## Threading model

- Menu construction is synchronous in the native/Tauri tray path. Repository access is mutex-guarded; poison errors surface through the managed-state error path.
- Refresh is synchronous: build menu, resolve tray handle, call set-menu, cleanup allocations.
- Runtime refresh is event-driven but not a long-lived tray worker: runtime state update calls the snapshot refresh function and returns.
- Native Windows shell integration uses a hidden tray callback window and message loop, with Tauri/wry/crossbeam bridge under the app-specific event wrapper.
- Quit and account switch use dialog callbacks. Account switch then executes the switch-and-restart side effect.

## Menu/event semantics

- `tray_open_main`, `tray_active_title`, `tray_active_subtitle`, `tray_bootstrap_title`, and `tray_bootstrap_subtitle` focus the main window.
- `tray_account:<field>` extracts the suffix after 13 bytes, scans account entries for the matching field, opens a confirm dialog, and on confirmation enters the account switch/restart path.
- `tray_quit` reads relay/router state; when active it shows the warning dialog `确认退出 AiMaMi？` with the Codex router shutdown warning; otherwise it exits directly.
- `tray_codex_router_header` and `tray_codex_router_status` are display rows only in Windows AiMaMi 1.0.9. IDA string search found no `tray_router_open` and no `relayModel`.

## source archive comparison

- Current source archive startup creates `TrayIconBuilder::with_id("main")`, attaches the menu, and dispatches native menu events to `commands::tray_menu::dispatch_tray_menu_event`.
- Current source archive stateful menu builds account rows, router header/status, open-main and quit. It does not insert `tray_router_open`.
- Current source archive still defines a `tray_router_open` classifier and `tray:navigate` payload to `relayModel`; this is an inert/local extra handler unless a menu item is added later.
- Current frontend listens to `tray:navigate`, normalizes the route, and calls 
avigateToRoute`; tests cover `relayModel` route navigation.

## Gate result

`full_leaf_100_definition_v2` is closed for the Windows tray scope listed above: native surface, app owner, deep callback/set-menu/dialog/focus/exit/restart leaves, interface/event-id boundary, Windows platform gate, and source archive acceptance mapping are all recorded. macOS evidence is not used for this Windows gate.

Verification executed:

- `cargo test --manifest-path src-tauri/Cargo.toml tray`: pass, 36 passed / 0 failed.
- `bun run test -- src/main-app.test.tsx -t "tray navigation"`: pass, 24 passed / 39 skipped in the filtered file.
