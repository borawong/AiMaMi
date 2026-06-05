# Windows relay-core Internal Cluster Logic — AiMaMi 1.0.9

This document captures the implementation-relevant logic for relay-core internal sub-functions
on Windows x64. It is the implementation/replication basis for source archive code that must call into or
replicate these behaviors. Binary SHA: a5822387fa3f56dc03893111f4ffdd074daa882e8887ec4e7c394879c0e9fe0b.

---

## 1. Keychain (relay_manager cluster)

### relay_keychain_get_api_key (0x140571180, A-level)

Algorithm (Windows-specific):
1. Build keys directory path via codex_paths (+776/+784)
2. Derive file path: keys/<provider_id>
3. Read cached field file if exists
4. If file found: compute SHA256(USER env + USERNAME env + provider_id) using SSE2 Merkle-Damgard
   Hash stored as 32-byte big-endian in 64B struct
5. Lookup SHA256 hash in in-memory SIMD-accelerated hashmap (sub_140263A20)
6. Cache hit: extract OsString → String value
7. Cache miss: Windows CredentialManager read (CredRead) via sub_1405736B0
   Target name derived from provider_id
8. CredMan error 0x8000000000000007: return None (field not found)
9. Return Ok(Some(field)) | Ok(None)

Windows specifics vs macOS:
- CredentialManager (CredRead) instead of macOS Keychain Services
- USER/USERNAME env vars (Windows convention) for field derivation
- In-memory SIMD hashmap cache layer present in Windows binary

### relay_keychain_set_api_key (A-level, paired with get)

Paired with get. CredWrite path. Same field derivation.
Target name: derived from provider_id (same formula as get).

---

## 2. Relay Proxy Server (relay_proxy_server cluster)

### HTTP routing (handle_codex_router_ws_core_sys, 0x140829EC0)

State struct layout (field offsets):
  +676: relay_enabled (byte) — checked before routing
  +677: compact_allowed (byte)
  +832: tag_ptr (str ptr)
  +840: tag_len (usize)
  +849: state_machine_case (u8, cases 0-7)
  +1552: compact_flag (0=normal, 1=compact)

HTTP endpoints registered:
  /codex/router/v1/responses       — normal router WS
  /codex/router/v1/responses/compact — compact router WS
  /codex/router/v1/health          — health probe

Error responses:
  400: router.missing_model
  403: router.relay_provider_removed
  404: router.passthrough_blocked_no_relay
  500: router.state_poisoned
  503: router.disabled

### build_upstream_url_and_headers_sys (0x14013C9F0)

Upstream URLs:
  normal:  https://chatgpt.com/backend-api/codex/responses
  compact: https://chatgpt.com/backend-api/codex/responses (compact variant)

Provider struct output at base+v7:
  +248..+255: url_len (69/70 bytes, compact vs normal)
  +256..+263: url_ptr
  +296..+303: timestamp_ms (i64, ISO datetime → ms via sub_140BF36A0)

### try_pass_through_sys (0x140145610)

Headers added to response:
  "x-aimami-route" (14 bytes)
  "openai-passthrough" (18 bytes)

Passthrough error codes:
  401: passthrough.no_chatgpt_auth
  502: passthrough.network
  500: passthrough.build_body

### record_codex_route_sys (0x140153B50)

Route field format: "aimami_relay_<suffix>"
Strips 13-byte prefix "aimami_relay_", returns suffix as route field.
UTF-8 codepoint validation with bounds check; panic via sub_1412084B0 on invalid boundary.

---

## 3. TOML Block Management (relay_codex_writer cluster)

### Block marker strings (exact literals confirmed in Windows binary)

6 block markers used by managed_block_migration_core_sys and toml_section_writer_atomic_sys:

End markers:
  "# <<< aimami-relay managed end" (30 bytes) → clears in-block flag
  "# <<< aimami-relay managed end (top)" (36 bytes) → clears in-block flag
  "# <<< aimami-relay codex-router top end" (39 bytes) → clears in-block flag

Start markers:
  "# >>> aimami-relay managed start (DO NOT EDIT MANUALLY)" (55 bytes) → sets in-block flag
  "# >>> aimami-relay managed start (top, DO NOT EDIT MANUALLY)" (60 bytes) → sets in-block flag
  "# >>> aimami-relay codex-router top start (DO NOT EDIT MANUALLY)" (64 bytes) → sets in-block flag

### Provider kind byte encoding

Provider kind byte at struct+217:
  0 = stdio
  1 = http
  2 = sse
  3 = unknown/error

Compact flag at struct+216:
  selects "standard" vs "compact" TOML rendering path

