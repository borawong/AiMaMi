# AI Handoff — note_usage_refresh_activity

status: strictImplementationUse_dim1_5_closed_dim6_empty
source_binary_sha256: 1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482
owner_addr: 0x100262428
owner_symbol: codexmate_lib::commands::system::note_usage_refresh_activity::h9e2c839aec099000

interface:
  args: ts: u64 (Unix seconds, passed as IPC param or internal call)
  response: () — no return value
  error: none (poisoned-lock sets byte_101390360=1 but does not surface to caller)

side_effects:
  - Acquires usage_refresh_watcher_state::STATE mutex (OnceLock<OnceBox<Mutex<WatcherState>>>)
  - Writes qword_101390370 = ts (last_activity_timestamp in shared watcher state)
  - Condvar::notify_all(unk_101390378) — wakes up the watcher thread spawned by start_usage_refresh_watcher

watcher_state_layout:
  - byte_101390360: poisoned flag
  - qword_101390368: interval_secs (set by update_usage_refresh_schedule)
  - qword_101390370: last_activity_ts (set by note_usage_refresh_activity)
  - unk_101390378: Condvar

dim1-5: accepted. dim6: empty.
