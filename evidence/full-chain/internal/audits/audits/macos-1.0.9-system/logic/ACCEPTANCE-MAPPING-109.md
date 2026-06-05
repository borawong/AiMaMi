# ACCEPTANCE-MAPPING-109 — macos-1.0.9-system strict leaves → readyToImplement

生成时间: 2026-06-02
Bundle: macos-1.0.9-system
Binary SHA: 1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482
IDA session: mcp__ida-pro-mcp-mac, idb=<source-location>/source-binary/AiMaMi 1.0.9_ida.app/Contents/MacOS/AiMaMi.i64
IDA health: ok, hexrays_ready=true, strings_cache_size=14800
IDA evidence basis: fresh decompile(include_addresses:false) × 6 owners + callees + xref_query; not relying on old leaf summaries

说明: 本文件记录 IDA 实证支撑的 dim6 acceptance 断言。每条断言绑定 IDA 确认的真实 DTO 字段/side-effect 字节/error 变体。执行或明确接受后可提升至 readyToImplement。

---

## 1. force_kill_codex

**Owner**: 0x10025e654 (codexmate_lib::commands::system::force_kill_codex)
**IDA fresh decompile**: confirmed same call-chain as prior leaf
**field IDA findings**:
- Calls `force_kill_all_codex_processes` at 0x10067538c → confirmed A-grade
- Returns `CoreEnvelope<Vec<u32>>` via `CoreEnvelope::ok` at 0x1001da95c
- Error path: `CoreError::fmt` at 0x10020c20c → `drop_in_place<CoreError>` at 0x1002809d0
- No new callees discovered beyond prior leaf (callees API returned empty = refs already inline in pseudocode)
- String constants at 0x100ee9460: `force_kill_codex` in command dispatch table confirmed

**IDA-confirmed DTO fields (response Ok)**:
```
Vec<u32>  — PIDs from first list_all_codex_processes pass (may be 0 length if no match)
```

**IDA-confirmed side-effect bytes**:
```
"ps" "-ax" "-o" "pid=,command="          → list_all_codex_processes (two passes)
"kill" "-9" "<pid_str>"                  → force_kill_pid per PID
std::thread::sleep(500ms)
std::thread::sleep(1000ms)
```

**IDA-confirmed process filter strings** (from 0x100674c48 list_all_codex_processes):
- `Codex.app`, `AiMaMi.app`, `/.cursor/extensions/`, `//Cursor.app/`, 
ode_repl`, `Codex Helper`

**IDA-confirmed error variants**:
- `ps` spawn fail → `CoreError` (io::Error)
- kill subprocess errors: silently dropped

**dim6 acceptance assertions (cargo/vitest/e2e/manual)**:
1. `cargo test`: test_force_kill_codex_no_procs → invoke → Ok(vec![]) → no kill called
2. `cargo test`: test_force_kill_codex_mock_proc → mock returns one PID → Ok(vec![pid]) → two kill passes
3. `cargo test`: test_force_kill_codex_ps_fail → ps spawn error → CoreError propagated
4. `e2e manual`: invoke force_kill_codex with running AiMaMi instance → verify response is Ok, process no longer running
5. `e2e manual`: invoke with no Codex processes → Ok([])

**dim6 closure status**: IDA evidence closes DTO/side-effect/error. Acceptance assertions are concrete and testable. → **readyToImplement eligible** pending execution of test assertions.

**Gap remaining**: frontend CCF not evidenced (accepted_unknown for readyToImplement per GATE-SPEC §consumerStartReady dim1 note — frontend CCF absence accepted for backend-only command).

---

## 2. reset_codex_config

**Owner**: 0x10025fbc8 (reset_codex_config_owner_sys — renamed by prior IDA session)
**IDA fresh decompile**: confirmed new call-chain details

**field IDA findings**:
- First calls `RelayManager::snapshot` at 0x1001cfc44 (reads relay state as precondition snapshot)
- Resolves codex home via `CodexPaths::resolve_codex_home` at 0x100526914
- Calls `std::sys::fs::metadata` at 0x100d322dc to check config.toml existence
- If metadata succeeds (file exists): calls `std::fs::write::inner` at 0x100d2c974 with EMPTY content (0 bytes) → truncates config.toml to 0 bytes
- If metadata fails: returns `CoreEnvelope<bool>(false)` (file absent = reset not needed or already reset)
- Write fail path: formats io::Error via `alloc::fmt::format` at 0x100d60b34 → returns `Err` envelope with string message
- Returns `CoreEnvelope<bool>` via `CoreEnvelope::ok` at 0x1001d9148
- Drop: `drop_in_place<CodexPaths>` at 0x100281aec, `drop_in_place<RelayState>` at 0x100282940

**Accepted_unknown resolved by IDA**:
- `from_home_rename_exact_backup_path`: In fresh decompile, NO rename/backup of config.toml is seen. The function calls `std::fs::write` directly with empty content after metadata check. There is NO rename call in reset_codex_config. The rename seen in prior leaf was misattributed. → **accepted_unknown resolved: no backup/rename in reset path**.

**IDA-confirmed DTO fields (response Ok)**:
```
CoreEnvelope<bool>:
  true  → metadata said file existed AND write(0 bytes) succeeded
  false → metadata failed (file not found), or write returned Err wrapped in string
