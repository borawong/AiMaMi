# SYSTEM-FULLCHAIN-109 — AiMaMi 1.0.9 Windows system 模块端到端调用链

版本: 1.0.9  平台: Windows x64
Binary SHA-256: a5822387fa3f56dc03893111f4ffdd074daa882e8887ec4e7c394879c0e9fe0b
用途: 可直接用于 source archive 实现的调用链还原逻辑（写代码依据）

---

## 1. force_kill_codex

### 实现性质
Windows 1.0.9 中 **无 Tauri 命令字符串** `force_kill_codex`。
实现为内部 Rust helper `force_kill_codex_by_imagename` (VA 0x1402507B0)，仅从内部编排代码调用。

### 端到端调用链

```
[内部调用者]
  notify_quit_codex_wait_fallback_kill (0x140254320)
    └─> signal_codex_quit_wake (0x140254510)         // WakeByAddressSingle 发送退出信号
    └─> force_kill_codex_by_imagename (0x1402507B0)
          └─> sub_14103D7A0: build OsString "taskkill"
          └─> sub_14103D680: append arg "/IM"
          └─> sub_14103D680: append arg "Codex.exe"
          └─> sub_141042780: std::process::Command::spawn
                └─> OS: taskkill /IM Codex.exe (CREATE_NO_WINDOW=0x8000000)
          └─> [wait exit status]
                OK → a1[0]=10 (Ok tag)
                Err → a1[0]=9 (Err tag); message="taskkill Codex failed: <ExitStatus>"
    └─> scan_codex_process_list (0x140254CE0)
          └─> CreateToolhelp32Snapshot (snapshot type SNAPPROCESS)
          └─> Process32FirstW / Process32NextW (enumerate processes)
          └─> serialize_force_kill_response (0x14044EE30)
                → JSON: {success:bool, code:i64, message:string, data:{killedCount:u32, processes:[{pid:u32,name:string}]}}

  quit_codex_wait_fallback_kill (0x140254140)         // 无 pre-signal 变体
    └─> force_kill_codex_by_imagename (0x1402507B0)  // 同上
    └─> kill_process_by_name_taskkill (0x1402502E0)  // 最终兜底
```

### source archive 实现指引
- Windows 实现应内化 taskkill /IM Codex.exe 逻辑（std::process::Command 等价）
- 扫描流程: CreateToolhelp32Snapshot → 枚举 → 返回 {killedCount, processes}
- 不得注册为 Tauri 命令；应作为内部 kill 辅助函数
- 错误: CODEX_APP_QUIT_TIMEOUT 字符串（超时后返回给调用者）
- macOS 实现独立，不得参照此 Windows 逻辑外推

---

## 2. reset_codex_config

### 端到端调用链

```
Frontend:
  MaintenancePage Ye()
    → 确认 Dialog (M state)
    → useMutation K: S.resetCodexConfig()
    → G("reset_codex_config")
    → Tauri IPC invoke

Backend:
  sub_1402663E0 (system dispatcher, 41-case)
    → case len=18: "reset_codex_config" dispatch
    → tauri_cmd_reset_codex_config_handler (0x14026F590)
          → Tauri IPC context setup
          → sub_1400DA320: async state lookup
          → sub_1411CE640: command resolver
          → relay_manager_reset_codex_config_impl (0x14014DF10)
                [Branch A: router active]
                  → relay_remove_codex_router_catalog (0x1403A1780)
                      → relay_codex_catalog_encode_write (0x1403A1B40)
                          → read current codex_router_catalog.json
                          → remove slug entry, re-encode JSON
                          → relay_atomic_write_file (0x140332540)  [FS LEAF]
                                → CreateFile (temp file)
                                → WriteFile
                                → MoveFileExW(flags=9: REPLACE_EXISTING|WRITE_THROUGH)
                                → retry 9x on ERROR_ACCESS_DENIED (500ms sleep each)
                [Branch B: router inactive]
                  [skip catalog removal]

                [Both branches]
                  → relay_codex_config_toml_write (0x140422D90)
                      → read ~/.codex/config.toml line by line
                      → strip: relay-managed blocks, profile=, model_provider=,
                                model_catalog_json=, open_ai_base_url=
                      → relay_atomic_write_file (0x140332540)  [FS LEAF] (if changed)
                  → Result<bool, Error>: bool = preflight_ran (true = catalog also removed)

          → sub_140062230: InvokeResolver dispatcher (WakeByAddressSingle)

Frontend consumption:
  onSuccess: a.data.configCleared (bool)
  → l("resetConfig", {type:"success", message: configCleared ? t("...done") : t("...notFound")})
  No invalidateQueries.
```

