# DISTILLED (canonical) — cmd_detect_api_proxy_config_coroutine (Win x64 1.0.9)

**authoritative**: true
**schema**: restoration.cm.distilled.v1
**session**: <audit-session>
**machine**: <workstation>
**model**: claude-sonnet-4-6
**produced_at**: 2026-06-04
**binary**: AiMaM 1.0.9 win64.exe
**binary_sha256**: a5822387fa3f56dc03893111f4ffdd074daa882e8887ec4e7c394879c0e9fe0b
**binary_size**: 26821632
**binary_format**: pe (x86_64)
**idb**: <source-location>\raw\binary\AiMaM 1.0.9 win64.exe.i64
**owner_va**: 0x1408c45b0
**addr_verified**: 0x1408c45b0 (func_query confirmed; unique match `cmd_detect_api_proxy_config_coroutine_sys`, has_type=true)
**owner_name**: cmd_detect_api_proxy_config_coroutine_sys
**owner_size**: 0xb22 (2850 B)
**callees_count**: 22 (all internal)
**gate_tier**: strictImplementationUse
**real_body_found**: true
**genuine_ceiling**: false
**block_decomposed**: false
**accepted_unknown**: false
**recovery_attempts**: N/A — no fake-wall encountered; all 7 taxonomy branches ruled out
**caller_disambiguation_tried**: false (no ICF ambiguity; unique named coroutine)
**dim1_frontend_ccf**: not_verified (win-side frontend lane gap; does not block strictImplementationUse)
**dim2_body**: closed — full decompile at 0x1408c45b0; Tauri coroutine state machine (states 0/1/2/3 on a1[2528]); real poll body is this function body itself (not a shim)
**dim3_callees_xrefs**: closed — 22 callees enumerated; xrefs: dispatched from sub_1409D3A00@0x1409d3a00 (0x235B) + sub_1409EF280@0x1409ef280 (0x235B) + 2 data refs
**dim4_dto_error_side_effects**: closed — see below
**dim5_same_side_gate**: closed — 4 api_proxy_config-family functions confirmed on win side (set handler + write_core + detect_coroutine + test_coroutine)

---

## Behavior

`cmd_detect_api_proxy_config_coroutine` is an **async Tauri IPC coroutine** implementing proxy detection. It reads current settings from the repository, checks the current proxy tag, and if proxy is already configured to "no proxy" (tag==3), returns immediately. Otherwise it launches a TCP probe coroutine (`sub_140609490`) targeting the current proxy endpoint, then polls `detect_system_env_proxy_sys@0x140110a80` for environment variable proxy candidates.

### Coroutine State Machine

The function body at 0x1408c45b0 IS the full coroutine (Tauri `coroutine_sys` pattern). State discriminant is `a1[2528]`. States:

- **state 0** (initial): Copies input params; reads settings snapshot via `get_usage_refresh_interval_core_read@0x1402dcbc0`; checks if tag == 3 (no proxy configured) → if so, calls cleanup loop on existing proxy entries (`sub_140889870` + `sub_1400CA020`) and goes to LABEL_56 (complete, no probe); otherwise copies settings data and falls through to launch probe.
- **state 1/2/3** (resume states): Standard Tauri coroutine resume path; calls `sub_141208950`/`sub_141208970` (waker/waker-release).
- **LABEL_12 path** (from state 0 non-tag3): Reads state byte at `a1[2504]`; dispatches to inner coroutine probe path; calls `sub_140609490` (TCP probe coroutine launcher) for the current proxy address; stores coroutine handle at `*(v76 + 311*8)`.
- **LABEL_23 path** (probe await): Calls `sub_140388200` to poll the inner coroutine result; checks return tag:
  - `0x8000000000000002` = Pending → sets all state bytes to 3 (yield), returns 1 (pending)
  - `0x8000000000000001` = Ready/Ok(result) → routes to result conversion via `sub_14105D150` + `sub_140882970`
  - Other (direct Ok) → calls `sub_140458520` to serialize the JSON response
- **IPC resolve path**: `sub_14085A490` (flush/cleanup) + `tauri_ipc_resolve_sys@0x140062230` with result struct.

### Settings Read

