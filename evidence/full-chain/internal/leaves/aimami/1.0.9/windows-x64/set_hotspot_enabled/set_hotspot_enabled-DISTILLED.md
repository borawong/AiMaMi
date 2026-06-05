# set_hotspot_enabled — Windows x64 DISTILLED

**product**: aimami  
**version**: 1.0.9  
**platform**: windows-x64  
**scope**: set_hotspot_enabled  
**addr_verified**: 0x14027c6d0 (func_query confirmed `set_hotspot_enabled_owner_sys`, size 0x5AE=1454B, has_type=true; no name collision — companion `set_hotspot_enabled_write_core_sys` at 0x140163440 also confirmed distinct)  
**binary_sha256**: a5822387fa3f56dc03893111f4ffdd074daa882e8887ec4e7c394879c0e9fe0b  
**binary_sha12**: a5822387fa3f  
**session**: <audit-session>
**machine**: <workstation>
**produced_at**: 2026-06-04  
**gate_tier**: strictImplementationUse  
**genuine_ceiling**: false  
**block_decomposed**: false (both owner + write-core decompiled in one pass, no budget bail)  

---

## dim1 — Frontend CCF

Command name embedded in binary rodata: `aSetHotspotEnab` @ `0x141268fba` = `"set_hotspot_enabled"` (confirmed in refs of owner body).  
Field name literals present in rodata: `"app"` @ `0x141269230`, `"repo"` @ `0x141269220`, `"enabled"` @ `0x14126925b`.

Frontend CCF from prior audit session (audit windows-1.0.9-system-hotspot) not explicitly captured for `set_hotspot_enabled` — treat as **open** (win-side gap). The rodata string `"set_hotspot_enabled"` confirms the Tauri command name. The companion getter `get_hotspot_enabled` had: `invoke("get_hotspot_enabled")` in `index-CL22l5v8.js` and `settings-page-CXcOCj-K.js`. The setter's frontend CCF should be in the same JS bundle calling `invoke("set_hotspot_enabled", { enabled: bool })`.

dim1: **open** (rodata string confirmed; frontend wrapper caller site not yet scraped from win JS bundle — product/frontend-lane gap, not binary cap).

---

## dim2 — Owner body (decompiled)

**True owner**: `set_hotspot_enabled_owner_sys` @ `0x14027c6d0`, size 0x5AE (1454 bytes).  
Verified by `func_query(name_regex="set_hotspot_enabled")` — two hits, no collision. The audit-stated addr 0x14027c6d0 is the owner; companion write-core is at 0x140163440.  
Body decompiled cleanly (no HexRays errors, no budget bail). Not async (no Future/poll state machine).

**Execution flow summary** (`set_hotspot_enabled_owner_sys`):

1. `memcpy(Dst, Src, 520)` — copy 520B IPC context (incl. `Dst[64]` which holds AppState arc ptr).
2. `memcpy(v18, Src+520, 400)` — copy trailing IPC buffer (response channel).
3. Extract `v33` = pointer at `*(Src+936)`, `v32` = 128-bit vec-header at `Src+920`.
4. **Guard check**: `get_usage_refresh_interval_core_read(Srca)` — reads current `UsageRefreshInterval` from repo. If `LODWORD(Srca[0]) == 3` (error/none state), early-exit via `tauri_ipc_resolve_sys` (returns early, no write).
5. **Repo lock check**: `sub_1400DA7C0(Dst[64]+16)` — RwLock-like acquire on repo ptr. If acquire fails (`v2 == 0`), proceed to init path; else cache-hit path via `sub_1411CE640`.
6. **Boolean argument deserialization**: `sub_1404632D0(v26, &v34)` with `aEnabled_0 = "enabled"` context → deserializes the incoming `enabled: bool` argument from IPC payload into `v26`. If `LOBYTE(v26[0]) != 6` (success): proceed. If `== 6`: error early-exit via `tauri_ipc_resolve_sys`.
7. **Core write**: `set_hotspot_enabled_write_core_sys(0x140163440)(&v28, v19, v2, BYTE1(v26[0]))` — performs the actual enabled-flag write into settings and disk persistence.
8. Post-write result copy: copies result into `v19[0]` struct (discriminant + payload bytes).
9. Optional string copy: if write returned non-empty string data (`MaxCount > 0` and not sentinel), allocs and copies via `sub_140001360`/`memcpy`.
10. Cleanup: `sub_14006BAA0(Srca)` (drop temp), then post-resolve cleanup loop over `v32` vec (stride 96, drop per element), free vec buffer via `sub_140001370`, return `sub_140298200(Dst)`.

