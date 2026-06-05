# DISTILLED: accounts::resolve_cached_auto_switch_service_state — AiMaMi 1.0.9 macOS arm64

**Owner VA**: `0x1001e8e68` (844B / 0x34C, HexRays-clean)
**Symbol**: `codexmate_lib::commands::accounts::resolve_cached_auto_switch_service_state::hd9cc910dcf5be7b1`
**Session**: <audit-session>
**SHA256 binary**: 1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482

---

## dim1 — IPC / Invocation Context

**NOT a directly-registered Tauri IPC command.** `find_regex("resolve_cached_auto_switch") = EMPTY` — no command string in rodata. No `__cmd__` wrapper, no handler-table data xref.

This function is a **synchronous helper** called from two call sites:

| Caller VA | Symbol | Role |
|---|---|---|
| `0x100126f38` (`@0x1001272d0`) | `tauri::ipc::InvokeResolver<R>::respond_async_serialized_inner::{{closure}}` | IPC async closure handling the `refresh_usage_snapshot` command; calls this helper to obtain the auto-switch service state boolean before calling `load_usage_only_runtime_snapshot` |
| `0x1001e7eec` (`@0x1001e7f44`) | `codexmate_lib::commands::accounts::refresh_usage_snapshot_with_retry` | Direct caller; passes result `v8` (u8/bool) to `load_usage_only_runtime_snapshot` as `a2` |

The IPC closure string pool (embedded at `0x100126fdc`/`0x100126ff4`) confirms the registered command name is `"refresh_usage_snapshot"` — this helper is an internal sub-call within that command's execution.

Return type: `__int64` but narrowed to `u8/bool` (stored as `v26: char`, used as `v8: unsigned __int8` in the caller, and `v4[1248] = v26`). Also returns `4` on the cache-miss/mutex-poison fast path.

---

## dim2 — Owner Body: Full Decompile

```
__int64 codexmate_lib::commands::accounts::resolve_cached_auto_switch_service_state(a1: __int64) -> __int64
```

**Flow** (55 basic blocks, 844B):

### Step 1 — Call `get_cached_display_snapshot` (fast-path cache read)
```c
v28[0] = 0;  // sret init
get_cached_display_snapshot(v28);  // @0x1001e8e94 — reads DISPLAY_SNAPSHOT_CACHE
```
Returns `CoreSnapshotPayload` sret at `v28` (680B / 0x2A8). Discriminant at `v28[0]`:
- `== 3` → cache EMPTY (tag3 sentinel) → go to **miss path**
- `!= 3` → cache HIT → go to **hit path**

### Step 2a — Cache HIT path (`v28[0] != 3`) — `@0x1001e8f04`
```c
v7 = BYTE1(v30[65]);   // extract AutoSwitch service-state byte from CoreSnapshotPayload
// drop AccountSummary[] Vec loop + dealloc
// drop AppStatusPayload
// drop McpServerListPayload (Option)
// drop InstalledSkillSummary[] Vec loop + dealloc
return v7;  // @0x1001e910c
```
Reads `BYTE1` of the qword at `v30[65]` (offset 520 from sret base) — this is the `auto_switch_service_state: bool` field within the cached snapshot. Frees all Vec/String/Option fields in the snapshot before returning.

### Step 2b — Cache MISS path (`v28[0] == 3`) — `@0x1001e8ea0`
Enters the **slow path** via `bootstrap_cache::load`:

