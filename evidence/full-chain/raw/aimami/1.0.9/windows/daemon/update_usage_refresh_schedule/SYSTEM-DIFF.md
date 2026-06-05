# System Diff — update_usage_refresh_schedule (Windows vs macOS 1.0.9)

## Platform Artifacts

macOS: update_usage_refresh_schedule exists as IPC command; writes interval global; Condvar::notify_all to wake watcher
Windows: ABSENT

## Backend Commands / Control-flow

macOS: update_usage_refresh_schedule(interval) → lock mutex → write interval_global → Condvar::notify_all
Windows: ABSENT — closest analog is set_usage_refresh_interval which persists to settings file (no condvar notify)

## Interface / Error / Boundary

macOS: argKeys=[interval], mutation=watcher interval global + condvar notify
Windows: ABSENT for this command name; set_usage_refresh_interval (different mechanism) handles interval persistence

## Gate Leaf

Windows: consumerStartReady — platform delta documented (absent)

## Unknown

- test_acceptance_mapping: empty per task spec
