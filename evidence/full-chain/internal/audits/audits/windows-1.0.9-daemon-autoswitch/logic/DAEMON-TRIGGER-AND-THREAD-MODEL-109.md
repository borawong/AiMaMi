# Daemon 触发机制与线程模型 — AiMaMi 1.0.9 Windows

版本：1.0.9  
平台：Windows x64  
Binary SHA: a5822387fa3f56dc03893111f4ffdd074daa882e8887ec4e7c394879c0e9fe0b

---

## 一句话结论

`run_daemon_once` 命令执行时，若 `runOnce=false`，通过 `schtasks.exe /Create /SC MINUTE /MO 5 /TN CodexMateAutoSwitch /TR <exe_path> /F` 向 Windows 任务计划器注册 5 分钟循环任务，实现守护进程的持久化调度；共享状态通过 `RwLock<BootstrapState>` 保护，线程唤醒使用 `WakeByAddressSingle`（Windows futex 等价原语）。

---

## 触发链（bootstrap spawn chain）

```
Frontend: We.runDaemonOnce() → invoke("run_daemon_once")
    ↓
Backend owner: run_daemon_once_owner_sys @ 0x1402843E0
    ↓
Core resolve: run_daemon_once_core_resolve @ 0x1400723D0
    (解析 app state，获取 RwLock<BootstrapState> 引用)
    ↓
Core impl: run_daemon_once_core_impl @ 0x1400A3A40
    ├─ 读 BootstrapState.runOnce
    ├─ if runOnce=true: 跳过调度，直接序列化返回
    └─ if runOnce=false:
           → schtask_trigger @ sub_14056B7F0
                 → daemon_schtasks_register @ 0x1403FB450
                       → CreateProcess("schtasks.exe", "/Create /SC MINUTE /MO 5 /TN CodexMateAutoSwitch /TR <exe_path> /F")
           → update schedule state (sub_14055D580, sub_14055BAC0)
           → WakeByAddressSingle (唤醒等待线程)
    ↓
Response serialize: sub_140451160 (JSON BootstrapState)
    ↓
tauri_ipc_resolve_sys → frontend
```

---

## Windows 计划任务参数

| 参数 | 值 |
|---|---|
| 注册命令 | `schtasks /Create` |
| 触发频率 | `/SC MINUTE /MO 5` (每 5 分钟) |
| 任务名 | `/TN CodexMateAutoSwitch` |
| 执行目标 | `/TR <exe_path>` (AiMaMi 可执行文件路径) |
| 强制覆盖 | `/F` |

**与 macOS 的差异**：macOS 使用 LaunchAgent plist (`launchctl`/`com.aimami.*`)；Windows 使用 `schtasks.exe`。不得外推 macOS LaunchAgent 机制到 Windows 实现。

---

## 线程同步模型

```
BootstrapState: {
  runOnce: bool,
  autoSwitchEnabled: bool,
  activeAccountKey: String,
  switchedAccountKey: String,
  pendingSwitchAccountKey: Option<String>,
  executedAt: DateTime,
}

访问方式: RwLock<BootstrapState>
  - 读: RwLock::read() — 无副作用读（load_bootstrap_state, load_pending_auto_switch）
  - 写: RwLock::write() — 修改字段后 WakeByAddressSingle

WakeByAddressSingle:
  - 等价于 Linux futex FUTEX_WAKE_PRIVATE 单线程唤醒
  - 用于通知等待线程状态已改变（autoSwitchEnabled toggle / pending switch 设置）
  - 出现在所有写类命令中：configure_auto_switch, set_auto_switch, dismiss_pending_auto_switch, confirm_pending_auto_switch
```

---

## 各命令对 BootstrapState 的副作用

| 命令 | 字段操作 |
|---|---|
| `load_bootstrap_state` | 只读，无副作用 |
| `run_daemon_once` | 读 runOnce + 写 schedule state + 触发 schtasks（runOnce=false 时）|
| `set_auto_switch` | 写 autoSwitchEnabled |
| `configure_auto_switch` | 写 threshold5hPercent + thresholdWeeklyPercent |
| `load_pending_auto_switch` | 只读 pendingSwitchAccountKey |
| `dismiss_pending_auto_switch` | 写 pendingSwitchAccountKey = None，返回旧值 |
| `confirm_pending_auto_switch` | 写 activeAccountKey←pendingSwitchAccountKey，写 switchedAccountKey，清空 pendingSwitchAccountKey |
| `confirm_pending_auto_switch_and_restart_codex` | 同 confirm + kill Codex process + relaunch |

---

## Restart Codex 路径（confirm…and_restart_codex）

```
confirm_pending_auto_switch_and_restart_codex
    dispatched via auto_switch_multiplex_dispatcher_sys @ 0x1402663E0
    → confirm_pending_auto_switch_and_restart_coroutine @ 0x1408E4F50
          (tokio async coroutine, spawned via tokio::task::spawn)
          → promote pendingSwitchAccountKey → activeAccountKey
          → restart bridge:
              signal_codex_quit_wake (发送退出信号)
              + quit_codex_wait_fallback_kill_sys (等待 Codex 退出，超时 8 秒后强制 kill)
              + check_update_installability_core_sys (重启前检查)
          → relaunch Codex
    restart_bridge_addr: 0x14129C7A0
```

---

## Auto-Switch Watcher 线程（native bootstrap）

`start_auto_switch_pending_watcher` **不是 IPC 命令**，而是 Tauri run() 启动时 bootstrap 触发的原生后台线程：

```
Tauri run()
    → auto_switch_watcher_bootstrap_sys @ 0x14028CCB0 (size 0xA84)
          → std_thread_spawn_wrapper_sys @ 0x140004980 (size 0x138)
                → CreateThread @ 0x14002A7E0
```

- 无 Tauri IPC 命令字符串
- boot-spawned，随进程启动一次
- dim1 via native_bootstrap_substitute（GATE-SPEC 允许路径）
- gate: strictImplementationUse

---

## ABSENT from Windows 1.0.9（确认缺失的 macOS IPC 命令）

以下 IPC 命令在 macOS 版本中存在，**经 IDA 独立分析确认不在** Windows 1.0.9 二进制中：

| 命令 | Windows 状态 |
|---|---|
| 
ote_usage_refresh_activity` | ABSENT — 无此命令；Windows 无 watcher 活动通知机制 |
| `schedule_full_runtime_refresh` | ABSENT — 无此命令；Windows 无 debounce refresh 任务 |
| `start_usage_refresh_watcher` | ABSENT — Windows 替代: get/set_usage_refresh_interval IPC pair (0x14045F6C0, 0x14027F690) |
| `update_usage_refresh_schedule` | ABSENT — Windows 替代: set_usage_refresh_interval @ 0x14027F690 (persistence-only, no condvar) |

禁止在 Windows 实现中假设这 4 个命令存在或使用相同 API。
禁止从 macOS 外推行为到 Windows 实现（`doNotInferWindowsFromMacOS=true`）。
