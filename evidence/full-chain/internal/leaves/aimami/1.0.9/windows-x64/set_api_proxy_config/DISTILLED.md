# DISTILLED (canonical) — set_api_proxy_config (Win x64 1.0.9)

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
**owner_va**: 0x140282340
**owner_name**: set_api_proxy_config_handler_sys
**owner_size**: 0x610 (1552 B)
**callees_count**: 14 (all internal)
**gate_tier**: strictImplementationUse
**real_body_found**: true
**genuine_ceiling**: false
**block_decomposed**: false
**accepted_unknown**: false
**recovery_attempts**: N/A — no fake-wall encountered; all 7 taxonomy branches ruled out (sync handler, complete decompile, confirmed VA, no vtable, no HTTP, no async)
**caller_disambiguation_tried**: false (no ICF ambiguity; unique named handler)
**dim1_frontend_ccf**: not_verified (win-side frontend lane gap; does not block strictImplementationUse)
**dim2_body**: closed — full decompile at 0x140282340; synchronous IPC handler; params: repo(4B) + mode(4B) + url(3B)
**dim3_callees_xrefs**: closed — 14 callees enumerated; xrefs: dispatched from auto_switch_multiplex_dispatcher_sys@0x1402663e0 + 2 data refs
**dim4_dto_error_side_effects**: closed — see below
**dim5_same_side_gate**: closed — 4 api_proxy_config-family functions verified on win side (handler + write_core + detect_coroutine + test_coroutine)

---

## Behavior

`set_api_proxy_config` is a **synchronous IPC handler** (no async state machine). It receives a serialized IPC envelope containing three params: `repo` (4B discriminant — identifies the CodexMate settings repository), `mode` (4B u8 enum — proxy mode), and `url` (3B Option<String> — proxy URL).

Dispatch: called from `auto_switch_multiplex_dispatcher_sys@0x1402663e0` (size 0x4F1F), confirmed by xref at `0x1402694b2`. Two data-section refs at `0x14157BC9C` and `0x1418A7C70` (vtable/jump-table entries).

### Parameter extraction (handler layer)

- **repo**: extracted via `sub_1400DA7C0` — reads a lock/ref-count integer from `Dst[64]+16`; returns 0 on success, non-zero on error. `sub_1411CE640` then deserializes the repo discriminant (string "repo", len=4) from the IPC envelope. On error (LOBYTE != 6): resolves IPC with error envelope and returns early.
- **mode**: extracted via `sub_14045FAA0` — calls `import_remote_device_secret_arg_validator_sys` (generic IPC arg validator, reused across commands) then reads `BYTE1(v35[0])` as u8 mode enum. On error (LOBYTE != 6): resolves IPC with error envelope and returns early. String field: "mode" (len=4).
- **url**: extracted via `sub_140461E20` — deserializes optional URL string. On error (LOBYTE != 6): resolves IPC with error envelope and returns early. String field: "url" (len=3).

### Core write path (sub_1400A7680 → api_proxy_config_write_core_sys@0x14055C3A0)

`sub_1400A7680` is a **mutex/lock wrapper** around the write core:
- Calls `_InterlockedCompareExchange8(a2, 1, 0)` — CAS on the lock byte; if already locked (contended), calls `sub_141206A60` (park/wait).
- Checks `off_141882E30` global flag (2× deref); if set, calls `sub_1412077A0` (thread state query).
- On lock acquired: calls `sub_14106D750` (poisoned-lock check — panics with "poisoned lock: another task failed inside" if lock was poisoned; identical string to Rust `std::sync::Mutex` poison detection).
- Wakes waiters via `WakeByAddressSingle` (Windows futex-equivalent) on exit.

`api_proxy_config_write_core_sys@0x14055C3A0` (size 0x2CB, 715 B):
1. Stores the mode byte at `v34.m256i_i8[24]` and URL bytes at `*(_OWORD *)v34.m256i_i8`.
2. Calls `sub_14010FA90(&Dst)` — reads current CodexMateSettings state from repository (Dst = discriminant 10 on success).
3. If read succeeds (Dst == 10): calls `settings_deserialize_usage_refresh@0x1405532D0` to deserialize the existing settings, then calls `settings_serialize_remote_device_secret_and_save_sys@0x140553A90` to re-serialize with the new proxy config and save.
4. On serialize success: calls `sub_140438740` (builds the success result struct — writes literal bytes `0x6BAF` = "o{" preamble + `0x6765747265636964` = ASCII "direcret" — confirms JSON result building). Then calls `sub_14005B530` (cleanup). Returns OK Result.
5. On any error: propagates error Result via `0x8000000000000000` sentinel and early return.

### Settings deserialization (settings_deserialize_usage_refresh@0x1405532D0, size 0x609)