`get_usage_refresh_interval_core_read@0x1402dcbc0` → `get_usage_refresh_interval_repo_snapshot@0x1400f61a0`:
- Reads `*(_DWORD *)(repo + 144)` as the interval/tag field.
- Snapshots repo Arc fields at offsets 136, 152, 312, 320, 328, 336, 344, 352.
- Copies a 0x98-byte settings block (152 bytes) from repo into the coroutine frame.
- Returns the full snapshot including all proxy-config-adjacent fields.

Tag == 3 check: `if (*(_QWORD *)Dst != 3)` at 0x1408c4715 — if the stored proxy tag is 3 (no proxy / disabled), the coroutine skips the entire probe path, clears the proxy entry list, and resolves IPC immediately with empty/cleared result.

### TCP Probe Launch (`sub_140609490@0x140609490`)

Called as: `sub_140609490(a1_ptr, settings_ptr, settings_copy, &off_14128B728_or_off_14128B710)`:
- Reads proxy address from `settings_ptr[1]` + offset 704 (non-TLS) or 472 (TLS, detected via `*(_BYTE *)a2`).
- Acquires shared counter at `off_141882source archive8` via `_InterlockedExchangeAdd64`.
- Copies settings into a 0x180-byte heap-allocated coroutine struct (size=384, align=128).
- Calls `sub_140EAF5D0` to register the probe coroutine.
- If successful: calls `managed_state_register_sys` to register the running coroutine state.
- Two vtable/dispatch choices: `off_14128B728` (TLS/HTTPS path) or `off_14128B710` (HTTP path), selected based on `*((_DWORD *)v19 + 4) == 2` check.

### Env Proxy Detection (`detect_system_env_proxy_sys@0x140110a80`, size 0xe22)

Reads env vars in priority order:
1. `https_proxy` / `HTTPS_PROXY` (both cases)
2. `http_proxy` / `HTTP_PROXY` (both cases)
3. `all_proxy` / `ALL_PROXY` (both cases)

For each candidate:
- Filters out `127.0.0.1` (exact match on `0x2E302E302E373231LL` + byte `0x31`) and `localhost` (exact match on `0x6C6F63616C686F73LL` + byte `116`).
- Parses port from scheme: `http` → 80, `https` → 443, `ftp` → 21; or extracts explicit port from URL.
- TCP probe via `sub_141032F60` with 200ms timeout (`200000000` ns).
- On successful TCP connect: calls `apply_extra_headers_variant_b_sys@0x14010FF80` (applies additional headers to the validated proxy candidate).
- On all candidates exhausted without success: returns error string literal `"No reachable proxy configuration was detected from environment variables, system proxy, PAC, or common local addresses"` (118 bytes).

### Response Serialization (`sub_140458520@0x140458520`)