### source archive 实现指引
- `configCleared`: 布尔值，对应后端 relay_manager_reset_codex_config_impl 返回的 bool
  - true → 执行了 preflight（catalog 也删除了）
  - false → 仅 config.toml strip
- Windows: 原子写文件必须用等价于 MoveFileExW(REPLACE_EXISTING|WRITE_THROUGH) + 9x 重试机制
- Guard: relay 激活时前端 resetConfig 按钮 disabled（codexRouterEnabled=true）
- 先弹确认 Dialog 后再执行

---

## 3. get_image_compat

### 状态: consumerStartBlocked（Windows frontend CCF missing）

```
Frontend (macOS CCF — Windows 独立性注意):
  MaintenancePage Ye()
    useQuery p: Ne({queryKey:["imageCompat"], queryFn: async()=>(await S.getImageCompat()).data.enabled})
    → G("get_image_compat")
    → Tauri IPC invoke

[WARNING: Windows 端此命令可能 no-op 或行为不同；不得外推 macOS CCF 到 Windows]

Backend (Windows):
  sub_1402663E0 (system dispatcher)
    → xmmword match at 0x140268199 → handler entry 0x14026A8D7
    → tauri_cmd_get_image_compat_handler (0x1402779B0)
          → memcpy IPC context
          → image_compat_read_config_toml_features (0x1400A55F0)
                → codex_paths_build_from_env (0x140476200)
                      → getenv("CODEX_HOME")  [LEAF: sub_141044C40]
                      → fallback OS default path  [LEAF: sub_140E52B20]
                      → path_join  [LEAF: sub_141035180]
                → codex_paths_join_all_subpaths (0x140476350)
                → sub_14104DEE0: open config.toml  [LEAF: FS read]
                → sub_140091550: line iterator
                → sub_140183010: trim whitespace  [LEAF]
                → sub_1401836B0: find '=' in line  [LEAF]
                → [parse [features] section; check enabled=false]
                → bool result: enabled
          → image_compat_build_response_ok_bool (0x1404391D0)
                → response struct: {ok:{enabled:bool}}
                → sub_140001360: allocator  [LEAF]
          → sub_1400CA020: IPC callback invoke  [LEAF]
          → sub_140298200: response finalize  [LEAF]

Unresolved:
  - xmmword_141257E10: 16-byte feature field prefix (SSE match for field lookup)
  - field name bytes at a1+32 (7-byte: likely 'enabled')
```

### source archive 实现指引（在 Windows CCF 闭合后才可开工）
- 读取 $CODEX_HOME/config.toml（或 OS 默认路径）的 [features] section
- 查找 `enabled` 字段（field 通过 SSE xmmword 匹配，精确 field 名未完全解析，但 response bool 字段已确认为 `enabled`）
- 返回 {data:{enabled:bool}}
- **Windows 实现前必须确认命令在 Windows 是否 no-op**（image_compat 可能 macOS 特有）

---

## 4. set_image_compat

### 端到端调用链

