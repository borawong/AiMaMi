# AiMaMi 1.0.9 macOS system 模块 — 全链路实现依据

平台: macOS arm64  
版本: 1.0.9  
binary_sha256: 1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482  
用途: 直接写代码依据（CC/Codex 共享）  

---

## 1. force_kill_codex

### 前端触发链

```
MaintenancePage Ye() [maintenance-page-j6kXR210.js L32]
  └── useMutation V = T({ mutationFn: () => S.forceKillCodex() })
        └── action item field:"forceKill"
              └── onAction: () => d("forceKill", () => V.mutateAsync())
                    └── debounced runner d() min 800ms
                          └── We.forceKillCodex() → G("force_kill_codex")
                                └── invoke("force_kill_codex")
```

前端消费: `a.data.killedCount` (number), `a.data.processes` (string[])  
guard: `if (b[a]) return` (幂等保护); loading: spinner + i18n field `maintenance.forceKilling`  
error: inline result (not toast); success: killedCount=0 → 特殊 message

### 后端全链路

```
force_kill_codex [0x10025e654] (命令入口)
  └── force_kill_all_codex_processes [0x10067538c]
        ├── list_all_codex_processes [0x100674c48]
        │     └── ps -ax -o pid=,command= (subprocess via std::process::Command)
        ├── for each matched PID: force_kill_pid [0x100674274]
        │     └── kill -9 <pid> (subprocess via std::process::Command)
        ├── std::thread::sleep(500ms)
        ├── list_all_codex_processes (pass 2, survivors only)
        ├── for each survivor: force_kill_pid
        └── std::thread::sleep(1000ms)
  └── CoreEnvelope::ok(killed_pids_vec) [0x1001d9148]
```

过滤词: `["Codex.app", "AiMaMi.app", "/.cursor/extensions/", "//Cursor.app/", "node_repl", "Codex Helper"]`

### 接口契约

```
request:  force_kill_codex (无参数)
response: CoreEnvelope { status:"ok", data: { killedCount: number, processes: string[] } }
error:    CoreError (from list_all_codex_processes ps 调用失败)
side-effects: SIGKILL to matched PIDs ×2 pass; OS sleep 500ms+1000ms; no file writes
```

---

## 2. reset_codex_config

### 前端触发链

```
MaintenancePage Ye() [maintenance-page-j6kXR210.js L32]
  ├── guard: disabled: i (codexRouterEnabled=true 时禁用)
  ├── y = () => { _(!0) }  →  打开确认 Dialog (M state=true)
  └── f = () => { _(!1); d("resetConfig", () => K.mutateAsync()) }
        └── We.resetCodexConfig() → G("reset_codex_config")
              └── invoke("reset_codex_config")
```

前端消费: `a.data.configCleared` (boolean)  
success: configCleared=true → "reset done"; configCleared=false → "not found"  
guard: relay 锁定 (codexRouterEnabled check) + Dialog 确认 + 幂等保护

### 后端全链路

```
reset_codex_config [0x10025fbc8] (命令入口)
  ├── RelayManager::snapshot [0x1001cfc44]  ← 第一道门：relay 活跃状态检查
  │     ├── Mutex::lock [0x100d3499c]       (pthread_mutex_lock)
  │     ├── RelayState::clone [0x10020cc2c]
  │     └── Mutex::unlock [0x100d349b8]     (pthread_mutex_unlock)
  │     → 若 relay 活跃: 返回 CoreEnvelope Err (hardcoded 70-byte error string)
  ├── CodexPaths::resolve_codex_home [0x100526914]
  │     ├── env::var("CODEX_HOME") [0x100d2f57c]   (优先)
  │     ├── dirs::home_dir() [0x100b9f628]          (fallback)
  │     └── Path::join(".codex") [0x100d38cc4]
  ├── CodexPaths::from_home [0x100526a40]
  │     ├── fs::metadata [0x100d322dc]              (stat for backup dir check)
  │     └── fs::rename [0x100d31eac]                (rename backup dir if exists)
  ├── fs::metadata(config_toml_path) [0x100d322dc]  (check if exists)
  │     → if not exists: CoreEnvelope::ok({success: false})
  └── fs::write::inner(path, content_ptr=1, len=0) [0x100d2c974]  ← 截断为 0 字节
        ├── open(2) O_WRONLY|O_CREAT|O_TRUNC|O_CLOEXEC (0x601 computed)
        ├── write(2) NOT called (len=0)
        └── close(2)
  └── CoreEnvelope::ok({success: true}) [0x1001d9148]
```

