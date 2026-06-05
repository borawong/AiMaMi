# System Diff — note_usage_refresh_activity (Windows vs macOS 1.0.9)

## Platform Artifacts

macOS: note_usage_refresh_activity exists as IPC command; takes ts param; writes last_activity_ts to watcher state; Condvar::notify_all
Windows: ABSENT

## Backend Commands / Control-flow

macOS: note_usage_refresh_activity(ts) → lock mutex → write activity_ts → Condvar::notify_all
Windows: ABSENT — no watcher thread, no condvar state for usage-refresh

## Interface / Error / Boundary

macOS: argKeys=[ts: u64/timestamp], no response body
Windows: ABSENT

## Gate Leaf

Windows: consumerStartReady — platform delta documented (absent)

## Unknown

- test_acceptance_mapping: empty per task spec
