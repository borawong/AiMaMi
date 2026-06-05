# System Diff — note_usage_refresh_activity

## Platform
- macOS: confirmed. Windows: Unknown (same Mutex+Condvar pattern expected but not verified).

## Backend
- Pure in-process state write + condvar signal. No FS, no HTTP, no process spawn.

## Interface
- Args: ts: u64 (Unix seconds)
- Response: ()

## Gate Leaf
- macOS: strictImplementationUse. Windows: Unknown.
