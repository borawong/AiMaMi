# System Diff — start_usage_refresh_watcher (Windows vs macOS 1.0.9)

## Platform Artifacts

macOS: start_usage_refresh_watcher exists as IPC command + atomic gate USAGE_REFRESH_WATCHER_STARTED + std::thread::spawn watcher thread (interval_secs/last_activity_ts/Condvar state)
Windows: ABSENT. No command, no atomic gate, no watcher thread for usage-refresh.

## Frontend IPC / Control-flow

macOS: invoke("start_usage_refresh_watcher") → backend bootstrap + thread spawn
Windows: NOT_APPLICABLE — command absent; frontend uses invoke("get_usage_refresh_interval") / invoke("set_usage_refresh_interval")

## Backend Commands / Control-flow / Pseudocode / Call-tree / Leaf

macOS: start_usage_refresh_watcher → atomic CAS gate → read interval → std::thread::spawn (fire-and-forget) → watcher loop body
Windows: ABSENT. Replaced by:
  - get_usage_refresh_interval: auto_switch_multiplex_dispatcher_sys[case26] → get_usage_refresh_interval_core_impl(0x14045F6C0) → get_usage_refresh_interval_state_check → AppState field read
  - set_usage_refresh_interval: set_usage_refresh_interval_owner_sys(0x14027F690) → set_usage_refresh_interval_core_impl(0x1400A9260) → usage_refresh_interval_parse_string(0x140563C80) → settings_serialize_with_usage_refresh(0x140553A90) → Repository mutex + WakeByAddressSingle

## Interface / Error / Boundary

macOS: argKeys=[], atomic gate, side_effect=spawns background thread
Windows: ABSENT for start_usage_refresh_watcher.
  get_usage_refresh_interval: argKeys=[], response=string
  set_usage_refresh_interval: argKeys=[interval:string], response=Ok/Err, error=poisoned_lock/invalid_interval

## Gate Leaf

Windows: consumerStartReady — platform delta documented, Windows surface is get/set pair not watcher command

## Plugin / Capability

N/A

## OTA / Package

N/A

## Resource / Binary Surface

IPC dispatcher table (0x141268d68): contains get_usage_refresh_interval, set_usage_refresh_interval; does NOT contain start_usage_refresh_watcher, note_usage_refresh_activity, update_usage_refresh_schedule, schedule_full_runtime_refresh

## Unknown

- macOS watcher thread body poll logic (not applicable to Windows reversal)
- test_acceptance_mapping (empty per task spec)