```
Frontend:
  MaintenancePage Ye()
    Switch: <Switch checked={pe??false} onCheckedChange={()=>Y()}>
    Y = onAction = () => j(!(p.data??false))  // toggle 取反当前值
    j = (a) => { d("imageCompat", () => D.mutateAsync(a)) }
    useMutation D: S.setImageCompat(a)
    → G("set_image_compat", {enabled: t})
    → argKeys: ["enabled"] (boolean)
    onSuccess: c.invalidateQueries({queryKey:["imageCompat"]})

Backend:
  sub_1402663E0 → command string 0x141268d1c → set_image_compat
    → set_image_compat_handler (0x14027a1b0)
          → sub_1404632D0: tauri command executor
          → set_image_compat_impl (0x1400a5eb0)
                → codex_paths_build_from_env (0x140476200)  // reads CODEX_HOME or default
                → codex_paths_join_all_subpaths (0x140476350)
                → sub_14104DEE0: ReadFile config.toml  [LEAF: CreateFile/ReadFile]
                → [parse [features] section]
                → if enabled==true:
                    scan for "image_generation = false" (24 bytes @0x1412585c0)
                    if found: remove line
                → if enabled==false:
                    scan for [features] header "[features]" (10 bytes)
                    if not present or entry missing: insert "image_generation = false"
                → sub_14104E390: WriteFile config.toml  [LEAF: CreateFile(truncate)+WriteFile+CloseHandle]
                → image_compat_build_response_ok_bool (0x1404391D0): {ok:{enabled:bool}}
                → sub_14005A510: free CodexPaths  [LEAF]
          → sub_140062230: WakeByAddressSingle  [LEAF]
          → sub_140298200: cleanup  [LEAF]
```

### source archive 实现指引
- 入参: `{enabled: bool}`
- 响应: `{ok:{enabled:bool}}`（回显传入值）
- Side-effect: 写 $CODEX_HOME/config.toml（Windows 直接 CreateFile truncate + WriteFile，无原子写）
- enabled=true → 移除 `image_generation = false` 行
- enabled=false → 插入 `image_generation = false` 在 [features] header 后
- 成功后前端 invalidate `["imageCompat"]` query

---

## 5. get_system_info

### 端到端调用链

```
Frontend:
  async function $x():
    const [t,e,o] = await Promise.all([We.getDeviceId(), We.getSystemInfo(), IP()])
    return {deviceId, sysInfo:e, appVersion:o}
  → G("get_system_info")
  → 无参数

  UP(enabled) → useEffect 轮询 py() 每 5 分钟 (FP=300*1000 ms)
    → py() → try{await LP()} catch{}
      → LP() → ir.heartbeat(Bx(deviceId,sysInfo,appVersion))
        Bx = (deviceId,sysInfo,appVersion) => {
          deviceId, os:sysInfo.os, osVersion:sysInfo.osVersion,
          arch:sysInfo.arch, appVersion, hostname:sysInfo.hostname
        }

Backend:
  sub_1402663E0 → get_system_info
    → codexmate_lib::commands::system::get_system_info (0x140070050)
          [ICF folding: dispatch table refs 0x141521ac0, 0x141891938]
          → field_builder sub_1400BF440  (inlined / co-located)
                → JSON field write with keys:
                    "os"        (string ref 0x1412584e4)
                    "osVersion" (string ref 0x1412584e6)
                    "arch"      (string ref 0x1412584ef)
                    "hostname"  (string ref 0x1412584f3)
                → json_field_key_value_serializer sub_14041D2C0 (called 4x)
          → tauri::ipc::InvokeResolver::resolve (0x140062230)  [LEAF]
                → WakeByAddressSingle @0x141206b20  [LEAF]
                → _InterlockedDecrement64  [LEAF]
                → Arc::drop_slow @0x140DDB070  [LEAF]

Unresolved: upstream populator of {os,osVersion,arch,hostname} fields (a2 param at entry)
```

### source archive 实现指引
- 响应结构: `{os: string, osVersion: string, arch: string, hostname: string}`（4 字段 JSON）
- 无副作用（纯读取系统信息）
- Windows 实现: 读系统信息（arch/hostname/osVersion 需平台 API）填充 JSON
- 前端消费: heartbeat payload 组装，每 5 分钟轮询，错误静默吞噬（catch{}）

---

## 6. check_update_installability（→ restart_codex in 1.0.9 Windows）

### 关键变更: 命令改名

