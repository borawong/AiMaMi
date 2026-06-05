# Daemon + Auto-Switch 完整调用链 — AiMaMi 1.0.9 macOS

版本: 1.0.9
平台: macOS arm64
binary SHA: 1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482

---

## 1. run_daemon_once 完整链（IPC + CLI）

### 前端触发（IPC 路径）
```
frontend: We.runDaemonOnce() → invoke("run_daemon_once")
   → run::{{closure}} (0x1003187fc) → run_daemon_once::hf8f7756492bf0103 (0x10025d600)
```

### IPC owner (0x10025d600)
```
1. atomic OnceBox + Mutex::lock(Repository)
2. Repository::auto_switch_config(repo+16) → {enabled, interval, ...}
3. Repository::load_local_state_synced() → LoadedState
4. if !enabled:
     sync_local_runtime_state → sync_auto_switch_request(no_rotation) → build_daemon_payload
5. if enabled:
     enrich_accounts_via_api(HTTP) → persist_progressive_state → sync_auto_switch_request → select_rotation_candidate → sync_auto_switch_request(with_rotation) → build_daemon_payload
6. build_daemon_payload:
     load_local_state + check_daemon_state(launchctl "dev.aimami.auto-switch") → CoreEnvelope<DaemonRunPayload>
7. Mutex::unlock; drop LoadedState
```

### CLI owner (0x100313838)
```
main("daemon") → run_daemon_once_cli:
  CodexPaths::resolve_codex_home → CodexPaths::from_home
  [same logic as IPC from step 2]
```

### impl leaves
- `Repository::auto_switch_config`: fs read (registry TOML)
- `enrich_accounts_via_api`: HTTP GET (endpoint TBD)
- `persist_progressive_state`: fs write (state JSON)
- `sync_auto_switch_request`: read/write pending_auto_switch.json; `clear_auto_switch_snooze` (remove snooze file)
- `check_daemon_state`: launchctl list dev.aimami.auto-switch → bool
- `CoreEnvelope::ok`: response serialize

---

## 2. load_bootstrap_state 完整链

```
frontend: We.loadBootstrapState() → invoke("load_bootstrap_state")
   → 0x10025fe54

1. Mutex::lock(Repository)
2. bootstrap_cache::load(path_ptr=repo+480, path_len=repo+488)
     → fs::read_to_string → serde_json::from_str<BootstrapState>
     → IOError or ParseError → empty BootstrapState (graceful)
3. CoreEnvelope::ok(result) → memcpy 0x3E8 bytes to IPC output
4. Mutex::unlock
```

---

## 3. start_usage_refresh_watcher 完整链

```
[boot-spawn, NOT frontend IPC]
run::{{closure}} (0x1003187fc) → start_usage_refresh_watcher::h7fd32adab2a27502 (0x10026254c)

1. atomic_exchange(USAGE_REFRESH_WATCHER_STARTED) — idempotent
2. StateManager::try_get(AppHandle) → Repository ref
3. lock → get_usage_refresh_interval → interval_secs (default=60) → unlock
4. update_usage_refresh_schedule(interval_secs) [write qword_101390368]
5. note_usage_refresh_activity(now_secs) [write qword_101390370]
6. WryHandle::clone + refcount bump
7. std::thread::spawn_unchecked → JoinHandle drop (detached)

watcher OS thread:
   Condvar::wait_timeout(unk_101390378, interval)
   → schedule_full_runtime_refresh(AppHandle)
```

---

## 4. auto-switch 命令组完整链

### set_auto_switch (0x10025e340)
```
frontend: useMutation → setAutoSwitch(enabled) → invoke("set_auto_switch", {enabled})
1. OnceBox lock
2. Repository::set_auto_switch(repo+16, enabled)
     → update registry auto_switch.enabled field → persist_registry
3. CoreEnvelope<AutoSwitchState> (0x78 bytes)
```

### configure_auto_switch (0x1002603c8)
```
frontend: useMutation settings-page → configureAutoSwitch(threshold5hPct, thresholdWeeklyPct)
         → invoke("configure_auto_switch", {threshold5hPercent, thresholdWeeklyPercent})

[BACKEND uses different param names]:
1. OnceBox lock
2. Repository::configure_auto_switch(repo+16, enabled, threshold_pct, has_schedule, schedule_min)
     → load_registry → validate threshold_pct < 101 (err if ≥101)
     → if has_schedule: validate schedule_min < 101
     → update registry {enabled, threshold_pct, has_schedule, schedule_min, updated_at=now}
     → persist_registry (write TOML)
3. check_daemon_state (0x1003e19f0) → daemon_state bool
4. alloc 22B "dev.aimami.auto-switch"
5. CoreEnvelope::ok(AutoSwitchConfig + daemon_state + label) (0x78 bytes)

NOTE: frontend argKeys {threshold5hPercent, thresholdWeeklyPercent} != backend params
      {threshold_pct(u32), has_schedule(bool), schedule_min(u32)}.
      Implement per backend pseudocode; frontend IPC arg mapping TBD.
```

