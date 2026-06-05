# configure_auto_switch — AiMaMi 1.0.9 macOS

同步时间: 2026-06-02
范围: auto-switch module — configure settings
最终结论: strictImplementationUse — dim1-5 closed, dim6 empty

## Evidence

- owner: 0x1002603c8 `codexmate_lib::commands::system::configure_auto_switch` (0x2c4 bytes)
- core leaf: 0x1005e9a5c `Repository::configure_auto_switch`
- binary SHA: 1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482

## Frontend Control Flow

CCF manifest entry present. User settings save action triggers `invoke("configure_auto_switch", {enabled, thresholdPct, hasSchedule, scheduleMin})`.

## Backend Control Flow / Pseudocode

Command layer (0x1002603c8):
```
configure_auto_switch(a1: Repo mutex, a2: enabled(bool), a3: threshold_pct(u32),
                       a4: has_schedule(bool), a5: schedule_min(u32), a6: output):
  acquire OnceBox mutex on a1
  if poisoned: return err
  Repository::configure_auto_switch(a1+16, enabled, threshold_pct, has_schedule, schedule_min)
  if err (sentinel 0x8000000000000000): format CoreError → a6
  else: copy 0x78-byte AutoSwitchConfig to a6
  Mutex::unlock
```

Core leaf (0x1005e9a5c):
```
Repository::configure_auto_switch(a1, enabled, threshold_pct, has_schedule, schedule_min, a6):
  load_registry → extract current auto_switch config
  validate threshold_pct < 101 (else format err "...must be <101")
  if has_schedule: validate schedule_min < 101 (else format err)
  update registry auto_switch fields: {enabled, threshold_pct, has_schedule, schedule_min, updated_at=SystemTime::now}
  persist_registry(a1, &registry, 1)
  if persist err: return CoreError
  check_daemon_state(a1+632, a1+640) → daemon_state bool
  alloc 22 bytes "dev.aimami.auto-switch" → label string
  CoreEnvelope::ok(config + daemon_state + label) → a6
```

## Call Tree

depth=6, terminated_reason=implementation_leaf
configure_auto_switch(0x1002603c8)
  └─ OnceBox::initialize + Mutex::lock → pthread_mutex_lock [OS leaf]
  └─ Repository::configure_auto_switch (0x1005e9a5c)
       └─ Repository::load_registry (0x1005e2e80) [registry read leaf]
       └─ SystemTime::now + duration_since [time leaf]
       └─ validate threshold/schedule (format err if invalid) [logic leaf]
       └─ Repository::persist_registry (0x1005e6460) [registry write leaf]
       └─ platform::daemon::check_daemon_state (0x1003e19f0) [platform leaf]
       └─ alloc 22b "dev.aimami.auto-switch" [string leaf]
       └─ CoreEnvelope::ok [response leaf]
  └─ Mutex::unlock [OS leaf]

## Interface / DTO / Error

- Input args:
  - enabled: bool (a2)
  - threshold_pct: u32, 0-100 (a3); error if ≥ 101
  - has_schedule: bool (a4)
  - schedule_min: u32, 0-100 (a5); error if has_schedule && ≥ 101
- Output: CoreEnvelope<AutoSwitchConfig>
  - Err (sentinel 0x8000000000000000): validation err or persist err (CoreError string)
  - Ok: AutoSwitchConfig struct (0x78 bytes) + daemon state bool + "dev.aimami.auto-switch" label
- Side effects: persist_registry writes updated auto_switch config to registry file

## Gate Leaf Status

dim1: accepted (CCF manifest)
dim2: accepted
dim3: accepted (depth ≥ 6, persist/daemon/platform leaf reached)
dim4: accepted
dim5: macOS confirmed; Windows Unknown
dim6: empty
overall: strictImplementationUse
