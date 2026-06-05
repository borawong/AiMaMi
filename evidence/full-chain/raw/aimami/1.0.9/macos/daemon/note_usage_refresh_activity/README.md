# note_usage_refresh_activity — AiMaMi 1.0.9 macOS

同步时间: 2026-06-02
最终结论: strictImplementationUse

## Backend Control Flow
1. OnceLock::initialize(usage_refresh_watcher_state::STATE) if not yet init
2. Mutex::lock(STATE)
3. store qword_101390370 = ts (last_activity_ts)
4. Condvar::notify_all(unk_101390378) — wake watcher thread
5. Mutex::unlock

## Interface
- Args: ts: u64
- Response: ()
- Error: none surfaced

## Watcher State Fields
- qword_101390368: interval_secs
- qword_101390370: last_activity_ts
- unk_101390378: Condvar
- byte_101390360: poisoned flag

## Gate Leaf
dim1-5: accepted. dim6: empty.
