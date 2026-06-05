# AI Handoff - has_notch macOS 1.0.9

preflight_tuple:
  target_batch: aimami/1.0.9/macos/system/has_notch
  commands: [has_notch]
  rule_files_read:
    - <local-tool-path>/rust-reverse-pipeline/SKILL.md
    - <source-location>/AGENTS.md
    - <source-location>/CLAUDE.md
    - <source-location>/AGENTS.md
    - <source-location>/CLAUDE.md
    - <source-location>/GATE-SPEC.md
    - <source-location>/AI-EXECUTION-QUEUE.md
    - <source-location>/raw/aimami/1.0.9/macos/system/AGENTS.md
    - <source-location>/raw/aimami/1.0.9/macos/system/CLAUDE.md
  closed_commands: []
  verify_only_commands: []
  open_commands: [has_notch]
  index_key_counts: {has_notch: 0}
  audit_handoff_exists: {has_notch: false}
  raw_leaf_exists: {has_notch: false}
  conflicting_owner_or_agent: none for has_notch raw leaf; parent system bundle producer remains claude-sonnet-4-6
  decision: ida-bulk-close
  write_scope: <source-location>/raw/aimami/1.0.9/macos/system/has_notch

closure:
  frontend_control_flow: Settings TanStack [has-notch] -> api.hasNotch -> invoke("has_notch").catch(false); startup shell also consumes platform::screen::has_notch_screen before hotspot create.
  backend_owner: 0x100330730 codexmate_lib::commands::hotspot::has_notch
  platform_leaf: 0x1003e1c64 codexmate_lib::platform::screen::has_notch_screen
  threading: Tauri command wrapper sends user message to WRY/main thread and waits on mpsc receiver; platform leaf requires pthread_main_np.
  side_effect: none for has_notch; startup consumer may create hotspot window only after separate persisted flag check.
  interface: no args; returns bool; frontend catch maps any IPC error to false.
  error_surface: Tauri run_on_main_thread error or recv error formats to String; frontend unsupported fallback false.
  gate: macOS readyToImplement/full_leaf_100 for this leaf only; no Windows inference.

idb_writeback:
  comments_written:
    - 0x100330730
    - 0x1003e1c64
  idb_saved: true