```c
// 1. Get Repository from StateManager
v2 = StateManager::try_get(*(*(a1+136)+4872) + 16);
// panic if Repository missing (anon 645 message, 76 chars)

// 2. Acquire DISPLAY_SNAPSHOT_CACHE Mutex (OnceBox lazy init if first call)
v3 = v2;  // atomic_ullong* to mutex
explicit = atomic_load_explicit(v3, memory_order_acquire);
if explicit:
    v5 = Mutex::lock(explicit)
else:
    v27 = OnceBox::initialize(v3)
    v5 = Mutex::lock(v27)

// 3. Check poison flag  (@0x1001e8ee0 / @0x1001e9174)
if v3[8] (byte poison flag set):
    // mutex poisoned — check GLOBAL_PANIC_COUNT
    if not panicking:
        Mutex::unlock(*v3)
        return 4  // @0x1001e8f00  POISON FAST-EXIT, no data
    // else: set poison byte (*v6=1) then unlock+return 4

// 4. bootstrap_cache::load — slow rebuild from Repository
bootstrap_cache::load(v3[60], v3[61], v28)  // @0x1001e8f58
// v3[60]=path ptr (char*), v3[61]=path len; writes CoreSnapshotPayload sret to v28

// 5. Extract result
if v29 == 3:        // load returned tag3 (IO/parse failure)
    v7 = 4          // signal: could not load
else:
    // copy 680B into v43/v42 (local staging)
    memcpy(v43, v30, 672)
    v42 = v29
    v7 = BYTE1(v43[67])  // extract auto_switch_service_state byte from loaded snapshot
    // drop AppStatusPayload, AccountSummary[] Vec, InstalledSkillSummary[] Vec
    // drop McpServerListPayload Option
    // drop InstalledSkillSummary Vec
    // clean up remaining Option<String> / Vec fields

// 6. Unlock
if (v13 & 1) == 0 and panicking:
    *v6 = 1  // set poison
Mutex::unlock(*v3)  // @0x1001e8ff4

// 7. Cleanup cache read side-effect: drop CoreSnapshotPayload fields acquired via mutex clone
// (drop account Vec, option mcp, skill Vec, etc.)

return v7
```

**Return values**:
- `u8/bool` from `BYTE1(payload[67])` / `BYTE1(payload[65])` — the `auto_switch_service_state` boolean field
- `4` — cache empty sentinel (tag3 from either get_cached_display_snapshot or bootstrap_cache::load), or mutex-poisoned

---

## dim3 — Callee Map

| VA | Symbol | Role |
|---|---|---|
| `0x1001e45dc` | `get_cached_display_snapshot` | Fast-path cache read; sret 680B |
| `0x10034b0fc` | `StateManager::try_get` | Gets Repository from AppHandle state |
| `0x100d7fec8` | `OnceBox::initialize` | Lazy mutex init |
| `0x100d3499c` | `Mutex::lock` | Lock DISPLAY_SNAPSHOT_CACHE mutex |
| `0x100db0a84` | `is_zero_slow_path` (panic_count) | Panic-in-progress check |
| `0x100d349b8` | `Mutex::unlock` | Unlock after read |
| `0x1001beef8` | `bootstrap_cache::load` | Slow rebuild — `fs::read_to_string` + `serde_json::de::from_trait` |
| `0x100db5318` | `memcpy` | Copy sret payload |
| `0x1001fd3a0` | `drop_in_place<AppStatusPayload>` | Drop |
| `0x1004c19b4` | `drop_in_place<AccountSummary>` | Drop (Vec elem, stride 336B) |
| `0x1001fe120` | `drop_in_place<McpServerListPayload>` | Drop |
| `0x1004c31f8` | `drop_in_place<InstalledSkillSummary>` | Drop (Vec elem, stride 184B) |
| `0x100db4888` | `panic_fmt` | Panic on missing Repository |
| `0x1000013dc` | `__rust_dealloc` | Vec/String dealloc |

---

## dim4 — DTO / Error / Side-Effect

### Return DTO
- **Type**: `u8` (returned in low byte, stored as `char`/`bool` by caller)
- **Value semantics**:
  - `0x00` / `false` — auto-switch service is **disabled**
  - `0x01` / `true` — auto-switch service is **enabled**
  - `0x04` — **cache-empty** or **mutex-poison** sentinel (caller treats as miss/retry signal)
- **Source field**: `BYTE1(CoreSnapshotPayload[offset 520])` — the `auto_switch_service_state: bool` field within `CoreSnapshotPayload`