### load_pending_auto_switch (0x1002606fc)
```
frontend: useEffect hook L284 → loadPendingAutoSwitch() → invoke("load_pending_auto_switch")
1. atomic_load OnceBox → initialize if needed
2. Mutex::lock
3. if poisoned: return poisoned err (tag=3)
4. Repository::load_pending_auto_switch(repo+16) → copy 0x2B0 struct to output
5. Mutex::unlock
```

### confirm_pending_auto_switch (0x1002613d8)
```
frontend: FunctionDeclaration:pf@L82 / useEffect L284 → confirmPendingAutoSwitch()
1. OnceBox lock
2. Repository::confirm_pending_auto_switch(repo+16) → SwitchPayload
3. if Err/NoRequest (tag=2): format CoreError
4. else: drop mutex → accounts::refresh_full_runtime_snapshot(AppHandle) (0x1001e6a1c) — side-effect
5. CoreEnvelope response
```

### confirm_pending_auto_switch_and_restart_codex (0x10011207c)
```
frontend: async closure L284 + guard await → confirmPendingAutoSwitchAndRestartCodex()
[async closure 0x10011207c]:
  → confirm_pending_auto_switch [same as above]
  → restart Codex process (via platform::process restart fn)
```

### dismiss_pending_auto_switch (0x1002618b4)
```
frontend: if-guard handler L284 → dismissPendingAutoSwitch()
1. OnceBox lock
2. Repository::dismiss_pending_auto_switch(repo+16) → tag check
3. if Ok(None) (tag=10): sentinel ok (0x8000000000000000)
4. else: CoreError
5. Mutex::unlock
```

### start_auto_switch_pending_watcher (0x100263444)
```
[boot-spawn: main→run_daemon_once_cli→daemon lifecycle→this fn]
1. WryHandle::clone (CFRunLoopGetMain, CFRunLoopSourceCreate, CFRunLoopAddSource, CFRunLoopWakeUp)
2. atomic_fetch_add(AppHandle+136) → MSB panic guard
3. atomic_fetch_add(AppHandle+144) → MSB panic guard
4. v4[0] = 0x8000000000000000
5. std::thread::spawn_unchecked(WryHandle, v4, 0)
     → Thread::new → pthread_attr_init → pthread_attr_setstacksize → pthread_create [OS leaf]
   fail: unwrap_failed("failed to spawn thread") → panic
6. drop JoinHandle (detached thread)
```

---

## 5. system 命令组（同 binary，非 daemon 核心）

### check_update_installability
```
frontend: useEffect([]) mount → We.checkUpdateInstallability().then(l => { if translocation/readonly: openDialog })
         + useCallback([w]) guard

Tauri closure (0x1003290d4) → platform::update::check_update_installability (0x100578128):
  __NSGetExecutablePath → is_translocation (/AppTranslocation/ substring 18B)
  xattr -p com.apple.quarantine <app_path> (subprocess)
  /Volumes/ prefix check
  → {status_tag, exe_path, app_path, can_install, is_translocation, quarantine_cleared}
```

### force_kill_codex
```
frontend: useMutation MaintenancePage → forceKillCodex() → invoke("force_kill_codex")
(0x10025e654) → platform::process::force_kill_all_codex_processes (0x10067538c):
  ps -ax -o pid=,command= → filter ["Codex.app","AiMaMi.app","/.cursor/extensions/","//Cursor.app/","node_repl","Codex Helper"]
  pass1: kill -9 each PID → sleep 500ms
  pass2: kill -9 survivors → sleep 1000ms
  → CoreEnvelope<Vec<u32>> (killed PIDs)
```

### get_system_info
```
frontend: $x() heartbeat fn (L86) + useEffect 5min poll → getSystemInfo() → invoke("get_system_info")
(0x10025d0b4) → hostname::get (gethostname) + sw_vers -productVersion subprocess
  → serde {os:"macos", osVersion:<sw_vers>, arch:"aarch64", hostname:<gethostname>}
```

### get_image_compat / set_image_compat
```
get: useQuery queryKey=["imageCompat"] → .data.enabled (bool)
    read ~/.codex/config.toml → [features].image_generation → bool

set: useMutation Switch toggle → setImageCompat(enabled) → invoke("set_image_compat", {enabled})
    read_to_string → TOML line-scan [features].image_generation → update/insert → fs::write (non-atomic)
    success: invalidateQueries(["imageCompat"])
```

### reset_codex_config
```
frontend: useMutation + confirm Dialog; guard: disabled when codexRouterEnabled=true (relay mode)
(0x10025fbc8) → relay_manager_snapshot + resolve_codex_home + fs_write_inner
  → {configCleared: bool}
```
