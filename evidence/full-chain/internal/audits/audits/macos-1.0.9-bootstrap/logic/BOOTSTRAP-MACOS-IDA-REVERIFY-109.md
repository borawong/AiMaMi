# macOS 1.0.9 Bootstrap IDA Reverify

target_batch=AiMaMi/1.0.9/macos/bootstrap
producer=Codex
mode=additive_ida_reverify_only
owner_context=<workstation>/deep-mac-bootstrap
collision=producer_owned_gate
takeover=none

This file is an additive IDA reverify note. It does not rewrite
`gate-report.json`, `manifest.json`, or `data/task-plan.json`.

## IDA Coverage

- `0x100314324` `codexmate_lib::run`: app run entry owner. It resolves
  Codex paths, acquires the single-instance lock, builds the Tauri app,
  registers managed state, installs setup hooks, connects the IPC dispatcher,
  and enters the app run path.
- `0x1003187fc` `run::{{closure}}`: main IPC dispatcher closure. The command
  string table includes bootstrap/system/account/daemon/relay entries such as
  `load_bootstrap_state`, `begin_add_account_attach_monitor`,
  `run_daemon_once`, `detect_api_proxy_config`, `get_usage_refresh_interval`,
  and `set_usage_refresh_interval`.
- `0x1001beef8` `bootstrap_cache::load`: reads bootstrap state from disk,
  parses the `BootstrapStatePayload`, and returns an empty/default state on
  IO or parse failure.
- `0x1001cfd70` `RelayManager::bootstrap`: setup-chain relay bootstrap. It
  snapshots state, removes orphan router/provider config, starts proxy state,
  checks stale Codex config, and retries sync after repair.
- `0x1003e0f50` `platform::single_instance::acquire`: creates the data
  directory and opens/locks `aimami-single-instance.lock` for
  `dev.aimami.desktop`.
- `0x1003e1434` `platform::daemon::install_daemon`: writes the macOS
  LaunchAgent plist and invokes `launchctl loadlist -w`.
- `0x10026254c` `start_usage_refresh_watcher`: atomic once gate, repository
  interval lookup, and std thread spawn for periodic usage refresh.
- `0x100262db4` `begin_add_account_attach_monitor`: account snapshot monitor
  owner; it loads the current snapshot and spawns the account-change watcher.
- `0x100263444` `start_auto_switch_pending_watcher`: clones `WryHandle` and
  fire-and-forget spawns the auto-switch pending watcher thread.
- `0x100529504` account attach monitor body: sleeps/polls, reloads snapshot,
  compares account/status state, and schedules runtime refresh only when a
  change is detected.

## IDB Writeback

IDA comments were written for all addresses above and the macOS IDB was saved:

`<source-location>/source-binary/AiMaMi 1.0.9_ida.app/Contents/MacOS/AiMaMi.i64`

## Gate Boundary

The existing package remains the authoritative <workstation> bootstrap package.
This reverify closes the IDA owner/threading/load-path evidence for consumer
use, but no canonical gate promotion is performed here because the package
rules reserve gate/manifest mutation to the current producer owner.