### TOML field dispatch in toml_block_renderer_core_sys (case dispatch by field length)

  case 3 (len=3): "env" field
  case 4 (len=4): "type" (0x65707974) | "port" (0x74726F70) | "purl" (0x6C727570, array)
  case 7 (len=7): "command" (0x646E616D6D6F63) | "enabled" (bool: "true" match)
  case 9 (len=9): "transport" field

### Atomic write helper

relay_atomic_write_file_sys @ 0x140332540 — shared atomic write for all relay file writes.
Used by: managed_block_helper_split_sys, relay_preflight_strip_provider_profile,
  relay_startup_cleanup_orphan_provider, relay_toml_section_writer_atomic_sys.

Idempotency (relay_toml_section_writer_atomic_sys): compares content before write;
skips write if content unchanged, returns 35-byte success sensitive-field.

### managed_block_migration SIMD hashmap

Provider hashmap: SIMD scan using _mm_cmpeq_epi8 / _mm_movemask_epi8 / tzcnt
40-byte struct entries, capacity 176-bit slots.
File-not-found (error code 2): treated as "no existing block" (continues to insert new block).

---

## 4. Diagnostic Logic (relay_diagnostic cluster)

### fix_codex_router_issue itemId dispatch table (fully recovered)

All itemId values handled:
  "all" (3)                     → relay_fix_all_repair_core_sys (full repair sequence)
  "config_stale" (12)           → relay_toml_section_writer_atomic_sys (write stale section)
  "auth_integrity" (14)         → logged; NOT auto-fixed (user action required: re-enable provider)
  "config_toml_syntax" (18)     → sub_1403C7AA0 (syntax repair)
  "config_third_party" (18)     → sub_1403source archiveB30 (third-party text strip)
  "db_orphan_providers" (19)    → SQLite-based orphan thread cleanup
  "catalog_path_validity" (21)  → catalog path check (sub_1403FF800 chain)
  "config_profile_conflict" (23) → sub_1403C9600 (profile conflict resolution)

SIMD length-bucketed dispatch: same-length itemIds (config_toml_syntax/config_third_party at len=18)
disambiguated by SIMD content comparison (xmmword comparisons).

### Codex process kill chain

Pattern in relay_fix_all_repair_core_sys and relay_preflight_strip_provider_profile:
1. Check if Codex running: sub_1403FC1C0("Codex", 5) — process name scan
2. If running: quit_codex_wait_fallback_kill_sys(8s timeout)
3. If quit fails: build error entry for that issue, continue to next

### relay_startup_cleanup_orphan_provider algorithm

1. Parse [profiles."<id>"] section headers from config.toml → build HashSet of known provider IDs
2. Scan model_provider_router keys in config.toml
3. For each router value: if NOT in HashSet AND NOT "openai" (explicit exclusion) → orphan
4. Rebuild config without orphan model_provider_router lines
5. Atomic write if content changed

field: "openai" is hard-excluded from orphan detection (always valid fallback provider).

### relay_health_check_core_sys status messages (Chinese UI strings confirmed)

len=101: "已启用但当前没有任何已启用的中转 Provider：Codex 菜单只会看到官方模型，请在 AiMaMi 中启用至少一个中转。"
len=143: "已启用但 provider Codex Auto 未正确配置：..."
len=148: "已启用但 ~/.codex/config.toml 未写入 model_provider router：..."
len=153: "已启用但 ~/.codex/config.toml 未写入 model_catalog_json：..."
len=71:  "智能路由已启用：..." (success)

---

## 5. Thread Migration (relay_thread_migration cluster)

### replace_first_session_meta_line algorithm (0x1403E5B10)

Critical: called 14× across migration/rollback chain. Atomic temp-rename pattern.

1. Read rollout file first line (sub_1403E2EE0 = read_rollout_first_line_sys)
2. If expected_old_line provided AND current != expected: return error 9 (57 bytes:
   "session_meta changed since migration manifest was created")
3. Build temp filename: <parent>/<stem>-<PID>-<random>.<ext>
   Uses GetCurrentProcessId + sub_140F164B0 (random sensitive-field generator)
4. Create temp file (CreateFile equivalent via sub_141042CD0)
5. Write new_line to temp file
6. Seek to after first line in original (sub_141052A90 = SetFilePointer equivalent)
7. Copy rest of original to temp
8. Restore original mtime on temp (sub_141035C20 = set_file_mtime_sys)
9. Atomic rename: temp → rollout path (sub_140332CF0 = MoveFileExW or equivalent)
10. CloseHandle on temp
Return 10 on success.

