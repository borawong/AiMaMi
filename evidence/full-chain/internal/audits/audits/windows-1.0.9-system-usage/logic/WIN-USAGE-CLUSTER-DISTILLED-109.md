# DISTILLED: Windows x64 — system/usage cluster (AiMaMi 1.0.9)

produced_by: <workstation>
session: <audit-session>
produced_at: 2026-06-03  
addendum_at: 2026-06-04  
authoritative: true  
gate_accepted: false  
platform: windows-x64  
source_binary_sha256: a5822387fa3f56dc03893111f4ffdd074daa882e8887ec4e7c394879c0e9fe0b  
raw_evidence: `raw/aimami/1.0.9/windows/system/{leaf}/evidence.md`  
is_upstream: false (all 3 are source archive-extra, not in upstream codex-cli)

---

## Leaf Summary Table

| leaf | owner_va | gate | dims_done | dim6 | is_upstream | accepted_unknown |
|---|---|---|---|---|---|---|
| get_usage_refresh_interval | 0x1402663e0 (dispatcher case), core: 0x1402dcbc0 | strictImplementationUse | dim1-5 | empty | false | — |
| set_usage_refresh_interval | 0x14027f690 (addr_verified) | strictImplementationUse | dim1-5 | source archive-side wired; does not promote binary gate | false | false (all 7 taxonomy items excluded) |
| refresh_usage_snapshot | 0x1408cdb20 (coroutine) | strictImplementationUse | dim1-5 | empty | false | async_coroutine_decompile_failure |

---

## get_usage_refresh_interval

**Behaviour:** Read-only. Reads `usageRefreshInterval` field from `CodexMateSettings` via Repository snapshot.

**Windows dispatch path:**  
`auto_switch_multiplex_dispatcher_sys@0x1402663e0` → `get_usage_refresh_interval` case @ `0x1402686e6`  
→ `get_usage_refresh_interval_core_read@0x1402dcbc0`  
→ `get_usage_refresh_interval_repo_snapshot@0x1400f61a0` reads field at `repo+144`

**CCF:** `src/lib/api.ts:209` `invoke<string>("get_usage_refresh_interval")` + `use-auto-refresh.ts:62` on mount + `use-auto-refresh.ts:48` on error fallback.

**Response:** `string` — one of `"30s"`, `"1m"`, `"3m"`, `"5m"`.  
**Params:** none.  
**Side-effects:** Read-only.

---

## set_usage_refresh_interval

**Behaviour:** Validates interval sensitive-field, persists to `CodexMateSettings.usageRefreshInterval`, wakes usage_refresh_watcher condvar.

**Windows dispatch path:**  
`set_usage_refresh_interval_owner_sys@0x14027f690`  
→ `get_usage_refresh_interval_core_read` (precheck)  
→ repo mutex acquire `sub_1400DA7C0`  
→ `import_remote_device_secret_result_adapter_sys` (extracts `interval` param)  
→ `set_usage_refresh_interval_core_impl@0x1400a9260`  
  → `usage_refresh_interval_parse_string@0x140563c80` (validate + write)  
  → `settings_serialize_remote_device_secret_and_save_sys@0x140553a90` (atomic save)  
  → `usage_refresh_interval_string_to_secs@0x14056de00` (seconds mapping)  
  → `sub_1400AB7C0` (settings notify dispatch) → `sub_1410332C0` = `WakeByAddressAll` broadcast on all waiting threads  
  → `WakeByAddressSingle` (direct condvar wake on mutex unlock)

**CCF:** `src/lib/api.ts:211` `invoke<string>("set_usage_refresh_interval", { interval })` + `use-auto-refresh.ts:36` on user interval change.