注意: 是截断 (truncate to 0)，不是删除文件。

### 接口契约

```
request:  reset_codex_config (无参数)
response: CoreEnvelope { status:"ok", data: { configCleared: bool } }
          configCleared=true: config.toml 存在且已截断
          configCleared=false: config.toml 不存在
error variants:
  - relay_active_error: CoreEnvelope Err (relay 活跃时，first gate)
  - write_io_error: CoreEnvelope Err (fmt std::io::Error, truncate 失败时)
path:     $CODEX_HOME/config.toml | ~/. codex/config.toml | ./.codex/config.toml
side-effects: TRUNCATES config.toml to 0 bytes (NOT DELETE); acquires relay mutex
```

---

## 3. get_image_compat

### 前端触发链

```
MaintenancePage Ye() [maintenance-page-j6kXR210.js L32]
  └── useQuery (Ne) p = Ne({ queryKey: ["imageCompat"], queryFn: async () => (await S.getImageCompat()).data.enabled })
        └── We.getImageCompat() → G("get_image_compat")
              └── invoke("get_image_compat")
```

前端消费: `.data.enabled` (boolean) → Switch `toggleChecked: p.data ?? false`  
重新触发: set_image_compat 成功后 `invalidateQueries({queryKey: ["imageCompat"]})`

### 后端全链路

```
get_image_compat [0x10025e7c0] (命令入口)
  ├── CodexPaths::resolve_codex_home [0x100526914]
  │     (同 reset_codex_config 路径解析逻辑)
  ├── std::fs::read_to_string($CODEX_HOME/codexmate/config.toml)
  │     ├── CharSearcher::next_match    (搜索 [features] 节)
  │     └── str::trim_matches / trim_start_matches
  │     → IO error → CoreEnvelope<bool>(false)  [降级，不抛 CoreError]
  └── CoreEnvelope::ok(bool) [0x1001d9148]
```

enabled=true 条件: `[features]` 节存在 AND `image_generation = false`  
（注意: image_generation = false 时返回 enabled=true，语义反转）

### 接口契约

```
request:  get_image_compat (无参数)
response: CoreEnvelope<bool>
          true:  [features] 节存在 AND image_generation = false
          false: 文件缺失 / IO 错误 / 节不存在 / field 不存在 / value != "false"
error:    none — IO errors degrade to CoreEnvelope<bool>(false)
path:     $CODEX_HOME/codexmate/config.toml
side-effects: READ only (+ possible fs::rename in from_home migration path)
```

---

## 4. set_image_compat

### 前端触发链

```
MaintenancePage Ye() [maintenance-page-j6kXR210.js L32]
  └── useMutation D = T({ mutationFn: async a => { await S.setImageCompat(a) } })
        └── action item field:"imageCompat", isToggle:true
              └── Switch onCheckedChange → Y() → j(!(p.data ?? false))
                    └── d("imageCompat", () => D.mutateAsync(enabled_value))
                          └── We.setImageCompat(enabled) → G("set_image_compat", { enabled: t })
                                └── invoke("set_image_compat", { enabled: bool })
```

onSuccess: `invalidateQueries({queryKey: ["imageCompat"]})` → 触发 get_image_compat 重新 fetch

### 后端全链路