### bootstrap_cache::load DTO (slow path)
```
bootstrap_cache::load(path_ptr: *const u8, path_len: usize, out: *mut CoreSnapshotPayload)
```
- Reads file at path (bootstrap JSON, passed via mutex-protected path fields `v3[60..61]`)
- `std::fs::read_to_string` → IO error → returns tag3 sentinel (all niche fields set to `0x8000000000000000`)
- `serde_json::de::from_trait` → parse error → returns tag3 sentinel
- Success → copies 920B (`__dst`) via `memcpy` → then copies `0x390` (912B) to out

### Error taxonomy
| Error | Mechanism | Return |
|---|---|---|
| Repository not in state | `StateManager::try_get` returns null | `panic_fmt` (anon 645, 76 chars) — **unrecoverable** |
| Cache EMPTY (tag3) | `get_cached_display_snapshot` returns tag3 | Enters slow path |
| Bootstrap IO error | `fs::read_to_string` fails | Returns `4` |
| Bootstrap JSON parse error | `serde_json::de::from_trait` returns err | Returns `4` |
| Mutex poisoned | `BYTE v3[8] != 0` | Returns `4`, may set poison byte |

### Side Effects
- **READ-ONLY on success fast path** (cache hit): reads process-global `DISPLAY_SNAPSHOT_CACHE`, acquires/releases mutex
- **File IO on slow path**: `bootstrap_cache::load` → `fs::read_to_string` on bootstrap JSON path
- **Mutex acquire/release** on both paths (OnceBox lazy init on first call)
- **Panic flag propagation**: sets poison byte `v3[8] = 1` if panicking during mutex hold
- **No Tauri event emission, no HTTP, no SQLite, no spawn**

---

## Fake-Wall Taxonomy Exhaustion

| Fake wall | Status | Evidence |
|---|---|---|
| `drop_in_place` / destructor confusion | NOT applicable | Body is straight HexRays-clean at 844B; all `drop_in_place` calls are clearly labeled drop operations on Vec/payload fields during cleanup |
| `async decompile failed` | EXCLUDED | `func_query(resolve_cached_auto_switch.*{poll\|async_fn_env\|closure\|generator}) = EMPTY` — zero async env types. No state machine, no discriminant-based state transitions, no `.await`. Pure synchronous body. |
| async body — wrong VA | EXCLUDED | `func_query` returns exactly one function at `0x1001e8e68`, `xrefs_to` = 2 code xrefs (both confirmed), body demangled correctly |
| `architecture_only` / budget rule | NOT applicable | 844B whole, single-pass decompile succeeded with full pseudocode |
| vtable / dynamic dispatch unknown | NOT applicable | All callees are direct static-bound calls (demangled symbols) |
| `HTTP-terminal` | NOT applicable | No HTTP calls in this body or bootstrap_cache::load |
| Library internal | NOT applicable | No network library internals to elide |
| ICF-folded / genuine_ceiling | NOT applicable | Unique symbol, unique VA, distinct body — not ICF identical to any peer |

**Recovery attempts**: not_needed_no_ceiling — HexRays decompiled the full 844B body in one pass with complete pseudocode. No wall encountered.

---

## Gate Assessment

| Dim | Status | Notes |
|---|---|---|
| dim1 | closed | NOT directly-registered IPC command; internal helper called from `refresh_usage_snapshot` IPC closure @0x1001272d0 and `refresh_usage_snapshot_with_retry` @0x1001e7f44 |
| dim2 | closed | Owner body fully decompiled; fast-path (cache hit) and slow-path (bootstrap load) both reversed; 55 basic blocks, HexRays-clean |
| dim3 | closed | All callees named and classified |
| dim4 | closed | Return DTO: u8/bool + sentinel 4; error taxonomy complete; side-effects: mutex + optional fs IO |
| dim5 | closed | Callers confirmed; role in `refresh_usage_snapshot` execution chain established |
| dim6 | open | source archive-implementation-side acceptance scope — not binary cap |

**real_body_found**: true
**genuine_ceiling**: false
**accepted_unknown**: false
**gate_tier**: `strictImplementationUse`
**readyToImplement**: false (dim6 source archive-side open)
**owner_gate**: ALLOW/first (no prior owner; first-write by <workstation> session <audit-session>)
