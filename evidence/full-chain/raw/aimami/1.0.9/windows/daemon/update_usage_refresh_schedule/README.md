# update_usage_refresh_schedule — Windows 1.0.9 Reverse Evidence

## Platform Result

**ABSENT on Windows.** The command `update_usage_refresh_schedule` does not exist in the Windows 1.0.9 PE binary.

## Evidence

- String search `update_usage_refresh_schedule` → 0 matches
- String search `refresh_schedule` → 0 matches
- IPC dispatcher table confirmed absent

## macOS Context (D-level hint, not Windows proof)

On macOS, `update_usage_refresh_schedule(interval)` has the same structure as `note_usage_refresh_activity` but writes the interval global instead of activity_ts, then calls `Condvar::notify_all`. On Windows, the closest analogue for interval management is `set_usage_refresh_interval` (`set_usage_refresh_interval_owner_sys` at `0x14027F690`), which persists to `CodexMateSettings.usageRefreshInterval` in the settings file. There is no condvar notify because no watcher thread exists on Windows.

## Gate

gate_leaf_status: consumerStartReady (platform delta documented)
platformScopeDeclared: macOS confirmed; Windows confirmed ABSENT