```
set_image_compat(enabled: bool) [0x10025ee14] (命令入口)
  ├── CodexPaths::resolve_codex_home [0x100526914]
  │     (CODEX_HOME / home_dir/.codex / .)
  ├── CodexPaths::from_home [migration path]
  │     (fs::metadata + fs::rename for backup dir)
  ├── std::fs::read_to_string($CODEX_HOME/codexmate/config.toml) [0x100d2c1f4]
  │     → O_RDONLY open + fstat + read loop + close
  ├── TOML 行扫描/修改:
  │     1. split content by lines
  │     2. find [features] section
  │     3. find/update/insert/append "image_generation = <value>" field
  │     value = "false" if enabled=true; "true" if enabled=false (语义反转)
  └── std::fs::write(path, new_content) [0x100d2c974]
        ├── open(2) O_WRONLY|O_CREAT|O_TRUNC 0666 (非原子)
        ├── write loop with EINTR retry
        └── close(2)
  └── CoreEnvelope::ok(bool) [0x1001d9148]
```

重要: 写入非原子；toggle vs explicit-set 候选歧义 (accepted_unknown)

### 接口契约

```
request:  set_image_compat { enabled: bool }
response: CoreEnvelope<bool> { status:"ok", data: bool }
error:    write_fail → CoreEnvelope error string (io::Error display)
          read_fail_path → CoreEnvelope::ok(false) + write error silently swallowed
path:     $CODEX_HOME/codexmate/config.toml (via codexmate subpath, not root .codex)
side-effects:
  - READ:  O_RDONLY open config.toml
  - WRITE: O_WRONLY|O_CREAT|O_TRUNC (full file overwrite, non-atomic)
  - TOML field: [features].image_generation = "false"/"true" (反转于 enabled 参数)
```

---

## 5. get_system_info

### 前端触发链

```
async function $x() [index-CL22l5v8.js L86 col 120093]
  └── Promise.all([We.getDeviceId(), We.getSystemInfo(), IP()])
        → { deviceId, sysInfo, appVersion }
        → Bx(deviceId, sysInfo, appVersion)
              → { deviceId, os: sysInfo.os, osVersion: sysInfo.osVersion, arch: sysInfo.arch, appVersion, hostname: sysInfo.hostname }

$x() 被以下调用:
  LP() → ir.heartbeat(payload)
  jP(t) → heartbeat + callback
  py() → try { await LP() } catch {}
  UP(enabled) → useEffect 轮询 py(), 每 300秒 (FP=300*1000)
```

无直接 UI button；隐式后台调用；错误被 `catch {}` 静默吞噬

### 后端全链路

```
get_system_info [0x10025d0b4] (命令入口)
  ├── hardcoded literal "macos" (5 bytes) → os 字段
  ├── hardcoded literal "aarch64" (7 bytes) → arch 字段
  ├── std::process::Command("sw_vers").arg("-productVersion").output()
  │     ├── waitpid syscall
  │     └── read_to_end (stdout pipe)
  │     → stdout.trim() → osVersion 字段
  │     → 失败 → "unknown"
  ├── hostname::get [0x10078660c]
  │     ├── sysconf(SC_HOST_NAME_MAX)
  │     └── gethostname syscall
  │     → 失败 → "unknown"
  └── IpcResponse::body [0x1002680c0]
        └── serde_json serialize 4 keys:
              "os"(2) @ 0x100EE465A, "osVersion"(9) @ 0x100EE465C,
              "arch"(4) literal, "hostname"(8) literal
  └── InvokeResolver::return_result
```

### 接口契约

```
request:  get_system_info (无参数)
response: JSON object (direct serde, not CoreEnvelope wrapping)
          { os: string, osVersion: string, arch: string, hostname: string }
          os: 硬编码 "macos"
          arch: 硬编码 "aarch64"
          osVersion: sw_vers -productVersion stdout (trim), 失败 "unknown"
          hostname: gethostname, 失败 "unknown"
error:    none (CoreError path absent; all failures degrade to "unknown")
side-effects: spawns sw_vers subprocess (read-only); no file writes
```

---

## 6. check_update_installability

### 前端触发链

