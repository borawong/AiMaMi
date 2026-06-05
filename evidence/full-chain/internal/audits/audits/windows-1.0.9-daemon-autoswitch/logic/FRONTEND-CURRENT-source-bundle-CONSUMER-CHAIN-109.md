# Frontend current source archive consumer chain - daemon/autoswitch Windows 1.0.9

Scope: supplemental frontend implementation mapping. It does not rewrite the existing Windows daemon/autoswitch gate.

Current repository baseline was refreshed with `git fetch origin --prune`; checked branch `master` equals `origin/master` at `8327295d0233933a8fcbf2dda24e5bd56fc61693`.

## Shared current source archive source paths

- `src/main-app.tsx`: load bootstrap state, pending auto-switch dialog load/confirm/dismiss, installability dialog.
- `src/components/settings/settings-page.tsx`: auto-switch enable/disable and threshold settings.
- `src/lib/api.ts`: wrappers for `load_bootstrap_state`, `set_auto_switch`, `configure_auto_switch`, pending switch commands, and usage refresh interval commands.

## Windows platform differences

Current Windows package confirms 9 present daemon/autoswitch commands and 4 absent macOS usage-refresh watcher commands. The absent commands are:

- 
ote_usage_refresh_activity`
- `schedule_full_runtime_refresh`
- `start_usage_refresh_watcher`
- `update_usage_refresh_schedule`

Windows has interval-oriented IPC:

- `get_usage_refresh_interval` string `0x141268d64` -> `auto_switch_multiplex_dispatcher_sys@0x1402663e0`.
- `set_usage_refresh_interval` string `0x141268d7e` -> `set_usage_refresh_interval_owner_sys@0x14027f690`.

Windows daemon scheduling evidence:

- `schtasks` string `0x1412790b1` and `CodexMateAutoSwitch` string `0x1412790d0` -> `daemon_schtasks_register@0x1403fb450`.

## Consumer warning

Do not implement the four macOS usage-refresh watcher commands as Windows upstream parity. Implement Windows behavior using the accepted Windows interval/scheduled-task model or keep the rows absent by product decision.
