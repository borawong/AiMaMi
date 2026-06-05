# AI Handoff — update_usage_refresh_schedule

status: strictImplementationUse_dim1_5_closed_dim6_empty
source_binary_sha256: 1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482
owner_addr: 0x100262c90
owner_symbol: codexmate_lib::commands::system::update_usage_refresh_schedule::h77bfe134fd8d67da

interface:
  args: interval_sec: u64
  response: () — no return value
  error: none surfaced

side_effects:
  - Acquires usage_refresh_watcher_state::STATE mutex
  - Writes qword_101390368 = interval_sec (new interval in watcher state)
  - Condvar::notify_all(unk_101390378) — wakes watcher thread to adopt new interval
  - Mutex::unlock

note: structurally identical to note_usage_refresh_activity but writes qword_101390368 (interval) instead of qword_101390370 (activity_ts)

dim1-5: accepted. dim6: empty.
