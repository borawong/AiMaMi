# deactivate_relay_provider — Windows x64 Evidence
session: B-router-test-http
sha: a5822387fa3f56dc03893111f4ffdd074daa882e8887ec4e7c394879c0e9fe0b (SOT: raw/binary/AiMaM 1.0.9 win64.exe.i64)
produced_at: 2026-06-02
platform: windows-x64
binary: AiMaM 1.0.9 win64.exe

## Confirmed

### Owner
- owner VA: 0x140275030
- owner name: deactivate_relay_provider_owner_sys (A-level rename, B-router-test-http session)
- size: 0x5ce bytes (identical size to activate_relay_provider)
- string xref: 0x14126903C → "deactivate_relay_provider" → data ref at 0x1402750B2 inside owner

### Structural identity with activate_relay_provider
The pseudocode of deactivate_relay_provider_owner_sys is structurally IDENTICAL to activate_relay_provider_owner_sys except:
- Command string: "deactivate_relay_provider" (len 25) vs "activate_relay_provider" (len 23)
- Core impl callee: `sub_14043F960` (deactivate) vs `sub_14043F680` (activate)
- All other callees identical: sub_1400DA320, sub_1411CE640, get_usage_refresh_interval_core_impl, sub_140463CE0, sub_14006F000, tauri_ipc_resolve_sys, sub_140298200

### arg extraction (IPC DTO) — same pattern as activate
1. `manager` (len 7) — app state guard
2. `providerId` (len 10) — provider identifier string
3. `ide` (len 3) — ide identifier string

### Core implementation path
- calls `sub_14043F960` (core impl: deactivate provider persistence write)
  - callees: sub_140147510 (file-path resolution for deactivate), sub_140464400, sub_14045D780, sub_140439740, sub_140001370
  - Note: different file-path resolver (sub_140147510) vs activate (sub_140152720)
- on success: sub_14006F000 → sub_14044BC90 + tauri_ipc_resolve_sys
- on failure: early tauri_ipc_resolve_sys with error

### IPC response
- `tauri_ipc_resolve_sys` terminal — Result<(), Error>
- No payload on success

### Side effects
- `sub_14043F960` → `sub_14045D780`: persistence write for relay deactivation state
- No HTTP send

### Call-tree depth
owner(0x140275030) → sub_14043F960 → sub_14045D780 [persistence_commit, terminated_reason=persistence_commit]
owner → tauri_ipc_resolve_sys [response_serialize]
depth ≥ 5

## Inferred
- Sub_140147510 vs sub_140152720: two different file-path resolvers for activate vs deactivate (likely different state files or flags)
- Otherwise behavior is symmetric inverse of activate_relay_provider

## Unknown
- Exact on-disk path for deactivation state
- Whether deactivation removes the provider entry or flips an active flag
- Error message strings