Error codes:
  8: "rollout path has no parent" | "session_meta line not found"
  9: "session_meta changed since migration manifest was created"

### migrate_threads_for_router_with_scope scope selection

scope at offset v173:
  v173 == 1: incremental (date arithmetic via sub_1410365E0; days×86400 conversion)
  v173 == 0: full range

Scope strings: "full" (4 bytes) | "incremental" (11 bytes) at 0x14127750F

Provider "subagent" model_provider entries: explicitly skipped in migration loop.

### rollback_rollouts_in_parallel parallelism

Thread pool: rayon (fallback to serial on "rollback thread pool init failed")
Async wrappers: sub_1401AE7B0 / sub_1401CE910 / sub_14025BA20 (rayon dispatch)
Shared state: _InterlockedExchangeAdd64 for success counter; _InterlockedCompareExchange8 spinlock
SQLite TX: BEGIN "sqlite begin router-created rollback" → COMMIT/ROLLBACK
DB error string: "DB_ROUTER_CREATED_ROLLBACK_FAILED"

Orphan detection in rollback body:
  "[rollback] orphan thread" → orphan router threads rolled back to openai (hard-coded fallback)

---

## 6. Bootstrap (structural, consumerStartReady_candidate)

### Entry and bootstrap sequence (VAs confirmed from THREAD-MODEL)

CLI dispatcher: sub_1400010D0 (0x1400010D0)
Main bootstrap: sub_140004B30 (0x140004B30) — size 0xD67

field callchain (confirmed edges, no pseudocode):
  sub_1400010D0 → sub_140004B30
  sub_140004B30 → codex_paths_build_from_env_sys (0x140476200)
  sub_140004B30 → sub_1403FB290 (single-instance CreateMutexW)
  sub_140004B30 → Repository.manage (sub_1400D93D0 → 0x141208810)
  sub_140004B30 → RelayManager.manage (sub_1400D8020 → 0x141208810)
  sub_140004B30 → PluginRegistry.manage (sub_1400D9820 → 0x141208810)
  sub_140004B30 → sub_14002DC40 (tokio runtime, multi_thread, 2MiB stack)
  sub_140004B30 → sub_141033130 (Tauri Context)
  sub_140004B30 → sub_14029DB30 (Tauri Builder.build)
  sub_140004B30 → sub_1402D3C90 (App.run)

### Single-instance check (0x1403FB290)

Mechanism: CreateMutexW; if ERROR_ALREADY_EXISTS (183) → exit
Message: "AiMaMi is already running" (25 bytes)
Mutex name: derived from dword_141279047 / byte_141279070 (UTF-16)

### Tokio runtime (sub_14002DC40)

Scheduler: multi_thread (tokio 1.50.0)
Stack size: 0x200000 (2 MiB), env var: RUST_MIN_STACK
Thread count: OnceLock off_141882E28

### Managed state registration order

1. Repository (Mutex<Repository>, 976 bytes, align 8)
2. RelayManager (codexmate_lib::core::relay::manager::RelayManager)
3. PluginRegistry (codexmate_lib::core::plugins::registry::PluginRegistry)
All via sub_141208810 (Tauri .manage() helper)
Guard functions prevent double-registration (sub_1400D93D0/D8020/D9820)

### Daemon registration (boot_spawn_threads)

schtasks command: "schtasks /Create /SC MINUTE /MO 5 /TN CodexMateAutoSwitch /TR <exe_path> /F"
Task name: "CodexMateAutoSwitch"
Interval: every 5 minutes
Register VA: 0x1403FB450; Delete VA: 0x1403FBA00; Query VA: 0x1403FBB40
Orchestrator: 0x1403FC030 (called from auto_switch_watcher_bootstrap_sys)
Process spawn: sub_140256170 (CreateProcessW/ShellExecuteW wrapper)

### Watcher thread spawn

Mechanism: std_thread_spawn_wrapper_sys @ 0x140004980
  → CreateThread + CloseHandle (detached)
  → WakeByAddressSingle on boot completion signal
OnceLock guard: off_141882E30 (once-only init)

---

## do_not_infer

- Windows CredentialManager ≠ macOS Keychain Services; do not share field storage logic
- Windows schtasks ≠ macOS LaunchAgent; daemon registration code is platform-divergent
- WakeByAddressSingle ≠ POSIX Condvar; thread synchronization primitives are different
- UTF-16 file paths in replace_first_session_meta_line: Windows WCHAR paths confirmed
- Do not use macOS relay_proxy_server struct offsets for Windows (independently verified above)
