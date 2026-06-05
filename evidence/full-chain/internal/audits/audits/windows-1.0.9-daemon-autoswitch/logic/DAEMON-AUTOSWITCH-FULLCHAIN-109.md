# Daemon + Auto-Switch 完整调用链 — AiMaMi 1.0.9 Windows

版本：1.0.9  
平台：Windows x64  
Binary SHA: a5822387fa3f56dc03893111f4ffdd074daa882e8887ec4e7c394879c0e9fe0b  
Gate: strictImplementationUse (9 命令) | consumerStartReady ABSENT (4 命令)  
Total: 13 命令 (daemon 6 + auto-switch 7)

---

## ABSENT FROM WINDOWS BINARY (4 Daemon Commands)

以下 4 个 daemon IPC 命令不在 Windows 1.0.9 二进制中，无调用链可逆向：

| 命令 | gate | Windows 状态 |
|---|---|---|
| 
ote_usage_refresh_activity` | consumerStartReady/ABSENT | 无此命令 |
| `schedule_full_runtime_refresh` | consumerStartReady/ABSENT | 无此命令 |
| `start_usage_refresh_watcher` | consumerStartReady/ABSENT | Windows 替代: get/set_usage_refresh_interval |
| `update_usage_refresh_schedule` | consumerStartReady/ABSENT | Windows 替代: set_usage_refresh_interval (persistence-only) |

---

## 0. `start_auto_switch_pending_watcher` (native bootstrap thread)

**无 IPC 命令** — Tauri run() 时 boot-spawned 原生后台线程：

```
Tauri Application::run()
    → auto_switch_watcher_bootstrap_sys @ 0x14028CCB0 (size 0xA84)
          (Tauri run bootstrap hook; spawns watcher thread)
          → std_thread_spawn_wrapper_sys @ 0x140004980 (size 0x138)
                (std::thread::spawn wrapper)
                → CreateThread @ 0x14002A7E0
                      (Windows thread creation; watcher loop body)
```

**dim1**: native_bootstrap_substitute (GATE-SPEC accepted path — no IPC string needed)  
**Gate**: strictImplementationUse

---

## 1. `configure_auto_switch`

**Frontend → Backend**

```
settings-page useMutation.mutationFn (settings-page-CHeElwco.js L7)
  guard: s.enable && <call>
  → We.configureAutoSwitch(threshold5hPercent, thresholdWeeklyPercent)
  → invoke("configure_auto_switch", {threshold5hPercent, thresholdWeeklyPercent})
    ↓
  configure_auto_switch_owner_sys @ 0x14027BE90
    → configure_auto_switch_core_impl @ 0x1400A7C00
        → sub_14055C740 (state_write_threshold5hPercent_thresholdWeeklyPercent)
          [RwLock write: threshold5hPercent: u32, thresholdWeeklyPercent: u32]
        → WakeByAddressSingle
    → tauri_ipc_resolve_sys → ()
```

**Interface**: `argKeys=[threshold5hPercent:u32, thresholdWeeklyPercent:u32]` | response=`()` | error=CoreError (poisoned lock)

---

## 2. `confirm_pending_auto_switch`

**Frontend → Backend**

```
FunctionDeclaration:pf @ index-CL22l5v8.js L82
  → We.confirmPendingAutoSwitch()
  → invoke("confirm_pending_auto_switch")
    ↓
  confirm_pending_auto_switch_owner_sys @ 0x14026EA00
    boundary: early exit if pendingSwitchAccountKey == None
    → confirm_pending_auto_switch_core_impl @ 0x1400A9BD0
        → sub_140563ED0 (promote_pending_to_active)
          [RwLock write: activeAccountKey←pendingSwitchAccountKey, switchedAccountKey←pendingSwitchAccountKey, pendingSwitchAccountKey=None]
        → WakeByAddressSingle
        → sub_140607A20 (tokio_task_spawn) [async follow-up]
    → sub_1400550D0 (cleanup)
    → tauri_ipc_resolve_sys → ()
```

**Interface**: `argKeys=[]` | response=`()` | error=CoreError

---

## 3. `confirm_pending_auto_switch_and_restart_codex`

**Frontend → Backend**

```
ArrowFunction @ index-CL22l5v8.js L284
  guard: await We.confirmPendingAutoSwitchAndRestartCodex(), if (!!t || o)
  → invoke("confirm_pending_auto_switch_and_restart_codex", {app})
    ↓
  auto_switch_multiplex_dispatcher_sys @ 0x1402663E0
    (memcmp routing on command string 0x14129C7A0)
    → confirm_pending_auto_switch_and_restart_coroutine @ 0x1408E4F50
        (spawned via tokio::task::spawn @ sub_140607A20)
        → promote_pending_to_active (same as above)
        → restart_codex @ sub_140388010
            → signal_codex_quit_wake
            → quit_codex_wait_fallback_kill_sys (8s timeout kill)
            → check_update_installability_core_sys
            → relaunch
        → WakeByAddressSingle
    → tauri_ipc_resolve_sys → ()
```

**Interface**: `argKeys=[app:AppHandle]` | response=`()` | error=CoreError  
**restart_bridge_addr**: 0x14129C7A0

---

## 4. `dismiss_pending_auto_switch`

**Frontend → Backend**

```
ArrowFunction @ index-CL22l5v8.js L284
  guard: if (!!t || o) { dismiss }
  → We.dismissPendingAutoSwitch()
  → invoke("dismiss_pending_auto_switch")
    ↓
  dismiss_pending_auto_switch_owner_sys @ 0x14027F120
    → dismiss_pending_auto_switch_core_impl @ 0x1400AA290
        → sub_140564060 (state_clear_pendingSwitchAccountKey)
          [RwLock write: pendingSwitchAccountKey=None; returns old value]
        → WakeByAddressSingle
        → sub_14006BAA0 (response_Option_String: serialize old field or null)
    → tauri_ipc_resolve_sys → Option<String>
