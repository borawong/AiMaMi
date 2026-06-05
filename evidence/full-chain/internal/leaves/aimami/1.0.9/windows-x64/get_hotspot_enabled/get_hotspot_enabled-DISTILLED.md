# get_hotspot_enabled — Windows x64 DISTILLED

**product**: aimami  
**version**: 1.0.9  
**platform**: windows-x64  
**scope**: get_hotspot_enabled  
**addr_verified**: 0x140285050 (func_query confirmed `get_hotspot_enabled_owner_sys`, size 0x36F, has_type=true; no collision with run_daemon_once)  
**binary_sha256**: a5822387fa3f56dc03893111f4ffdd074daa882e8887ec4e7c394879c0e9fe0b  
**binary_sha12**: a5822387fa3f  
**session**: <audit-session>
**machine**: <workstation>
**produced_at**: 2026-06-04  
**gate_tier**: strictImplementationUse  
**genuine_ceiling**: false  
**block_decomposed**: false (32 blocks, 879 bytes — fully decompiled in one pass)  

---

## dim1 — Frontend CCF

Frontend wrapper confirmed in prior session (audit windows-1.0.9-system-hotspot):

```js
// index-CL22l5v8.js:86:31411
getHotspotEnabled()  →  invoke("get_hotspot_enabled")
// settings-page-CXcOCj-K.js:12 — queryFn: () => getHotspotEnabled()
```

Command name embedded in binary rodata: `aGetHotspotEnab` @ `0x141268fa7` = `"get_hotspot_enabled"`.  
Param name literal `"repo"` @ `0x141269220` also present (matches IPC param-slot name).  
dim1: **closed**.

---

## dim2 — Owner body (decompiled)

**True owner**: `get_hotspot_enabled_owner_sys` @ `0x140285050`, size 0x36F (879 bytes), 32 basic blocks.  
Verified by `func_query(name_regex="get_hotspot_enabled")` — no name collision.  
Body decompiled cleanly (no HexRays errors, no budget bail).

**Execution flow summary**:

1. `memcpy(Dst, Src, 520)` — copy incoming IPC context into local stack frame.
2. `memcpy(v14, Src+520, 400)` — copy trailing IPC buffer section.
3. Extract `v25` = pointer at `Src+936` (owner pointer into caller vec).
4. Extract `v24` = 128-bit value at `Src+920`.
5. Build dispatch param array `v15[]`:
   - `v15[0]` = `"get_hotspot_enabled"` (rodata)
   - `v15[1]` = 19 (length)
   - `v15[2]` = `"repo"` (rodata)
   - `v15[3]` = 4
   - `v15[4]` = `Dst` (copied IPC state)
   - `v15[5]` = `&v24`
6. **Cache-check path** (`sub_1400DA7C0`): atomic `_InterlockedCompareExchange8` on a lock byte at `Dst[64]+16`. If non-zero (cached/initialized), execute cached dispatch via `sub_1411CE640` (Result-wrapping encoder).
7. **Cache-miss path**: `get_hotspot_config_core_read_sys(0x1401631A0)` → reads `HotspotConfig.enabled` from persisted `UsageRefresh` settings.
8. Result discrimination: if `v22[0] == 6` → error path; else → success, marshal result into IPC response via `tauri_ipc_resolve_sys`.
9. Post-resolve cleanup: iterate `v24` vec (stride 96), call `sub_1400CA020` per element, then free via `sub_140001370`.
10. Return `sub_140298200(Dst)` — IPC frame cleanup/drop.

dim2: **closed** (decompiled A-level, no async state machine, synchronous IPC handler).

---

## dim3 — Call depth / callees

**Direct callees** (12 unique):

| addr | name | role |
|---|---|---|
| 0x1411CCB90 | memcpy | frame init |
| 0x1400DA7C0 | sub_1400DA7C0 | read-side cache/lock check (RwLock-like acquire) |
| 0x1411CE640 | sub_1411CE640 | cached-result encoder / Result-wrapper |
| 0x1401631A0 | get_hotspot_config_core_read_sys | **settings read core** — reads HotspotConfig from UsageRefresh blob |
| 0x140062230 | tauri_ipc_resolve_sys | IPC response serializer |
| 0x140001360 | sub_140001360 | alloc (buf copy branch) |
| 0x140001370 | sub_140001370 | dealloc / drop |
| 0x1400013A0 | nullsub_1 | no-op stub |
| 0x14120829B | sub_14120829B | panic handler (OOM path) |
| 0x14006BAA0 | sub_14006BAA0 | error-path drop/cleanup |
| 0x1400CA020 | sub_1400CA020 | per-element drop in cleanup loop |
| 0x140298200 | sub_140298200 | IPC frame drop/return |