```
路径 A: hD() hook [index-CL22l5v8.js L284 col 104760]
  └── useEffect([], mount once)
        └── We.checkUpdateInstallability().then(l => {
              if (!a && (l.code === "app_translocation" || l.code === "read_only_location"))
                e(true)  // open Dialog
            }).catch(() => {})

路径 B: useCallback [index-CL22l5v8.js L86 col 114535]
  └── if (w) { ...; We.checkUpdateInstallability()... }
```

Dialog action: `openApplications()` → `await We.openPath("/Applications"); e(false)`

### 后端全链路

```
Tauri IPC closure [0x1003290d4]
  └── check_update_installability (platform) [0x100578128]
        ├── __NSGetExecutablePath → exe_path string
        ├── exe_path → walk up until .app extension found → app_path
        ├── is_app_translocation_path(exe_path) [0x100578020]
        │     └── StrSearcher search for "/AppTranslocation/" (18 bytes)
        ├── is_volumes_read_only = app_path.starts_with("/Volumes/")
        ├── can_install = !(is_translocation || is_volumes_read_only)
        ├── status_tag:
        │     "app_translocation" if is_translocation
        │     "read_only_location" if is_volumes_read_only && !is_translocation
        │     "ok" otherwise
        ├── xattr -p com.apple.quarantine <app_path> (subprocess)
        │     exit_code==0 → quarantine_cleared=true (present, not cleared — naming misnomer)
        │     nonzero → quarantine_cleared=false
        └── serialize response: { status, exe_path?, app_path?, can_install, is_translocation, quarantine_cleared }
  └── InvokeResolver::respond
```

IPC 命令名 rodata 字符串未在打包命令名中找到（accepted_unknown；前端 CCF 确认 invoke 字符串）

### 接口契约

```
request:  check_update_installability (无参数)
response: {
    status: "ok" | "app_translocation" | "read_only_location",
    exe_path: string | null,   // .app bundle 父目录
    app_path: string | null,   // 候选安装路径
    can_install: bool,         // !(is_translocation | is_volumes_read_only)
    is_translocation: bool,    // path 含 /AppTranslocation/
    quarantine_cleared: bool   // xattr exit_code==0 (quarantine attribute present, NOT cleared)
  }
error:    none (all errors handled silently with fallback values)
side-effects: xattr probe (read-only); no file writes; no config changes; no network
注意: quarantine_cleared=true 语义反直觉：表示 quarantine 属性存在（未被清除），xattr exit=0
```

---

## 7. Helpers / Watchers (5 件 — source archive-local product_decision)

以下命令在 upstream AiMaMi 1.0.9 中无确认 IPC 名称，无 raw leaf，不 decompile。  
source archive 产品决策承担差异，按 consumerStartReady (product_decision) 实现。

| 命令 | source archive-local 边界 |
|---|---|
| note_usage_refresh_activity | 记录用户活跃，供 usage_refresh 调度使用 |
| schedule_full_runtime_refresh | 调度全量运行时刷新 |
| start_auto_switch_pending_watcher | 监听账号自动切换 pending 状态 |
| start_usage_refresh_watcher | 启动 usage 刷新 watcher |
| update_usage_refresh_schedule | 更新 usage 刷新调度配置 |

这些命令在 INDEX.jsonl 无对应 1.0.9 macos system leaf 记录。  
实现时按 source archive 业务逻辑设计，不宣称 upstream strict parity。

---

## 跨命令共享模式

- **路径解析**: `CodexPaths::resolve_codex_home` (0x100526914) + `from_home` (0x100526a40) 被 reset_codex_config / get_image_compat / set_image_compat 共享
- **CoreEnvelope::ok**: 0x1001d9148 — force_kill_codex / reset_codex_config 的标准响应路径
- **错误降级 vs CoreError**: get_image_compat / get_system_info / check_update_installability 无 CoreError path（错误降级）；force_kill_codex / reset_codex_config 有 CoreError path
- **macOS only**: os/arch 硬编码为 "macos"/"aarch64"；Windows 需独立实现