```

**Interface**: `argKeys=[]` | response=`Option<String>` (旧 pendingSwitchAccountKey 或 null) | error=CoreError (poisoned lock)

---

## 5. `load_bootstrap_state`

**Frontend → Backend**

```
FunctionDeclaration:Uv @ index-CL22l5v8.js L86
  wrapperCall → We.loadBootstrapState()
  → invoke("load_bootstrap_state")
    ↓
  load_bootstrap_state_owner_sys @ 0x140272E80
    → load_bootstrap_state_core_serialize @ 0x140451160
        → JSON builders (schemaVersion, success, code, message, data{...})
        → sub_140419B00 (date_serialize: executedAt ISO string)
        → sub_141204520 (CoreError path)
    → sub_140298200 (context_drop)
    → tauri_ipc_resolve_sys → BootstrapState JSON
```

**Interface**: `argKeys=[]` | response=`BootstrapState JSON` | side-effect=**none (read-only)**

**BootstrapState**:
```json
{
  "schemaVersion": "string",
  "success": true,
  "code": "string",
  "message": "string",
  "data": {
    "executedAt": "ISO-date-string",
    "runOnce": false,
    "autoSwitchEnabled": false,
    "activeAccountKey": "string",
    "switchedAccountKey": "string",
    "pendingSwitchAccountKey": null
  }
}
```

---

## 6. `load_pending_auto_switch`

**Frontend → Backend**

```
v.useEffect hook @ index-CL22l5v8.js L284 (element: hook)
  → We.loadPendingAutoSwitch()
  → invoke("load_pending_auto_switch")
    ↓
  auto_switch_multiplex_dispatcher_sys @ 0x1402663E0
    (memcmp routing on command string 0x141268DFE; no dedicated owner wrapper)
    → core read @ 0x140564060
        [RwLock read: pendingSwitchAccountKey field]
    → response Option<String>
    → tauri_ipc_resolve_sys → Option<String>
```

**Interface**: `argKeys=[repo:str]` | response=`CoreEnvelope<PendingAutoSwitchState>{currentAccountKey, candidateAccountKey, dismissedAt}` | error=CoreError (sqlite read fail)  
**side_effects**: reads state_5.sqlite; writes serialized JSON back to sqlite (state_5.sqlite + 672 offset)  
**dispatch_note**: no dedicated owner wrapper; multiplex dispatch via memcmp routing @ string 0x141268DFE

---

## 7. `run_daemon_once`

**Frontend → Backend** (最关键命令，触发 daemon 调度)

```
We.runDaemonOnce() → invoke("run_daemon_once")
    ↓
  run_daemon_once_owner_sys @ 0x1402843E0
    → run_daemon_once_core_resolve @ 0x1400723D0
        (获取 app state + RwLock<BootstrapState> 引用)
    → run_daemon_once_core_impl @ 0x1400A3A40
        ├─ Read BootstrapState (RwLock::read)
        ├─ if runOnce=true:
        │       → sub_140451160 (JSON serialize, no schtask)
        │       → tauri_ipc_resolve_sys
        └─ if runOnce=false:
               → schtask_trigger @ sub_14056B7F0
                     → daemon_schtasks_register @ 0x1403FB450
                           → CreateProcess("schtasks.exe",
                               "/Create /SC MINUTE /MO 5 /TN CodexMateAutoSwitch /TR <exe_path> /F")
               → update schedule state: sub_14055D580, sub_14055BAC0
               → WakeByAddressSingle (wake waiting threads)
    → sub_140451160 (JSON_bootstrap_serialize)
    → sub_1400CA120 (arena_drop)
    → sub_1400A4E70 (err_envelope)
    → tauri_ipc_resolve_sys → BootstrapState JSON
```

**Interface**: `argKeys=[]` | response=BootstrapState JSON (same DTO as load_bootstrap_state)  
**Daemon trigger**: `schtasks /Create /SC MINUTE /MO 5 /TN CodexMateAutoSwitch /TR <exe_path> /F`

---

## 8. `set_auto_switch`

**Frontend → Backend**

```
settings-page useMutation.mutationFn (settings-page-CHeElwco.js L7)
  → We.setAutoSwitch(enabled)
  → invoke("set_auto_switch", {enabled: bool})
    ↓
  set_auto_switch_owner_sys @ 0x140272080
    → set_auto_switch_core_impl @ 0x1400A4F60
        → sub_1405565F0 (state_write_autoSwitchEnabled)
          [RwLock write: autoSwitchEnabled = enabled]
        → WakeByAddressSingle
    → sub_1400C8830 (cleanup)
    → tauri_ipc_resolve_sys → ()
```

**Interface**: `argKeys=[enabled:bool]` | response=`()` | error=CoreError (poisoned lock)

---

## 共用状态写路径模式

所有写类命令遵循同一模式：
1. owner_sys 获取 app state (Tauri managed state)
2. core_impl 获取 RwLock::write()
3. 修改目标字段
4. 调用 WakeByAddressSingle 唤醒等待线程
5. 释放锁
6. owner_sys 调用 tauri_ipc_resolve_sys 返回结果

这是 Windows x64 特有的实现：Linux/macOS 版本使用不同的 futex/条件变量原语。
