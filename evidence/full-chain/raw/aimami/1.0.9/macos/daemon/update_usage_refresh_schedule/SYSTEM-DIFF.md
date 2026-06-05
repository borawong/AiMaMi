# System Diff — update_usage_refresh_schedule

## Platform
- macOS: confirmed. Windows: Unknown (Mutex+Condvar expected same).

## Backend
- Pure in-process state write + condvar signal.

## Interface
- Args: interval_sec: u64
- Response: ()

## Gate Leaf
- macOS: strictImplementationUse. Windows: Unknown.
