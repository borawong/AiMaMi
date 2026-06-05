# note_usage_refresh_activity — Windows 1.0.9 Reverse Evidence

## Platform Result

**ABSENT on Windows.** The command `note_usage_refresh_activity` does not exist in the Windows 1.0.9 PE binary.

## Evidence

- String search `note_usage_refresh_activity` → 0 matches (27,607 strings searched)
- String search `refresh_activity`, `last_activity` → 0 matches
- IPC dispatcher table at `0x141268d68` confirmed absent

## macOS Context (D-level hint, not Windows proof)

On macOS, `note_usage_refresh_activity(ts)` locks the watcher mutex, writes `last_activity_ts`, then calls `Condvar::notify_all` to wake the watcher thread. This pattern is not present on Windows because no usage-refresh watcher thread exists on Windows.

## Gate

gate_leaf_status: consumerStartReady (platform delta documented)
platformScopeDeclared: macOS confirmed; Windows confirmed ABSENT
