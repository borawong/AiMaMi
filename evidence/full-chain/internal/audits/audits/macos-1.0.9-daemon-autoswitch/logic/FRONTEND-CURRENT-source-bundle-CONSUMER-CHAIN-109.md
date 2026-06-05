# Frontend current source archive consumer chain - daemon/autoswitch macOS 1.0.9

Scope: supplemental frontend implementation mapping. It does not rewrite the existing daemon/autoswitch gate.

Current repository baseline was refreshed with `git fetch origin --prune`; checked branch `master` equals `origin/master` at `8327295d0233933a8fcbf2dda24e5bd56fc61693`.

## Current source archive paths

- `src/main-app.tsx`: `api.loadBootstrapState()`, pending auto-switch load/confirm/dismiss flows, installability dialog flow.
- `src/components/settings/settings-page.tsx`: auto-switch enable/disable and threshold configuration.
- `src/lib/api.ts`: wrappers for daemon/autoswitch IPC.

## UI / invoke mapping

- `load_bootstrap_state`: main app bootstrap effect -> `api.loadBootstrapState()` -> `invoke("load_bootstrap_state")`.
- `set_auto_switch`: Settings switch off path -> `api.setAutoSwitch(false)` -> `invoke("set_auto_switch", {enabled:false})`; enable path opens threshold dialog before writing.
- `configure_auto_switch`: threshold dialog submit -> optional `api.setAutoSwitch(true)` -> `api.configureAutoSwitch(t5h,tWeekly)` -> `invoke("configure_auto_switch", {threshold5hPercent, thresholdWeeklyPercent})`.
- `load_pending_auto_switch`: main app effect -> `api.loadPendingAutoSwitch()` -> `invoke("load_pending_auto_switch")`.
- `confirm_pending_auto_switch`: API wrapper exists -> `invoke("confirm_pending_auto_switch")`; current visible main-app path prefers restart variant.
- `confirm_pending_auto_switch_and_restart_codex`: pending-switch dialog confirm -> `api.confirmPendingAutoSwitchAndRestartCodex()` -> `invoke("confirm_pending_auto_switch_and_restart_codex")`.
- `dismiss_pending_auto_switch`: pending-switch dialog dismiss -> `api.dismissPendingAutoSwitch()` -> `invoke("dismiss_pending_auto_switch")`.
- `run_daemon_once`: API wrapper exists -> `invoke("run_daemon_once")`; primary runtime path is daemon/bootstrap trigger, not a recurring visible page button in this pass.
- 
ote_usage_refresh_activity`, `schedule_full_runtime_refresh`, `start_usage_refresh_watcher`, `update_usage_refresh_schedule`, `start_auto_switch_pending_watcher`: native/bootstrap or background watcher paths, not normal UI button invokes.

## Consumer warning

Do not rewrite watcher startup as a user-clicked UI command. Keep UI invoke paths and native/bootstrap substitutes separate.
