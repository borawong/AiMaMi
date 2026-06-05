# hotspot_ready — Windows x64 1.0.9 Evidence

**session**: wf-aimami109-dualcomplete  
**machine**: <workstation>  
**binary_sha256**: a5822387fa3f56dc03893111f4ffdd074daa882e8887ec4e7c394879c0e9fe0b  
**binary_sha12**: a5822387fa3f  
**platform**: windows-x64  
**module**: system  
**command**: hotspot_ready  
**produced_at**: 2026-06-03  
**source**: ida-pro-win-mcp  

---

## Confirmed

### dim1 — Frontend CCF / UI trigger
- `hotspotReady()` → `invoke("hotspot_ready")` — confirmed in Windows-bundled `assets\index-CL22l5v8.js` line 86, col 31559
- Snippet: `hotspotReady:()=>G("hotspot_ready")`
- Also confirmed in macOS CCF `assets/index-BMIqZhJm.js` line 41: `hotspotReady` → `B("hotspot_ready")`
- **argKeys**: [] (no args required)
- Note: no settings-page callsite found for hotspot_ready (unlike get/set which appear in settings-page-CXcOCj-K.js) — likely called from a different UI surface (e.g., status polling, readiness gating)

### dim2 — Owner decompile
- **Owner**: `hotspot_ready_owner_sys` @ `0x14026DEF0` (size: 0x34F)
- **Binding**: string xref from `aHotspotReady` @ `0x141268FDE` → `0x14026DF70` inside owner
- Owner sets command descriptor with `"hotspot_ready"` (len=13) + `"app"` namespace (3), calls `get_usage_refresh_interval_core_read` to read current hotspot/network state, branches on state==3 (None)
- When state exists (!=3): calls `hotspot_ready_state_check_sys` @ `0x140162D40` to evaluate readiness
- Returns readiness bool via `tauri_ipc_resolve_sys`
- IDB renamed + commented; IDB saved

### dim3 — Call-tree to leaf
```
hotspot_ready_owner_sys (0x14026DEF0)
  get_usage_refresh_interval_core_read (0x1402DCBc0)    — read current hotspot+network combined state
    [if state==3 (None): early exit, return None/false via tauri_ipc_resolve_sys]
  hotspot_ready_state_check_sys (0x140162D40)
    hotspot_combined_state_read_sys (0x1402CA160)       — combined state read
      sub_1402CD250                                      — repo hashmap lookup (get_usage_refresh_interval_repo_snapshot)
        get_usage_refresh_interval_repo_snapshot (0x1400F61A0) — terminal: persistence_commit/read from repo
      sub_1400E1090                                      — network interface status check
      sub_140077C80                                      — boolean success check on network state
    memcpy                                               — copy state
    sub_140638240                                        — readiness check: inspects field at Dst[34] (offset 136 into combined struct)
    sub_140176BB0                                        — drop/error propagate if not ready
    sub_14017F9C0                                        — cleanup combined state
  tauri_ipc_resolve_sys (0x140062230)                   — terminal: IPC response
  sub_140068830                                          — error cleanup
  sub_140298200                                          — context cleanup
```
- Terminal reason: `get_usage_refresh_interval_repo_snapshot` = persistence_commit; `tauri_ipc_resolve_sys` = response_serialize
- Call-tree depth = 6, terminal_reason = external_call_recorded

### dim4 — Interface / DTO / error / side-effect
- **Request**: `invoke("hotspot_ready")` — no args
- **Response**: `bool` — true if hotspot is ready (enabled + network interface up + system ready), false otherwise
- **Readiness check logic** (from `hotspot_ready_state_check_sys`):
  - Reads combined state via `hotspot_combined_state_read_sys` (both HotspotConfig + network interface snapshot)
  - Calls `sub_140638240` with combined struct — checks field at `Dst[34]` (int at byte offset 136 of 896-byte combined state struct)
  - If check fails (not ready): returns error/false path via `sub_140176BB0`
  - Result: `v10 == 18` == ready (discriminant 18 = "Ready" variant of hotspot state enum)
- **Error paths**:
  - State == 3 (None): returns None/false immediately (hotspot not configured)
  - `sub_140638240` returns discriminant != 18: not ready, error propagated
- **Side-effects**: none — read-only, no file write, no process spawn
- **"app" namespace (3)**: unlike get/set which also check "repo" (4), hotspot_ready only checks "app" namespace — implies it reads in-memory (runtime) state, not persisted config. The hotspot is "ready" only when runtime network state confirms it, not just when config says enabled.

### dim5 — Same-platform gate
- String → xref → owner: A-level binding
- Decompile: status=decompiled, source=ida, SHA matches
- Frontend CCF: Windows CCF confirms command + argKeys: []
- Call-tree: depth >= 6, terminal_reason = external_call_recorded (get_usage_refresh_interval_repo_snapshot + sub_140638240)

---

## Inferred

- The `"app"` namespace (3) vs `"repo"` namespace (4) distinction: `hotspot_ready` uses app-scoped (in-memory runtime) state — the readiness of the hotspot depends on actual network interface status, not just persisted config. This is why `hotspot_ready` is separate from `get_hotspot_enabled`.
- `sub_140638240` checking discriminant==18 suggests a `HotspotState` or `NetworkInterfaceState` enum with variant 18="Ready"
- The combined state struct (0x380 bytes = 896 bytes) contains both `HotspotConfig` and network interface snapshot — `hotspot_combined_state_read_sys` merges both for readiness evaluation
- The startup log `"[AiMaMi] startup: hotspot_enabled="` in `auto_switch_watcher_bootstrap_sys` reads the same state at boot, confirming hotspot readiness is checked in the auto-switch watcher context

---

## Unknown

- The exact `HotspotState` enum layout (discriminant 18 = Ready is confirmed; other variants unknown)
- Whether `hotspot_ready` can return true if `get_hotspot_enabled` returns false (i.e., whether hotspot daemon can be running despite `enabled=false`)
- The network interface check logic inside `sub_1400E1090` (what constitutes a ready network interface on Windows)
