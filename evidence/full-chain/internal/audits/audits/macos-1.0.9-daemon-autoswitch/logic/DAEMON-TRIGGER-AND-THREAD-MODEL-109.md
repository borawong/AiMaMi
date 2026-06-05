# Daemon 触发机制与线程模型 — AiMaMi 1.0.9 macOS

版本: 1.0.9
平台: macOS arm64
binary SHA: 1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482

---

## 1. Daemon 启动触发链（bootstrap spawn）

```
main (0x100001174)
  └─ match arg "daemon" arm
       └─ run_daemon_once_cli (0x100313838)
            └─ CodexPaths::resolve_codex_home → CodexPaths::from_home
            └─ [同 IPC owner 逻辑]
                 ├─ Repository::auto_switch_config
                 ├─ Repository::load_local_state_synced
                 ├─ Branch A (auto_switch=false):
                 │    └─ sync_local_runtime_state → sync_auto_switch_request(no rotation) → build_daemon_payload
                 └─ Branch B (auto_switch=true):
                      └─ enrich_accounts_via_api (HTTP)
                      └─ persist_progressive_state
                      └─ sync_auto_switch_request → select_rotation_candidate → sync_auto_switch_request(with rotation)
                      └─ build_daemon_payload
                           └─ load_local_state + check_daemon_state(launchctl) → CoreEnvelope<DaemonRunPayload>
```

**触发机制一句话**：AiMaMi 以 `"daemon"` 子命令调用自身（bootstrap spawn）注册 LaunchAgent，`run()` 在 Tauri setup 后自动调用 boot-spawn 命令（start_usage_refresh_watcher、start_auto_switch_pending_watcher 等），IPC 端 `run_daemon_once` 亦注册为 Tauri 命令供前端主动触发。

---

## 2. LaunchAgent / Scheduled Task 注册

### macOS

- `check_daemon_state` (0x1003e19f0): 调用 `launchctl list dev.aimami.auto-switch`（或等价），返回 daemon state bool
- `install_daemon` (被 `run_daemon_once` 间接调用): 写入 LaunchAgent plist 至 `~/Library/LaunchAgents/dev.aimami.auto-switch.plist`，调用 `launchctl bootstrap user/$(id -u) <plist_path>` 或 `launchctl load <plist_path>`
- label 字符串: `"dev.aimami.auto-switch"` (22 bytes, allocated in configure_auto_switch @ 0x1005e9a5c)
- LaunchAgent plist 包含 AiMaMi 自身路径 + `"daemon"` 子命令 + Interval / StartCalendarInterval

### Windows

- Windows daemon trigger 机制: **Unknown**
- 禁止从 macOS launchctl 外推；必须从 Windows binary 独立逆向（Task Scheduler / registry / SCM 均为候选，未证实）

---

## 3. Tauri run() 注册的 boot-spawn 命令

`run::{{closure}}` (0x1003187fc) 在 Tauri app setup 完成后自动调用以下命令（不经过前端 IPC）：

| 命令 | owner VA | 触发时机 |
|---|---|---|
| start_usage_refresh_watcher | 0x10026254c | app setup 完成后 |
| start_auto_switch_pending_watcher | 0x100263444 | daemon bootstrap 生命周期 |
| note_usage_refresh_activity | 0x100262428 | watcher 初始化时 seed |
| update_usage_refresh_schedule | 0x100262c90 | watcher 初始化时 seed |

这些命令 **不在前端 ipc-contracts.jsonl 的 wrapper 层**，dim1 采用 `accepted_native_callback_bootstrap_spawn` substitute。

---

## 4. usage_refresh_watcher 线程模型

```
start_usage_refresh_watcher (0x10026254c):
  1. atomic_exchange(USAGE_REFRESH_WATCHER_STARTED) — 幂等门（已启动则直接返回）
  2. StateManager::try_get(AppHandle) → Repository ref（缺失则 panic）
  3. lock Repository → get_usage_refresh_interval → interval_secs（default=60）
  4. unlock Repository
  5. update_usage_refresh_schedule(interval_secs) — 写 watcher state qword_101390368
  6. note_usage_refresh_activity(SystemTime::now - EPOCH) — 写 watcher state qword_101390370
  7. WryHandle::clone + atomic refcount bump
  8. std::thread::spawn_unchecked(watcher_closure) — 返回 JoinHandle 立即 drop（detached）

watcher_closure（OS thread，detached）:
  loop:
    Condvar::wait_timeout(unk_101390378, interval)
    on wake:
      read qword_101390368 (interval), qword_101390370 (last_activity)
      call schedule_full_runtime_refresh(AppHandle)
```

**线程安全**: watcher 通过 `Condvar` 唤醒（来自 
ote_usage_refresh_activity` / `update_usage_refresh_schedule`），持有 `WryHandle` 引用（`AppHandle` 后端）。

---

## 5. auto-switch pending watcher 线程模型

```
start_auto_switch_pending_watcher (0x100263444):
  1. WryHandle::clone (0x1003563cc):
     - CFRunLoopGetMain, CFRunLoopSourceCreate, CFRunLoopAddSource, CFRunLoopWakeUp
  2. atomic_fetch_add(a1+136, 1) → MSB 检查 → panic if set
  3. atomic_fetch_add(a1+144, 1) → MSB 检查 → panic if set
  4. v4[0] = 0x8000000000000000 (sentinel)
  5. std::thread::spawn_unchecked(WryHandle clone, v4, 0):
     - std::sys::thread::unix::Thread::new (0x100d35554)
          └─ pthread_attr_init → pthread_attr_setstacksize → pthread_create
     - 失败: unwrap_failed("failed to spawn thread") → panic
  6. drop JoinHandle（fire-and-forget，detached）
```

**触发路径**: `main(0x100001174)` → `run_daemon_once_cli(0x100313838)` → daemon runtime → `start_auto_switch_pending_watcher`

---

## 6. OnceBox<Mutex<Repository>> 共享状态模式

所有 daemon/auto-switch/system IPC 命令遵循同一模式：
```rust
// 伪码
let repo = REPO_ONCE_BOX.get_or_init(|| Mutex::new(Repository::new()));
let guard = repo.lock().expect("poisoned lock: another task failed inside");
// ... do work ...
drop(guard); // Mutex::unlock
```

- 毒锁错误字符串：`"poisoned lock: another task failed inside"`（静态，VA 在 rodata）
- 错误 discriminant：`0x8000000000000000`（Err/discriminant bit），tag=2 或 tag=3（依命令）
- 所有命令串行访问 Repository（Mutex 保证）

---

## 7. 实现指导

- `run_daemon_once` 同时需要 IPC handler 和 CLI `main()` match arm
- boot-spawn 命令（start_usage_refresh_watcher 等）在 Tauri `setup()` / `run()` hook 中调用，不经 IPC
- `install_daemon` + LaunchAgent plist 注册在 macOS 为必要步骤（Windows 另行）
- watcher 线程用 `std::thread::spawn_unchecked` + JoinHandle drop（detached），不需要线程跟踪
- `Condvar::wait_timeout` 是 watcher 唤醒机制，
ote_usage_refresh_activity` 和 `update_usage_refresh_schedule` 是唤醒者