Reads settings JSON from `a2+584` / `a2+592` (repo path ptrs). Deserializes the `CodexMateSettings` struct with fields:
- `hotspot` (offset +144)
- `usageRefreshInterval` (offset +16)
- `deviceId` (offset +64)
- `remoteDeviceSecret` (offset +88)
- 
otificationsSince` (offset 0)
- `apiProxy` (offset +112)
- `mysteryUnlockGrants` / `mysteryUnlockedRoutes` (offset +40)
- `route` / `expiresAtMs` (additional)

Parses via `sub_140472590` with 7-field schema including `"apiProxy"` field. Handles `mysteryUnlockedRoutes` variants (discriminant 0–5: None/Some with string/string-copy/alloc-copy/vec/other).

### Settings serialization (settings_serialize_remote_device_secret_and_save_sys@0x140553A90, size 0x267)

Serializes 7 JSON fields in order: `hotspot`, `usageRefreshInterval`, `deviceId`, `remoteDeviceSecret`, 
otificationsSince`, `apiProxy`, `mysteryRouteGrant`/`route`/`expiresAtMs`. Writes JSON to a 128-byte heap buffer (`sub_140001360(128,1)`) with `{` prefix. Calls `sub_140336350(a2+576, v16)` as the **final disk write** — writes serialized JSON to settings store at repo+576 offset. Returns discriminant 10 on success, 2 on lock error, 3 on serialize error.

### IPC resolution

On any param extraction failure or core write failure: `tauri_ipc_resolve_sys@0x140062230` is called with the error envelope (discriminant + error payload from `sub_1411CE640`/`sub_14045FAA0`/`sub_140461E20`).
On success: result struct with `Srca[0]=1` passed to `tauri_ipc_resolve_sys`.

---

## DTO

**IPC input** (from JS frontend):
```
{
  "repo": <u32 discriminant>,   // which CodexMate settings repo to write
  "mode": <u8 enum>,            // proxy mode (at least 5 variants from deserialize switch: 0=None/direct, 1-5=various proxy modes)
  "url": <Option<String>>       // proxy URL, optional
}
```

**IPC output** (on success):
- Discriminant 1 + success result struct (built by `sub_140438740`)
- Result struct contains: literal 2-byte preamble `0x6BAF` + 7-byte literal `0x6765747265636964`

**IPC output** (on error):
- Error envelope from param extractor or write core (discriminant 6 + error byte from validator, or Result::Err from write core)

---

## Side Effects

- **Disk write**: `sub_140336350(repo+576, json_buf)` — writes updated `CodexMateSettings` JSON to disk (settings file at repo+576 path). Modifies `apiProxy` field (and potentially other fields due to full re-serialize cycle).
- **Full re-serialize**: the entire `CodexMateSettings` struct is read, modified (proxy fields updated), then completely re-serialized and written. This means a `set_api_proxy_config` call overwrites all 7 settings fields, not just `apiProxy`.
- **Mutex side effect**: acquires and releases the settings repo mutex (`_InterlockedCompareExchange8` CAS lock); wakes any waiting threads via `WakeByAddressSingle`.
- **No relay TOML write**: this command writes `~/.codex/`-side `CodexMateSettings` JSON only. The relay `config.toml` is NOT touched by this command.
- **No network call**: pure local settings write; no HTTP/IPC to relay or upstream.

---

## Error Paths

| Stage | Condition | Behavior |
|---|---|---|
| repo extraction | `sub_1400DA7C0` returns non-zero | `sub_1411CE640` runs; if LOBYTE(v36[0]) != 6 → early `tauri_ipc_resolve_sys` with error |
| mode extraction | `sub_14045FAA0` LOBYTE(v35[0]) != 6 | early `tauri_ipc_resolve_sys` with error |
| url extraction | `sub_140461E20` LOBYTE != 6 | early `tauri_ipc_resolve_sys` with error |
| settings read | `sub_14010FA90` Dst != 10 | api_proxy_config_write_core_sys returns Err Result |
| settings deserialize | `sub_140262F50` returns 6 | returns Err path via `sub_140170150` |
| settings serialize | `sub_1404182F0` / `sub_140419670` / `sub_140418D20` / `sub_14041C6A0` return error | if v17 (buf len) set → free buf; `*a1=3` (serialize error) |
| disk write | `sub_140336350` returns error | `*a1=2` (write error) |
| lock contended | `_InterlockedCompareExchange8` fails CAS | calls `sub_141206A60` (park/wait loop) |
| lock poisoned | `sub_14106D750` detects poison | panics with "poisoned lock: another task failed inside" |

---

## Same-Side Gate (Win x64 api_proxy_config family)

4 functions confirmed on Windows side:
- `set_api_proxy_config_handler_sys` @ `0x140282340` (0x610B) — this handler (write)
- `api_proxy_config_write_core_sys` @ `0x14055C3A0` (0x2CB B) — write core
- `cmd_detect_api_proxy_config_coroutine_sys` @ `0x1408C45B0` (0xB22 B) — detect command (async coroutine)
- `cmd_test_api_proxy_config_coroutine_sys` @ `0x1408E8160` (0xCFE B) — test command (async coroutine)

The detect and test coroutines are separate async paths not exercised by `set_api_proxy_config`. The write path is fully synchronous.

---

## Fake-Wall Taxonomy (all 7 branches ruled out)

| Branch | Status | Reason |
|---|---|---|
| drop_in_place / async shim | ruled out | Synchronous handler; no async state machine; full body decompiled |
| architecture_only / budget | ruled out | 0x610B; complete decompile in one shot; no truncation |
| async decompile failed | ruled out | Not async; HexRays succeeded fully |
| wrong VA / neighbor | ruled out | func_query confirmed owner name `set_api_proxy_config_handler_sys`, has_type=true |
| vtable / dynamic dispatch | ruled out | Direct call chain; no trait objects in write path |
| HTTP-terminal | ruled out | Pure local disk write; no network calls |
| reqwest / library internal | ruled out | No network transport |

**genuine_ceiling**: false
**recovery_attempts**: N/A — no ceiling encountered
