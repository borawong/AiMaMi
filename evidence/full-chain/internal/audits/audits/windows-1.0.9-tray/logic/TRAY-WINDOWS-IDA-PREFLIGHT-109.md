# Windows 1.0.9 tray IDA preflight

Superseded by `logic/TRAY-WINDOWS-APP-OWNER-IDA-109.md` for app-owner closure and gate result. This file remains only as the earlier terminal-layer preflight record.

Prewrite owner matrix:

- target path: `<source-location>/audits/windows-1.0.9-tray/`
- canonical scope: `aimami/1.0.9/windows-x64/tray`
- current producer: none found; package did not exist before this pass
- machine/agent/session: Codex current session
- source index lines: existing tray rows are old 1.0.8 diagnostics/workorders only; no Windows 1.0.9 tray canonical row found
- source task-plan/bundle: root `task-plan.json` still listed old tray rows and must not be treated as Windows 1.0.9 closure
- allowed write mode: new package plus non-promoting review/outtake
- collision status: no existing Windows 1.0.9 tray package; no canonical takeover performed
- takeover sensitive-field status: none

Decision tuple:

```text
target_batch=aimami/1.0.9/windows-x64/tray
commands=create_tray_icon_window,create_or_refresh_tray_menu,handle_tray_menu_event,tray_relay_usage_quota_model
rule_files_read=rust-reverse-pipeline/SKILL.md; <source-location>/AGENTS.md; <source-location>/CLAUDE.md; <source-location>/AGENTS.md; <source-location>/GATE-SPEC.md; <source-location>/AI-EXECUTION-QUEUE.md; <source-location>/task-plan.json; INDEX.jsonl
closed_commands={}
verify_only_commands={}
open_commands={create_tray_icon_window,create_or_refresh_tray_menu,handle_tray_menu_event,tray_relay_usage_quota_model}
index_key_counts={windows_1_0_9_tray:0,old_1_0_8_tray_diagnostics:many}
audit_handoff_exists={windows_1_0_9_tray:false}
raw_leaf_exists={windows_1_0_9_tray:false}
conflicting_owner_or_agent=none_found_for_windows_1_0_9_tray
decision=ida-bulk-close-required
write_scope=<source-location>/audits/windows-1.0.9-tray additive non-promoting package
```

IDA evidence captured:

- `0x1406e3980`: terminal tray icon update path. Calls `Shell_NotifyIconW`, `SendMessageW`, tooltip conversion, and error surface through `GetLastError`.
- `0x1406b46e0`: wrapper into `0x1406e3980`.
- `0x140e8c120`: terminal tray window creation. It registers class `tray_icon_app`, installs `sub_140e8d0a0` as WndProc, creates hidden window, and calls `Shell_NotifyIconW`.
- `0x140e8d0a0`: terminal tray WndProc. It handles `TaskbarCreated`, calls `Shell_NotifyIconW`, and displays menu through `TrackPopupMenu`.
- `0x140e9dc20` and `0x140e9ffc0`: generic native menu construction terminals using menu item append/set APIs.
- `0x140e8d0a0 -> 0x140e8a6a0 -> 0x140e8e900` reaches a generic crossbeam-channel event bridge. This is callback plumbing, not an accepted business semantic owner.
- Menu terminal caller expansion remains in generic wrappers/vtable dispatch:
  - `0x140e9dc20` callers include `0x140e93700`, `0x140e93810`, `0x140e93920`, with wrapper candidates `0x1406b5830`, `0x1406be780`, `0x1406b9330`.
  - `0x140e9ffc0` callers include `0x140e964d0`, `0x140e96550`, `0x140e96770`, with wrapper candidates `0x1406bddc0`, `0x1406c3ae0`, `0x1406bdfa0`.

Conclusion:

Windows tray is present at the platform terminal layer. It is not valid to label Windows tray as absent or product-decision-only. It is also not valid to mark `full_leaf_100` yet because the app-specific upstream menu model and event semantics are not closed.