**Valid tokens:** `"30s"` (30s), `"1m"` (60s), `"3m"` (180s), `"5m"` (300s).  
**Invalid:** `Err(8=InvalidVariant)` for unknown sensitive-field.  
**Response:** `string` — confirmed saved interval.  
**Side-effects:** Atomic settings file write (`settings_serialize_remote_device_secret_and_save_sys` — JSON fields: `hotspot`, `usageRefreshInterval`, `deviceId`, `remoteDeviceSecret`, 
otificationsSince`, `apiProxy`, `MysteryRouteGrant`) + `WakeByAddressSingle` condvar (mutex unlock) + `WakeByAddressAll` broadcast via `sub_1400AB7C0→sub_1410332C0` (all threads waiting on interval change notified).

---

## refresh_usage_snapshot

**Behaviour:** Active-account-only usage refresh. Calls Codex API for the currently active account. Does NOT refresh all accounts.

**Windows dispatch path (ceiling-crack, session <audit-session>):**  
`sub_1408CDB20@0x1408CDB20` — 4-state async coroutine (outer), nested 4-state inner + 6-state HTTP sub-state + 4-state body sub-sub-state. IDA Hex-Rays decompile fails on main body (too many nested switches, ~750 insns); full disasm obtained + all field callees decompiled.

Outer discriminant: `coroutine_self+0x1520` (4 cases).  
Inner discriminant: `coroutine_self+0x1510` (4 cases, HTTP accounts future).  
HTTP sub-state: `coroutine_self+0x1500` (6 cases).  
Body sub-sub-state: `coroutine_self+0x14F8` (4 cases).

**Full confirmed call chain:**
- `get_usage_refresh_interval_core_read@0x1402DCBC0` → reads `CodexMateSettings.usageRefreshInterval` at Repository+144
- `sub_1402D3C90@0x1402D3C90` → Arc::clone AppHandle for async context
- `sub_1400B70F0@0x1400B70F0` → active-account HTTP fetch/poll dispatch; locks Repository mutex; calls WakeByAddressSingle on complete
- `sub_140608BC0@0x140608BC0` (×2) → reqwest HTTP client builder; reads TLS/connection config from global at +60h/+10h
- `sub_140387680@0x140387680` → accounts HTTP refresh poll; reads account future state bytes; calls vtable dispatch for response body
- `sub_1404449F0@0x1404449F0` → CoreEnvelope JSON serializer (schemaVersion/success/code/message/data)
- `runtime_state_updated_emit_and_tray_refresh_sys@0x1400AF970` → emits "runtime-state-updated" WebView event with mode="progressive"
- `tauri_ipc_resolve_sys@0x140062230` → final IPC response emit
- `WakeByAddressSingle@0x141206B20` → condvar wake (same as set_usage_refresh_interval)

**String anchors confirmed in body:**  
`"refresh_usage_snapshot"@0x14129C8B1` (len 0x16), `"app"@0x14129C7CD` (len 3), `"progressive"@0x14129E920` (len 0xB), `"src<network-share>"` panic paths.

**active-account-only filter:** disasm at 0x1408CDC91: single account loop; `sub_1400B70F0` reads `[a1+480]`==6 (single-account mode), processes only `[a1+488]`/`[a1+496]` refs.

**Polled by:** `sub_1409C0EA0@0x1409C0EA0` (Tauri async driver, size 0x235) AND `sub_1409F2240@0x1409F2240` (same size — second caller, likely watcher loop). Both confirmed by xrefs_to; coroutine is authoritative body (string anchor).

**CCF:** `src/lib/api.ts:369–370` `invoke<CoreEnvelope<AccountListPayload>>("refresh_usage_snapshot")` + `main-app.tsx:647` `refreshUsageSnapshotAndReload` on startup after first snapshot.

**Params:** none.  
**Response:** `CoreEnvelope<AccountListPayload>` — fields: schemaVersion(+752), success(+756), code(+688/696), message(+712/720), data(+736/744).  
**Side-effects:**
1. Read `CodexMateSettings.usageRefreshInterval` (read-only, Repository+144)
2. HTTP GET to Codex API for active account
3. Emit `"runtime-state-updated"` WebView event with mode=`"progressive"`
4. `WakeByAddressSingle` on usage_refresh_watcher condvar
5. Drop account snapshot Arc refs on completion

**Error paths:** `Err(0x8000000000000025)` → error CoreEnvelope; `Err(0x800000000000000C)` → pending/re-poll; display fmt panic → `sub_1412085B0`; invalid states → `ud2` abort.

**was_drop_in_place_only:** false — real_body_found=true  
**accepted_unknown:** resolved — ceiling-crack via disasm + callee decompile achieves full strictImplementationUse closure. No genuine ceiling (was IDA decompile limitation, not ICF identity collapse).  
**Ceiling-crack evidence:** `<source-location>/audits/windows-1.0.9-system-usage/logic/WIN-REFRESH-USAGE-SNAPSHOT-CEILING-CRACK-109.md`

---

## Shared Infrastructure

- `get_usage_refresh_interval_core_read@0x1402dcbc0` is called by BOTH `get_usage_refresh_interval` and `refresh_usage_snapshot` — shared read path into same `CodexMateSettings.usageRefreshInterval` field
- `settings_deserialize_usage_refresh@0x1405532d0` deserializes `CodexMateSettings` struct from `repo+584/592`; field schema: `"CodexMateSettings..."` + `"usageRefreshInterval"` field at `0x141285f40`
- Repository interval field at struct offset `+144` (DWORD discriminant)
- `WakeByAddressSingle` at `0x141206b20` — Windows condvar primitive for usage_refresh_watcher

---

## Platform Notes

- No macOS divergence observed for the IPC interface (same param/response contract expected)
- `refresh_usage_snapshot` is source archive-extra on both platforms — not in upstream codex-cli
- `set_usage_refresh_interval` / `get_usage_refresh_interval` are source archive-extra — not in upstream codex-cli