**Core sub-chain** (`get_hotspot_config_core_read_sys` @ 0x1401631A0):
- Atomic `_InterlockedCompareExchange8` → once-cell-style initialization guard.
- If initialized: reads `*(v2+8)` (the `enabled` bool) and `*(v2+[0..16])` fields directly from settings struct.
- If not initialized: calls `settings_deserialize_usage_refresh` @ `0x1405532D0` → deserializes `~/.codex/` UsageRefresh TOML/JSON into struct → then `sub_14005B530` (drop/free of temp).
- Result written to `a1` (out-param): `*a1 = v5 (u64), *(a1+8) = v6 (u64), *(a1+16) = v7 (bool), *(a1+17..20) = v23 bytes`.
- WakeByAddressSingle called after releasing lock byte.
- Terminal: `settings_deserialize_usage_refresh` — disk read from `~/.codex/`.

xrefs_to 0x140285050: called from `auto_switch_multiplex_dispatcher_sys` @ 0x1402663E0 (the main Tauri command router for this module). Also referenced at vtable/data entries 0x14157source archive60, 0x1418A7E98.

dim3: **closed** (depth >= 5 terminal = settings_deserialize_usage_refresh / disk).

---

## dim4 — DTO / error / side-effect

**Request DTO**: `{}` — no parameters. IPC arg buffer contains only standard repo/context slot, no payload fields.

**Response DTO**:
```
boolean  (Rust: Option<bool> or bool)
```
- Success (discriminant != 6): `enabled` bool extracted from `HotspotConfig` within `UsageRefresh` blob.
- None/unset: returns `false` / `None` if `HotspotConfig` field not present in settings file.

**Error enum**:
- `discriminant == 6` → poison error (Mutex/RwLock poisoned). `BYTE1(v22)` carries error payload. Propagated via `sub_14006BAA0` (error-path drop).
- OOM in response copy path → panic via `sub_14120829B`.
- No network errors, no auth errors.

**Side effects**: **none**. Pure read. No writes to disk, no IPC state changes, no daemon signals, no notifications. WakeByAddressSingle is for internal lock synchronization only — not an observable side effect.

dim4: **closed** (req:{}, resp:bool, err:poison, side:none).

---

## dim5 — Same-platform gate

Windows x64 binary confirmed as target platform for this evidence.  
Owner verified in Windows IDB (ida-pro-mcp-win).  
Parallel mac-side evidence produced in separate mac IDB (hotspot cluster audit, same session family).  
Platform divergence note: mac version uses Action semantics (platform event dispatch); win version is pure Query (reads settings, no platform event). This divergence is correctly reflected in the separate mac vs win evidence.

dim5: **closed** (Win same-platform evidence; platform divergence noted).

---

## dim6 — Test/acceptance mapping

Not in scope — source archive implementation side. Not reversed.

---

## Fake-wall taxonomy exhaustion

| category | verdict | evidence |
|---|---|---|
| drop_in_place / async shim | NOT fake wall | func_query confirms real owner name, has_type=true, 879B body with real logic |
| architecture_only / budget self-limit | NOT fake wall | 32 blocks, fully decompiled in one pass, no bail |
| async decompile failed (HexRays) | NOT fake wall | No async state machine; synchronous IPC handler; zero decompile errors |
| VA pointing at wrong neighbor | NOT fake wall | func_query name match = get_hotspot_enabled_owner_sys at exactly 0x140285050 |
| vtable / dynamic dispatch | NOT fake wall | All callees direct/named; no fat-pointer chains |
| HTTP-terminal | NOT fake wall | Pure local settings read; no HTTP |
| Library internal unreachable | NOT fake wall | get_hotspot_config_core_read_sys is AiMaMi-internal, fully decompiled |
| body too large | NOT fake wall | 879 bytes is small |

**recovery_attempts**: N/A — no fake walls encountered. All dims closed with real evidence.  
**genuine_ceiling**: false  
**accepted_unknown**: none  

---

## Gate verdict

| dim | status |
|---|---|
| dim1 CCF | closed — frontend wrapper + rodata string confirmed |
| dim2 owner body | closed — decompiled A-level, real body |
| dim3 call depth | closed — depth >= 5, terminal = disk settings read |
| dim4 DTO/error/side | closed — req:{}, resp:bool, err:poison, side:none |
| dim5 same-platform | closed — Win IDB evidence |
| dim6 test mapping | not in scope (source archive side) |

**gate_tier**: strictImplementationUse  
**gate_accepted**: false (dim6 not closed — source archive side; ceiling: strictImplementationUse)  
**implementation_use**: false (readyToImplement not reached; dim6 not closed)  
**block_decomposed**: false  
**genuine_ceiling**: false  
