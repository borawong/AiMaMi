# update_usage_refresh_schedule — AiMaMi 1.0.9 macOS

同步时间: 2026-06-02
最终结论: strictImplementationUse

## Backend Control Flow
1. OnceLock::initialize(STATE) if not yet init
2. Mutex::lock(STATE)
3. qword_101390368 = interval_sec
4. Condvar::notify_all(unk_101390378)
5. Mutex::unlock

## Interface
- Args: interval_sec: u64
- Response: ()

## Gate Leaf
dim1-5: accepted. dim6: empty.
