# Tray all-platform recheck

Prewrite owner matrix:

- target path: `<source-location>/audits/macos-1.0.9-tray/logic/TRAY-ALL-PLATFORM-RECHECK-109.md`
- canonical scope: `aimami/1.0.9/macos/tray` plus cross-platform gap notes
- current producer: existing macOS tray package has positive manifest/gate report, but its reducer pointer targets a non-authoritative local outtake
- machine/agent/session: Codex current session
- source index lines: existing tray rows in INDEX are old 1.0.8 diagnostics/workorders; no trusted all-platform 1.0.9 tray full100 row found
- source task-plan/bundle: root `task-plan.json` still contains old migration text and 1.0.8 consumed inputs; this pass does not consume that as proof
- allowed write mode: additive review/outtake only
- collision status: no takeover; no canonical gate overwrite
- takeover sensitive-field status: none

All-platform correction:

- `macOS`: IDA-known tray functions exist at `0x10033124c`, `0x100331688`, `0x1003317e4`, `0x100332790`, and `0x100333924`.
- `Windows`: not absent. Windows 1.0.9 IDA shows taskbar icon/menu terminal candidates at `0x1406e3980`, `0x1406b46e0`, `0x140e8c120`, `0x140e8d0a0`, `0x140e9dc20`, and `0x140e9ffc0`.
- `Cross-platform`: Windows must be closed independently; macOS evidence cannot prove Windows tray menu behavior.

Current package integrity issue:

- Existing macOS tray `manifest.json` and `gate-report.json` claim `full_leaf_100=true`.
- Their `currentReducer` points to `../macos-1.0.9-system-shell-init/logic/SYSTEM-SHELL-INIT-FULL-LEAF-100-IDA-ACCEPTED-109.md`.
- That reducer currently states `duplicate_local_outtake_not_authoritative` and `must not be consumed as a gate source`.
- Without explicit takeover sensitive-field, this pass does not overwrite the positive gate files. Consumers must read this recheck before consuming the old positive claim.

Tray relation to relay and usage/quota:

- Current source archive source refreshes the tray after relay provider/router mutations in `src-tauri/src/commands/relay.rs`.
- Current source archive source builds tray menu state from accounts plus relay state in `src-tauri/src/commands/tray_menu.rs`.
- Current source archive source renders quota text from `primary_window` and `secondary_window` in the tray model.
- Current React listens to native `tray:navigate` and routes to `relayModel`.
- These are current source archive implementation facts. They are not upstream proof until matched against AiMaMi 1.0.9 per platform.

source archive gap candidates versus upstream 1.0.9:

- source archive uses `TrayIconBuilder::with_id("main")`; macOS IDA `refresh_tray_menu` used `mainAiMaMi`.
- source archive exposes helper IPC `handle_tray_menu_event` and `set_tray_locale`; upstream native callback/helper exposure must be verified per platform.
- source archive tray router action navigates to `relayModel`; upstream route payload and route name must be verified.
- source archive account switch from tray restarts Codex through current local account manager; upstream Windows event semantics remain open.

Gate result of this recheck:

- This file does not promote any tray gate.
- Windows tray `absent/product_delta` is rejected.
- All-platform tray remains below `full_leaf_100` until Windows app-specific owner, menu model, event semantics, relay/account/quota state, frontend/native acceptance, and canonical package consistency are closed.