**Core sub-body** (`set_hotspot_enabled_write_core_sys` @ 0x140163440):

1. `_InterlockedCompareExchange8(a3, 1, 0)` — once-cell lock acquire; if already locked, park via `sub_141206A60(a3)`.
2. Read lock/flag check: `off_141882E30` double-check pattern (Windows SRWLock or custom); `sub_1412077A0()` thread check.
3. **Poison path** (if flag at `a3[1]` is set): build Err result with `Src[0]=0, Src[1]=1` → lock-contention / poison. Release via `WakeByAddressSingle`. Propagate into `a1` struct.
4. **Happy path**: `settings_deserialize_usage_refresh(Dst)` — deserialize full `CodexMateSettings` from `~/.codex/` (fields: `hotspot`, `usageRefreshInterval`, `deviceId`, `remoteDeviceSecret`, 
otificationsSince`, `apiProxy`, `MysteryRouteGrant`, `route`, `expiresAtMs`).
5. Mutate: `LOBYTE(Dst[18]) = a4` — set `enabled` bool field (byte at offset +144 in the `CodexMateSettings` struct, which maps to `hotspot.enabled`).
6. `settings_serialize_remote_device_secret_and_save_sys(Src, a3+8, Dst)` — re-serializes full `CodexMateSettings` incl. updated `hotspot.enabled` to JSON and writes via `sub_140336350` to `~/.codex/` settings store (at `a3+576` offset into repo).
7. Discriminant check on serialize result: `v15 = *Src[0]`. If `== 10` (success): release lock (`WakeByAddressSingle`), then handle `enabled==true` vs `enabled==false` branches:
   - **enabled==true** (`a4 != 0`): calls `sub_140163CE0(v28)` — likely triggers hotspot activation side-effect (wake/signal downstream observer). If non-null result: wraps in Ok, frees result, writes into `a1`. `sub_140DE5140` lock-unwrap. `sub_140176BB0` + `sub_140001370` free.
   - **enabled==false** (`a4 == 0`): calls `hotspot_combined_state_read_sys(0x1402CA160)(Src)` — reads combined hotspot+display state. If discriminant `!= 3`: copies state, calls `sub_140695DD0` (likely platform signal/teardown), then `sub_1406D3A10` + `sub_14017F9C0` (cleanup). Sets `a1` to Ok sentinel `0x8000000000000000`.
8. **Error branch** (serialize returns != 10): packs error discriminant + value into result from `v25[]` fields. `sub_14017DEC0(Dst)` — drop temp settings.
9. Lock release: `WakeByAddressSingle` on lock byte, final `sub_1400550D0(v28)` drop.
10. Return `a1` (out-param struct with discriminant + payload).

dim2: **closed** (both owner + write-core decompiled A-level, non-async, synchronous IPC write handler with full logic traced).

---

## dim3 — Call depth / callees

**Owner callees** (15 unique):

| addr | name | role |
|---|---|---|
| 0x1411CCB90 | memcpy | frame init |
| 0x1402DCBC0 | get_usage_refresh_interval_core_read | pre-write guard: reads UsageRefreshInterval; early-exit if state==3 |
| 0x1400DA7C0 | sub_1400DA7C0 | repo RwLock acquire |
| 0x1411CE640 | sub_1411CE640 | cached-result encoder / Result-wrapper (cache-hit path) |
| 0x1404632D0 | sub_1404632D0 | bool arg deserializer ("enabled" field) |
| 0x140163440 | set_hotspot_enabled_write_core_sys | **core write** — deserialize settings, mutate enabled, persist to disk |
| 0x140062230 | tauri_ipc_resolve_sys | IPC response serializer |
| 0x1400550D0 | sub_1400550D0 | drop/cleanup temp state |
| 0x14120829B | sub_14120829B | panic handler (OOM) |
| 0x1400013A0 | nullsub_1 | no-op stub |
| 0x140001360 | sub_140001360 | alloc |
| 0x140001370 | sub_140001370 | dealloc/drop |
| 0x14006BAA0 | sub_14006BAA0 | error-path drop/cleanup |
| 0x1400CA020 | sub_1400CA020 | per-element drop in cleanup loop |
| 0x140298200 | sub_140298200 | IPC frame drop/return |

**Write-core callees** (20 unique):

| addr | name | role |
|---|---|---|
| 0x141206A60 | sub_141206A60 | once-cell park (wait for lock) |
| 0x1412077A0 | sub_1412077A0 | thread-state check (SRWLock) |
| 0x1405532D0 | settings_deserialize_usage_refresh | **read CodexMateSettings from disk** (a3+584/592) |
| 0x140553A90 | settings_serialize_remote_device_secret_and_save_sys | **JSON-serialize + write CodexMateSettings to disk** (via sub_140336350) |
| 0x14005B530 | sub_14005B530 | drop deserialized settings temp |
| 0x140163CE0 | sub_140163CE0 | hotspot activation trigger (enabled=true path) |
| 0x140DE5140 | sub_140DE5140 | lock-state unwrap (once-cell result) |
| 0x140176BB0 | sub_140176BB0 | drop result Arc |
| 0x140001370 | sub_140001370 | dealloc/drop |
| 0x140464400 | sub_140464400 | Result-encoder / pack Ok value |
| 0x14017DEC0 | sub_14017DEC0 | drop temp settings (error path) |
| 0x141206B20 | WakeByAddressSingle | Win32 futex-like wake (lock release) |
| 0x1402CA160 | hotspot_combined_state_read_sys | read combined hotspot+display state (enabled=false path) |
| 0x1411CCB90 | memcpy | state copy |
| 0x140695DD0 | sub_140695DD0 | platform signal / state teardown (disable path) |
| 0x1406D3A10 | sub_1406D3A10 | drop combined state |
| 0x14017F9C0 | sub_14017F9C0 | drop/cleanup |
| 0x1400550D0 | sub_1400550D0 | drop temp repo handle |
| 0x1412085B0 | sub_1412085B0 | panic with display error (poison path) |
| 0x14106D750 | sub_14106D750 | poisoned-lock check / acquire guard |

**field sub-chain terminals**:
- `settings_serialize_remote_device_secret_and_save_sys` (0x140553A90) → `sub_140336350` → writes to `~/.codex/` file store (disk terminal).
- `settings_deserialize_usage_refresh` (0x1405532D0) → `sub_14104DEE0` reads from `a2+584/592` (repo file ptr offsets) → disk read.
- JSON field table confirmed in serializer: `"hotspot"`, `"usageRefreshInterval"`, `"deviceId"`, `"remoteDeviceSecret"`, `"notificationsSince"`, `"apiProxy"`, `"MysteryRouteGrant"`, `"route"`, `"expiresAtMs"`.

dim3: **closed** (depth >= 5 terminal = disk read/write via settings_deserialize/serialize).

---

## dim4 — DTO / error / side-effect

**Request DTO**:
```
{ enabled: boolean }
```
- `enabled`: deserialized from IPC payload via `sub_1404632D0` with field name `"enabled"`. Single boolean argument.

**Response DTO**:
```
Result<(), Error>
```
- Success discriminant `== 10` in serializer, packed into Ok sentinel `0x8000000000000000` in `a1`. No payload data — unit return on success.
- Error variants: serialization error (discriminant != 10), poison error (lock), or early-exit (UsageRefreshInterval state==3 = not ready).

**Error enum** (observed discriminants):
- `LOBYTE(v26[0]) == 6` → boolean argument deserialization error (bad arg type). Early exit via `tauri_ipc_resolve_sys`.
- `LOBYTE(v27[0]) == 6` → cache-hit path error (repo lock poison). Early exit via `tauri_ipc_resolve_sys`.
- `LOBYTE(v19[0]) == 6` with `BYTE1` payload → write-core lock-contention / poison error. Propagated to caller.
- `LODWORD(Srca[0]) == 3` → UsageRefreshInterval not ready (state=3 = None/Loading). Early exit (no write performed).
- `v15 != 10` (serialize result != Ok): settings serialization error, packs into error result.

**Side effects**:
- **Disk write**: `settings_serialize_remote_device_secret_and_save_sys` → writes mutated `CodexMateSettings` JSON to `~/.codex/` settings file. This is the primary side effect.
- **enabled=true path**: `sub_140163CE0(v28)` → likely emits hotspot activation signal / wakes downstream observer or thread. Non-null result triggers Arc/result packaging → side effect is triggering hotspot activation.
- **enabled=false path**: `hotspot_combined_state_read_sys` → reads state, then `sub_140695DD0` → platform signal or teardown of hotspot services. Side effect is triggering hotspot disable/teardown.
- **No network calls**: all side effects are local (disk + in-process signal).
- **WakeByAddressSingle**: internal lock synchronization, not observable side effect.

dim4: **closed** (req:{enabled:bool}, resp:Result<(),Error>, err:[arg-deser-fail, poison, not-ready, serialize-fail], side:[disk-write, hotspot-activate-or-teardown]).

---

## dim5 — Same-platform gate

Windows x64 binary confirmed as target platform (binary_sha12=a5822387fa3f, ida-pro-mcp-win IDB).  
Both owner (`set_hotspot_enabled_owner_sys`) and write-core (`set_hotspot_enabled_write_core_sys`) decompiled from Windows IDB.  
Platform divergence note: macOS version of `set_hotspot_enabled` likely uses NSUserDefaults/NSWorkspace for hotspot enable/disable signals; Windows version uses `WakeByAddressSingle` + settings JSON file write + `sub_140695DD0` platform-specific teardown. Platform-specific side effects are correctly segregated in separate evidence bundles.

dim5: **closed** (Win x64 IDB evidence, same-platform throughout).

---

## dim6 — Test/acceptance mapping

Not in scope — source archive implementation side. Not reversed.

---

## Fake-wall taxonomy exhaustion

| category | verdict | evidence |
|---|---|---|
| drop_in_place / async shim | NOT fake wall | func_query confirms `set_hotspot_enabled_owner_sys` real name + has_type=true + 1454B non-trivial body with IPC logic |
| architecture_only / budget self-limit | NOT fake wall | 1454B owner + 1575B write-core, both decompiled fully in one pass, no bail |
| async decompile failed (HexRays) | NOT fake wall | No async state machine; synchronous IPC handler; zero decompile errors on both functions |
| VA pointing at wrong neighbor | NOT fake wall | func_query exact name match at 0x14027c6d0; companion at 0x140163440 is different function (write-core), not a collision |
| vtable / dynamic dispatch | NOT fake wall | All callees direct/named; `sub_140163CE0` (hotspot activation) is direct call, not vtable |
| HTTP-terminal | NOT fake wall | All writes are local disk (`~/.codex/`); no reqwest/HTTP chains |
| Library internal unreachable | NOT fake wall | `settings_deserialize_usage_refresh` and `settings_serialize_remote_device_secret_and_save_sys` are AiMaMi-internal, fully decompiled with field names |
| body too large | NOT fake wall | 1454B and 1575B are mid-size, both fully decompiled without chunking |

**recovery_attempts**: N/A — no fake walls encountered. All dims closed with real evidence.  
**genuine_ceiling**: false  
**accepted_unknown**: none  

---

## Gate verdict

| dim | status |
|---|---|
| dim1 CCF | open — rodata `"set_hotspot_enabled"` string confirmed; frontend call-site not yet scraped (product/frontend-lane gap, not binary cap) |
| dim2 owner body | closed — both owner + write-core decompiled A-level, non-async, full logic traced |
| dim3 call depth | closed — depth >= 5, terminals = disk settings read/write |
| dim4 DTO/error/side | closed — req:{enabled:bool}, resp:Result<(),()>, err:[deser-fail, poison, not-ready, serialize-fail], side:[disk-write, hotspot-activate/teardown] |
| dim5 same-platform | closed — Win x64 IDB evidence throughout |
| dim6 test mapping | not in scope (source archive side) |

**gate_tier**: strictImplementationUse  
**gate_accepted**: false (dim1 open — frontend CCF gap; dim6 not in scope)  
**implementation_use**: false (readyToImplement not reached; dim1 not closed)  
**block_decomposed**: false  
**genuine_ceiling**: false  