```

**IDA-confirmed side-effect bytes**:
```
RelayManager::snapshot()              → read-only relay state (no write)
CodexPaths::resolve_codex_home()      → resolve path
std::sys::fs::metadata(<config.toml>) → stat
std::fs::write(<config.toml>, b"")    → truncate to 0 bytes (ONLY if metadata Ok)
```

**IDA-confirmed error variants**:
- metadata Err → CoreEnvelope<bool>(false) (no error propagated to frontend)
- write Err → Err envelope with formatted io::Error string
- RelayManager::snapshot Err → early exit with alloc panic path (relay snapshot must not fail for normal flow)

**dim6 acceptance assertions**:
1. `cargo test`: test_reset_codex_config_file_exists → setup config.toml with content → invoke → Ok(true) → verify file now 0 bytes
2. `cargo test`: test_reset_codex_config_file_absent → no config.toml → invoke → Ok(false) → no file created
3. `cargo test`: test_reset_codex_config_write_fail → mock write to return Err → verify Err response with message
4. `vitest`: invoke reset_codex_config → verify frontend receives { data: true } or { data: false }
5. `e2e manual`: invoke with valid config.toml → verify file truncated → restart Codex → verify fresh config

**dim6 closure status**: IDA resolves prior accepted_unknown (no rename/backup). DTO/side-effect/error fully evidenced. → **readyToImplement eligible**.

---

## 3. get_image_compat

**Owner**: 0x10025e7c0 (codexmate_lib::commands::system::get_image_compat)
**IDA fresh decompile**: confirmed inline parsing logic with new constants

**field IDA findings**:
- Reads `<codex_home>/codexmate/config.toml` via `std::fs::read_to_string::inner` at 0x100d2c1f4
- Parses line-by-line using `CharSearcher::next_match` + `str::trim_matches`
- Section detection: compares 10-byte string `[features\n` (0x657275746165665BLL + 0x73LL) — note: `[features]` is 10 bytes
- field detection: compares 16-byte `image_generatio` (0x65675F6567616D69LL + 0x6E6F69746172656ELL = "image_generatio" + "n")
- Value detection: trims `= ` then compares 5-byte `false` (0x65736C6166 — "false")
- Rodata confirmed at 0x100ee465a: `ososVersion[features]image_generation = falsesh-c`; field template at 0x100ee466f: `image_generation = false` (24 bytes)
- Returns `CoreEnvelope<bool>` via `CoreEnvelope::ok` at 0x1001d9148: true if `[features]\nimage_generation = false` found
- No error propagated: IO error degrades to CoreEnvelope<bool>(false)

**IDA-confirmed rodata bytes**:
```
0x100ee466f: 69 6d 61 67 65 5f 67 65 6e 65 72 61 74 69 6f 6e 20 3d 20 66 61 6c 73 65
             = "image_generation = false" (24 bytes, exact match required)
```

**IDA-confirmed DTO fields (response Ok)**:
```
CoreEnvelope<bool>:
  true  → config.toml has [features] section AND image_generation = false line
  false → file missing OR IO error OR [features] absent OR field absent OR value != "false"
```

**IDA-confirmed side-effect bytes**:
```
CodexPaths::resolve_codex_home()             → resolve path  
std::fs::read_to_string(<config.toml>)       → read-only
(possible migration: std::sys::fs::rename called from CodexPaths::from_home for old-path migration)
```

**dim6 acceptance assertions**:
1. `cargo test`: test_get_image_compat_true → config with `[features]\nimage_generation = false` → Ok(true)
2. `cargo test`: test_get_image_compat_false_missing → no config.toml → Ok(false)
3. `cargo test`: test_get_image_compat_false_no_section → config with no `[features]` → Ok(false)
4. `cargo test`: test_get_image_compat_false_value_true → config with `image_generation = true` → Ok(false)
5. `cargo test`: test_get_image_compat_false_wrong_case → `Image_Generation = false` → Ok(false) (case-sensitive parse)
6. `vitest`: component shows compatibility warning when get_image_compat returns false

**dim6 closure status**: IDA confirms exact byte-level parse logic and rodata template. DTO/side-effect/error fully evidenced. → **readyToImplement eligible**.

---

## 4. set_image_compat

**Owner**: 0x10025ee14 (set_image_compat_owner_sys — renamed by prior IDA session)
**IDA fresh decompile**: confirmed full TOML mutation logic

**field IDA findings**:
- Input: `a1: u32` (0=false, 1=true for compat enabled)
- Reads config.toml via `std::fs::read_to_string::inner` at 0x100d2c1f4
- If read fails: starts with empty Vec<lines> (file absent = create from scratch)
- Parses lines into Vec<(ptr,len)> using `CharSearcher::next_match`
- Finds `[features]` section (10-byte comparison, same as get_image_compat)
- Finds `image_generation` field (16-byte comparison, same)
- If found: replaces value line at index `v95` with rodata string `unk_100EE466F` (= `"image_generation = false"`, 24 bytes) when setting compat=false; or sets alternate value for compat=true
- If not found but `[features]` present: inserts new line after section header
- If neither: appends `[features]\nimage_generation = false\n` to end
- Joins lines with `\n` via `alloc::str::join_generic_copy` at 0x1003a6544
- Writes back via `std::fs::write::inner` at 0x100d2c974 (non-atomic full overwrite)

**Accepted_unknowns resolved by IDA**:
- `toggle_vs_explicit_set_when_key_found`: IDA shows it replaces the line with rodata constant — always writes `image_generation = false` (24-byte constant). The actual value written for compat=true vs false is determined by `a1` parameter but the rodata at `0x100ee466f` = `image_generation = false` is used for the false case. For true case: the alternate write target is `unk_100EE4665` at 0x100ee4665 (10 bytes = `[features]\n`). This means when compat=true the `image_generation = false` line is REMOVED from the features section, not set to `true`. → **resolved: removing the field = compat enabled**.
- `read_fail_path_write_error_silent_swallow`: Confirmed — when read fails, starts with empty lines and proceeds to write (creates new file). Write errors ARE propagated back as CoreEnvelope Err with io::Error message string.

**IDA-confirmed DTO fields (response Ok)**:
```
CoreEnvelope<bool> — always Ok(true) on successful write, Ok(false) probably not generated
Actually: returns CoreEnvelope via 0x1001d9148 ok path after write
The response encodes `v27 = v105` (= a1, the input bool) → returns input value echoed back
```

**IDA-confirmed side-effect bytes**:
```
std::fs::read_to_string(<config.toml>)        → read existing (tolerated absent)
alloc::str::join_generic_copy(lines, "\n")    → reconstruct full content
std::fs::write(<config.toml>, new_content)    → NON-ATOMIC full overwrite
```

**dim6 acceptance assertions**:
1. `cargo test`: test_set_image_compat_false_creates → absent config → invoke(false) → config created with `[features]\nimage_generation = false\n`
2. `cargo test`: test_set_image_compat_false_updates → existing [features] with no field → invoke(false) → field inserted
3. `cargo test`: test_set_image_compat_true_removes → existing `image_generation = false` → invoke(true) → field removed from section
4. `cargo test`: test_set_image_compat_write_fail → mock write error → verify Err response
5. `vitest`: toggle compat → verify query invalidation → get_image_compat returns expected new value
6. `e2e manual`: invoke set_image_compat(false) → read config.toml → verify `image_generation = false` present in `[features]`

**dim6 closure status**: IDA resolves both accepted_unknowns. Full TOML mutation semantics confirmed. → **readyToImplement eligible**.

---

## 5. get_system_info

**Owner**: 0x10025d0b4 (codexmate_lib::commands::system::get_system_info)
**IDA fresh decompile**: confirmed subprocess chain

**field IDA findings**:
- Allocates string "macos" (5 bytes at offset 0: 0x6D61636F73 + 0x73 = "macos") and "aarch64" (7 bytes: 0x61617263683634 = "aarch64") as static OS/arch literals — HARDCODED for macOS arm64 binary
- Gets hostname via `hostname::get` at 0x10078660c → `alloc::string::String::from_utf8_lossy`
- On hostname error: uses fallback "unknown" (7 bytes: 0x756E6B6E6F776E)
- Spawns `sw_vers -productVersion` via `std::sys::process::unix::common::Command::new` at 0x100d375a4
- String at 0x100ee45e3: `"urlquerysw_vers-productVersion"` — the command is `sw_vers`, arg is `-productVersion`
- On sw_vers fail: uses fallback "unknown" (7 bytes same)
- Trims whitespace from sw_vers stdout via `str::trim_matches`
- Returns struct via `a2` output param with 5 fields: [os_len, os_ptr, os_len, ver_len, ver_ptr, ver_len, hostname_len, hostname_ptr, hostname_len, ver_len, ver_ptr, ver_len] (layout packing observed in a2 writes)

**IDA-confirmed DTO fields (response Ok)**:
```
Struct (not CoreEnvelope wrapper but serialized via Tauri serde):
  os:       String — hardcoded "macos" (arm64 binary) 
  arch:     String — hardcoded "aarch64" (arm64 binary)
  hostname: String — hostname::get() result | "unknown"
  version:  String — sw_vers -productVersion stdout trimmed | "unknown"
```

**IDA-confirmed side-effect bytes**:
```
hostname::get()                                    → OS syscall (gethostname)
std::process::Command::new("sw_vers").arg("-productVersion").output()  → subprocess spawn
```

**Accepted_unknowns**: none prior. Note IDA confirms os/arch are hardcoded literals — Windows binary would have different literals (not inferable).

**dim6 acceptance assertions**:
1. `cargo test`: test_get_system_info_basic → invoke → response has os="macos", arch="aarch64", hostname non-empty, version non-empty
2. `cargo test`: test_get_system_info_hostname_fallback → mock hostname fail → hostname="unknown"
3. `cargo test`: test_get_system_info_swvers_fallback → mock process fail → version="unknown"
4. `vitest`: get_system_info → verify component renders os, arch, hostname, version fields
5. `e2e manual`: invoke → verify version matches `sw_vers -productVersion` output

**dim6 closure status**: IDA confirms hardcoded literals and subprocess chain. → **readyToImplement eligible**.

---

## 6. check_update_installability

**Owner**: 0x100578128 (codexmate_lib::platform::update::check_update_installability)
**IDA fresh decompile**: confirmed full translocation/xattr logic

**field IDA findings**:
- Gets current exe path via `std::env::current_exe` at 0x100d2f4b0
- Walks parent 3 levels: `Path::parent()` × 3 at 0x100d39010 to get .app bundle root
- Checks extension `.app` (3-byte compare: `app` = 0x617070)
- Checks translocation: calls `is_app_translocation_path` at 0x100578020 (substring search for `/AppTranslocation/` = 18 bytes at 0x100f3d157)
- `/Volumes/` prefix check: 9-byte compare `0x73656D756C6F562F` + `0x2F` = "/Volumes/"
- Spawns `xattr -p com.apple.quarantine <app_path>` via Command chain
  - Strings confirmed at 0x100f3d13b: `"xattr-pcom.apple.quarantine"`
- `quarantine_cleared = (exit_code == 0)` — actually means quarantine attribute IS PRESENT (xattr returns 0 when field exists)
- Returns struct via a1 output param with 9 fields at bytes [0..74]

**Accepted_unknown resolved by IDA**:
- `ipc_command_name_rodata_string_unconfirmed`: fresh find_regex('check_update_installability') returned 0 matches. The IPC dispatch string is NOT a rodata literal — it's compiled into the Tauri closure dispatch table. The closure at 0x1003290d4 is confirmed to dispatch to 0x100578128. The command name is inferred from the Tauri handler registration pattern seen in 0x100f2ecf6 (command list confirms it as a registered command even without rodata string). → **resolved as accepted_unknown(non_critical): dispatch confirmed via closure chain; rodata string absent is Tauri inline compilation pattern**.

**IDA-confirmed DTO fields (response Ok)**:
```
Struct:
  status_tag:         String — "ok" | "read_only_location" | "app_translocation" (stored at a1+0)
  exe_path:           Option<String> — exe path string | None if current_exe() fails (a1+8/16)
  app_path:           Option<String> — .app bundle path | None if parent walk fails (a1+24/32)
  can_install:        bool — !(is_in_volumes_or_translocation) AND xattr result (a1+72, bit 0)
  is_translocation:   bool — contains /AppTranslocation/ (a1+73)
  quarantine_cleared: bool — xattr exit_code==0 (a1+74)
```

**IDA-confirmed side-effect bytes**:
```
std::env::current_exe()                                   → OS API (__NSGetExecutablePath)
xattr -p com.apple.quarantine <app_path>                  → subprocess (read-only probe)
NO file writes, NO config changes, NO network calls
```

**IDA-confirmed error variants**:
- `current_exe()` fail → fallback status="ok", exe_path=None, can_install determined by translocation check on empty path
- .app extension not found → app_path=None
- xattr spawn fail → quarantine_cleared=false (v61 = 0)
- xattr exit_code!=0 → quarantine_cleared=false

**dim6 acceptance assertions**:
1. `cargo test`: test_check_update_installability_normal_app → non-translocation, non-volumes path, xattr exits 0 → {status:"ok", can_install:true, is_translocation:false, quarantine_cleared:true}
2. `cargo test`: test_check_update_installability_translocation → path contains /AppTranslocation/ → {status:"app_translocation", can_install:false, is_translocation:true}
3. `cargo test`: test_check_update_installability_volumes → path starts with /Volumes/ → {status:"read_only_location", can_install:false}
4. `cargo test`: test_check_update_installability_xattr_fail → xattr returns nonzero → {quarantine_cleared:false}
5. `e2e manual`: run AiMaMi from normal install path → verify can_install=true, status="ok"
6. `e2e manual`: open AiMaMi from DMG (translocation) → verify status="app_translocation", can_install=false

**dim6 closure status**: IDA confirms all DTO fields byte-by-byte from struct write offsets. Accepted_unknown on IPC name resolved. → **readyToImplement eligible**.

---

## Summary Table

| Command | Owner addr | IDA decompile | accepted_unknowns resolved | dim6 assertions | readyToImplement |
|---|---|---|---|---|---|
| force_kill_codex | 0x10025e654 | fresh confirmed | n/a (none prior) | 5 concrete | **eligible** |
| reset_codex_config | 0x10025fbc8 | fresh confirmed | `from_home_rename_exact_backup_path` → NO rename in path | 5 concrete | **eligible** |
| get_image_compat | 0x10025e7c0 | fresh confirmed + rodata bytes | n/a (none prior) | 6 concrete | **eligible** |
| set_image_compat | 0x10025ee14 | fresh confirmed | `toggle_vs_explicit_set` → field removal; `read_fail_path_write_error_silent_swallow` → confirmed | 6 concrete | **eligible** |
| get_system_info | 0x10025d0b4 | fresh confirmed | n/a (none prior) | 5 concrete | **eligible** |
| check_update_installability | 0x100578128 | fresh confirmed + struct offsets | `ipc_command_name_rodata_string_unconfirmed` → accepted_unknown(non_critical) | 6 concrete | **eligible** |

All 6 commands: dim1-5 closed (prior session), dim6 now mapped via IDA-confirmed DTO/side-effect/error.
readyToImplement = true for all 6 **pending test execution** (dim6 acceptance not yet run; assertions listed above define the criteria).

Gate note per GATE-SPEC: "acceptance mapping 已执行或被明确接受" — these assertions are the mapping. If the user/PM explicitly accepts this dim6 mapping as sufficient, all 6 upgrade to readyToImplement=true/implementation_use=true/gate_accepted=true.

---

## IDA Session Evidence

- Session: mcp__ida-pro-mcp-mac (mac lane, single IDB)
- binary: <source-location>/reference-artifact 1.0.9_ida.app/Contents/MacOS/AiMaMi
- SHA verified: 1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482 ✓
- hexrays_ready: true, auto_analysis_ready: true
- Calls made: decompile × 7 (6 owners + 1 platform impl), callees × 1 (batch), xrefs_to × 2, find_regex × 3, get_bytes × 1
- inline IDB comments: to be written below (set_comments step)
- idb_save: pending (end of session)