1.0.8: Tauri 命令字符串 = `check_update_installability`
1.0.9 Windows: Tauri 命令字符串 = `restart_codex`（13 chars，dispatch case 13）

**source archive 前端必须更新调用命令名为 `restart_codex`**

### 端到端调用链

```
Frontend (macOS hD() hook — 注意命令名变更):
  function hD():
    v.useEffect(()=>{
      let a=false
      We.checkUpdateInstallability()
        .then(l => {
          a || (l.code==="app_translocation"||l.code==="read_only_location") && e(true)
        })
        .catch(()=>{})
      return ()=>{a=true}
    },[])  // mount 时执行一次

[Windows 1.0.9 实现: 前端应调用 G("restart_codex") 而非 G("check_update_installability")]

Backend (Windows):
  sub_1402663E0 → case 13 (len=13) XOR-matches "restart_codex" @0x140267513
    → sub_14026F140 (Tauri wrapper)
          → sub_1400A2DE0 (async wrapper):
                → signal_codex_quit_wake (0x140254510)  // WakeByAddressSingle 退出通知
                → quit_codex_wait_fallback_kill (0x140254140)  // 等待 + force_kill 升级
                      → sub_1403FC1C0: process wait monitor (WaitForSingleObject pattern)
                      → force_kill_codex_by_imagename (0x1402507B0)  // taskkill
                      → kill_process_by_name_taskkill (0x1402502E0)  // 最终兜底
                → sub_140250B80 (installability_checker_core, 0x1edd bytes):
                      → sub_14025B720: registry query helper  [LEAF]
                            reads: HKCU\Software\Microsoft\Windows\CurrentVersion\App Paths\Codex.exe
                            reads: HKLM\Software\Microsoft\Windows\CurrentVersion\App Paths\Codex.exe
                            reads: HKCU\Software\Microsoft\Windows\CurrentVersion\Uninstall\Codex
                            reads: HKLM\Software\Microsoft\Windows\CurrentVersion\Uninstall\Codex
                      → CloseHandle @0x14120a760  [LEAF]
                      → WakeByAddressSingle @0x141206b20  [LEAF]
                      → returns installability struct
                → Err sentinel: 0x8000000000000000 on failure

Frontend consumption:
  l.code: string
    "app_translocation" → open Dialog
    "read_only_location" → open Dialog
    其他 → 不打开 Dialog
  Dialog action: openApplications() → We.openPath("/Applications"); e(false)
```

### source archive 实现指引
- Windows: 命令名必须为 `restart_codex`（不是 `check_update_installability`）
- 行为: 先 quit Codex → 再检查安装性
- Windows 注册表: App Paths + Uninstall keys（HKCU 和 HKLM 各两个）
- 错误 sentinel: 0x8000000000000000（Rust Err discriminant）
- sub_140250B80 内部完整逻辑截断（45761 chars），但注册表读取模式已确认
- 响应 `l.code` 字段: macOS 值为 "app_translocation"/"read_only_location"；Windows 等价值待定（platform_decision）

---

## 5 Helper/Watcher/Scheduler 命令边界声明

以下 5 个函数识别为 **product_decision / consumerStartReady（非 decompile 目标）**：

| 函数名 | 性质 | source archive 边界 |
|---|---|---|
| note_usage_refresh_activity | 内部 activity 更新（无 Tauri 命令字符串） | source archive-local 边界；不 decompile；行为由产品决策定义 |
| schedule_full_runtime_refresh | 内部调度（无 Tauri 命令字符串） | 同上 |
| start_auto_switch_pending_watcher | 内部 watcher（无 Tauri 命令字符串） | 同上 |
| start_usage_refresh_watcher | 内部 watcher（无 Tauri 命令字符串） | 同上 |
| update_usage_refresh_schedule | 内部调度更新（无 Tauri 命令字符串） | 同上 |

这 5 个函数在 1.0.9 Windows binary 中作为内部 Rust helper 存在，无 Tauri IPC 命令注册。source archive 实现时可自定义其行为边界，不受 upstream 严格约束（product_decision startMode）。