Builds JSON response object with fields:
- `schemaVersion` (field at `0x14127b499`)
- `success` (field `0x14127c95b`)
- `code` (field `0x14127c7ad`)
- `message` (field `0x14127c7b1`)
- `data` (field `0x14127c96a`) → nested object:
  - `found` (bool, field `0x14127c951`)
  - `mode` (string: `"manual"` or 
ull`, field `0x14127c94d`) — `mode==2` → 
ull`; `mode&1` → `"manual"`; else reads from `dword_14127C2F8`
  - `url` (Option<String>, field `0x14127c76f`)
  - `probe` (nested object, field `0x14127c956`)

On success: `*a1 = 0x8000000000000025uLL` (Ok with payload). On serialization error: `*a1 = 0x8000000000000005uLL`.

---

## DTO

**IPC input** (from JS frontend):
```
{
  "detect_api_proxy_config": {}   // no parameters; all config read from repository
}
```
(No JS-side parameters; the coroutine reads from `AppState` repository via `get_usage_refresh_interval_core_read`.)

**IPC output** (on success, tag != 3):
```json
{
  "schemaVersion": <u32>,
  "success": <bool>,
  "code": <string>,
  "message": <string>,
  "data": {
    "found": <bool>,
    "mode": <"manual" | null | string>,
    "url": <string | null>,
    "probe": { ... }
  }
}
```

**IPC output** (on success, tag == 3 — no proxy configured):
- Immediate resolve with cleared/empty proxy entry list; no data payload built.

**IPC output** (on probe error / no reachable proxy):
- Error string: `"No reachable proxy configuration was detected from environment variables, system proxy, PAC, or common local addresses"` (118 bytes).

---

## Side Effects

- **Settings read (no write)**: `get_usage_refresh_interval_core_read` snapshots the Repository's settings fields; no disk write from this command.
- **TCP socket probe**: `sub_141032F60` opens a TCP socket to the proxy address and connects with 200ms timeout; socket is closed (via `closesocket`/`sub_140177DE0`) after probe regardless of result.
- **Env var reads**: reads OS env vars `https_proxy`, `HTTPS_PROXY`, `http_proxy`, `HTTP_PROXY`, `all_proxy`, `ALL_PROXY` via `sub_1400A04E0`/`sub_1400B7C10`.
- **Coroutine registration**: `managed_state_register_sys@0x141208810` registers the TCP probe coroutine in Tauri managed state while probe is in-flight.
- **Waker management**: `sub_141208950`/`sub_141208970` manage async waker registration/release on resume.
- **Cleanup loop**: on tag==3 path, calls `sub_1400CA020` over each proxy entry (96-byte stride) and frees the entry list via `sub_140001370`.
- **IPC resolve**: `tauri_ipc_resolve_sys@0x140062230` delivers the response to the frontend WebView.
- **No disk write**: this command does NOT write settings to disk.

---

## Error Paths

| Stage | Condition | Behavior |
|---|---|---|
| tag == 3 (no proxy) | `*(_QWORD *)Dst == 3` | skip probe; cleanup entries; immediate IPC resolve (empty) |
| probe pending | `sub_140388200` returns `0x8000000000000002` | state bytes all set to 3; return 1 (Pending, yield) |
| probe error / no reachable proxy | `detect_system_env_proxy_sys` exhausts all candidates | error string `"No reachable proxy configuration was detected..."` (118B) |
| TCP connect timeout | `sub_141032F60` returns 0 (200ms exceeded) | socket closed; candidate skipped; try next |
| serialize error | `sub_140458520` returns `0x8000000000000005` | error propagated to IPC resolve |
| HexRays display panic | `sub_1412085B0` called from 0x1408source archive035 with `"a Display implementation returned an error unexpectedly"` (55B) | panic/unwind |
| waker release | state 1/2: `sub_141208950`/`sub_141208970` | standard waker lifecycle; falls through to state 3 path |

---

## Same-Side Gate (Win x64 api_proxy_config family)

4 functions confirmed on Windows side:
- `set_api_proxy_config_handler_sys` @ `0x140282340` (0x610 B) — write handler (synchronous)
- `api_proxy_config_write_core_sys` @ `0x14055C3A0` (0x2CB B) — write core
- `cmd_detect_api_proxy_config_coroutine_sys` @ `0x1408C45B0` (0xB22 B) — **this function** (detect, async)
- `cmd_test_api_proxy_config_coroutine_sys` @ `0x1408E8160` (0xCFE B) — test command (async coroutine)

Confirmed from `set_api_proxy_config` DISTILLED dim5 note. All 4 family members present on win side.

---

## Fake-Wall Taxonomy (all 7 branches ruled out)

| Branch | Status | Reason |
|---|---|---|
| drop_in_place / async shim | ruled out | 0xb22 body IS the full Tauri coroutine state machine; switch on a1[2528] state discriminant; real logic in all branches |
| architecture_only / budget | ruled out | Full decompile in one shot; no truncation; 2850 B manageable |
| async decompile failed | ruled out | HexRays fully decompiled; coroutine state machine visible |
| wrong VA / neighbor | ruled out | func_query by name regex confirms single hit `cmd_detect_api_proxy_config_coroutine_sys` at 0x1408c45b0 |
| vtable / dynamic dispatch | ruled out | Direct call chain; `sub_140609490` dispatch is direct; `off_14128B728`/`off_14128B710` are function pointer table entries (not polymorphic on unknown types) |
| HTTP-terminal | partially applicable for external probe result (external server response unknowable), but wrapper body fully reversed; not a blocking cap | |
| reqwest / library internal | ruled out | No reqwest; TCP probe is direct socket via `sub_141032F60` |

**genuine_ceiling**: false
**recovery_attempts**: N/A — no ceiling encountered; all 7 branches ruled out on first pass
