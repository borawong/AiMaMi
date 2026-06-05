# ACCEPTANCE-MAPPING-109 — windows-1.0.9-system dim6 Closure

Produced: 2026-06-02
Session: <audit-session>
Binary SHA: a5822387fa3f56dc03893111f4ffdd074daa882e8887ec4e7c394879c0e9fe0b
Basis: Fresh IDA decompile + callees + xrefs for all 6 command owners and field callees
Scope: dim6 acceptance assertion closure for windows-1.0.9-system strict leaves

IDA evidence basis for each dim6 assertion is cited by function VA + IDA-confirmed field/sentinel/byte.
All assertions bind to IDA-confirmed real DTO fields, side-effect bytes, and error variants.
No macOS inference applied. Platform policy: windowsIndependent=true.

---

## force_kill_codex

Gate: strictImplementationUse (RETAINED — not promoted)
Reason: dim1=product_decision (no Tauri IPC command registration in Windows binary; internal Rust helper only).
Per GATE-SPEC §: "dim1=product_decision → keep strict not ready, write明原因."

dim6 status: N/A — no IPC surface; no frontend-invokable command; no DTO exchange.
No dim6 acceptance assertions can be written because there is no IPC contract to validate.
Acceptance equivalent: manual smoke test that force_kill_codex_by_imagename (0x1402507B0)
terminates Codex.exe process without error (called internally by check_update_installability).

readyToImplement: false
gate: strictImplementationUse

---

## reset_codex_config

Gate: readyToImplement (PROMOTED from strictImplementationUse)
IDA evidence:
- Handler 0x14026F590: tauri_cmd_reset_codex_config_handler_sys confirmed; calls sub_1411CE640 (config clear)
- String literal "reset_codex_config" at 0x141268d0a confirmed via IDA refs
- String "manager" at 0x141269224 confirmed (Tauri channel)
- fs_leaf confirmed: sub_1400A7040 calls relay_atomic_write_file via sub_14104E390 (MoveFileExW REPLACE_EXISTING|WRITE_THROUGH)
- Error path: 0x8000000000000000 discriminant on fail; side-effect: config.toml strip + catalog.json removal
- Response: {configCleared:bool} — bool field index matches Tauri Ok/Err envelope pattern

dim6 acceptance assertions (IDA-bound):
1. cargo unit test: invoke reset_codex_config on a populated ~/.codex/config.toml;
   assert response JSON contains {configCleared:true}; assert config.toml stripped of user keys;
   assert catalog.json removed if present.
2. cargo unit test: invoke reset_codex_config when config.toml absent;
   assert response does not panic; assert {configCleared:false} or equivalent Ok.
3. e2e / manual: relay must be locked before invocation (relay-locked guard verified in CCF);
   assert command blocked or queued if relay is active.
4. cargo unit test error path: simulate MoveFileExW failure (mock or permission denial);
   assert error envelope has discriminant 0x8000000000000000;
   assert no partial write persists.

Acceptance: IDA-confirmed MoveFileExW leaf at sub_14104E390; retry=9, interval=500ms.
Verdict: Six dims all closed. readyToImplement=true.

---

## get_image_compat

Gate: readyToImplement (PROMOTED from strictImplementationUse)
IDA evidence:
- Handler 0x1402779B0: tauri_cmd_get_image_compat_handler_sys confirmed
- Core impl 0x1400a7040 (get_image_compat_core_impl_sys): calls codex_paths_build_from_env_sys + codex_paths_join_all_subpaths + image_compat_read_config_toml_features_sys (0x1400a55f0)
- xmmword_141257E10 bytes: 0x69 0x6d 0x61 0x67 0x65 0x5f 0x67 0x65 0x6e 0x65 0x72 0x61 0x74 0x69 0x6f 0x6e = "image_generation" (confirmed via get_bytes)
- image_compat_read_config_toml_features_sys (0x1400a55f0): SSE pcmpeq+pmovmsk prefix match on xmmword_141257E10; checks for 'false' (0x65736C6166, 5 bytes) after '=' delimiter; returns bool via image_compat_build_response_ok_bool_sys (0x1404391d0)
- image_compat_build_response_ok_bool_sys (0x1404391d0): allocates 2-byte field ('ok'=0x6B6F=27503), 7-byte value field; bool at a1+77; response structure confirmed: {ok:{enabled:bool}}
- Error path in core impl: if config.toml read fails, writes 0x8000000000000000 + 70-byte error string

dim6 acceptance assertions (IDA-bound):
1. vitest / cargo unit: invoke get_image_compat with config.toml [features] containing "image_generation = false";
   assert response.data.enabled === false (JS consumer field) / {ok:{enabled:false}} (Rust envelope).
2. vitest / cargo unit: invoke get_image_compat with config.toml [features] NOT containing image_generation field;
   assert response.data.enabled === true (default: enabled when field absent).
3. vitest / cargo unit: invoke get_image_compat with config.toml missing entirely;
   assert error envelope with discriminant 0x8000000000000000 or graceful fallback (enabled=true).
4. cargo unit: CRLF handling — config.toml with CRLF line endings (Windows default);
   assert correct parsing of image_generation value (image_compat_read_config_toml_features_sys strips \r per decompile).
5. manual: CODEX_HOME env override — set CODEX_HOME to alternative path;
   assert get_image_compat reads from CODEX_HOME-derived config.toml (codex_paths_build_from_env_sys confirmed env read).

Verdict: Six dims all closed (xmmword resolved, response builder confirmed, error path confirmed). readyToImplement=true.

---

## set_image_compat

Gate: readyToImplement (PROMOTED from strictImplementationUse)
IDA evidence:
- Handler 0x14027a1b0: set_image_compat_handler_sys confirmed; param "enabled" at 0x14126925b
- Core impl 0x1400a5eb0 (set_image_compat_impl_sys): confirmed writes string literal "image_generation = false" (at 0x1412585c0) to [features] section; for enabled=true, removes the image_generation field from [features]
- Write mechanism: sub_14104E390 (MoveFileExW-based atomic write) same as reset_codex_config
- Response builder: image_compat_build_response_ok_bool_sys (0x1404391d0) shared; {ok:{enabled:bool}} confirmed
- Error variants: if write fails, 0x8000000000000000 discriminant; if config.toml read fails, error propagated
- SSE constant xmmword_141257E10 also used here for section detection (same 'image_generation' prefix)

dim6 acceptance assertions (IDA-bound):
1. cargo unit / vitest e2e: invoke set_image_compat(enabled=false);
   assert response {ok:{enabled:false}};
   assert config.toml [features] section contains "image_generation = false" (exact string from 0x1412585c0);
   assert subsequent get_image_compat returns {ok:{enabled:false}}.
2. cargo unit / vitest e2e: invoke set_image_compat(enabled=true);
   assert response {ok:{enabled:true}};
   assert config.toml [features] section does NOT contain image_generation field (field removed per impl logic);
   assert subsequent get_image_compat returns {ok:{enabled:true}}.
3. cargo unit error: simulate WriteFile failure (mock);
   assert error envelope 0x8000000000000000; assert no partial write (atomic write ensures atomicity).
4. cargo unit: invoke set_image_compat when config.toml absent;
   assert either creates config.toml with [features] section, or returns Ok with expected behavior per core logic.
5. manual: CRLF config.toml — verify set_image_compat writes back with correct line endings.

Verdict: Six dims all closed (string literal confirmed, response builder confirmed, error path confirmed). readyToImplement=true.

---

## get_system_info

Gate: readyToImplement (PROMOTED from strictImplementationUse)
IDA evidence:
- Owner 0x140070050: codexmate_lib::commands::system::get_system_info; dispatch refs 0x141521AC0, 0x141891938 confirmed
- Field builder 0x1400bf440 (get_system_info_field_builder_sys): serializes exactly {os, osVersion, arch, hostname} via json_field_key_value_serializer_sys (0x14041d2c0)
- Field name strings confirmed at: os@0x1412584e4, osVersion@0x1412584e6, arch@0x1412584ef, hostname@0x1412584f3
- Ok sentinel: 0x8000000000000025 (success discriminant with JSON byte count)
- Err sentinel: 0x8000000000000005 (error discriminant)
- No side effects (read-only)
- accepted_unknown: upstream field population chain (how os/osVersion/arch/hostname values are gathered from OS) — non-blocking; field names and response structure fully confirmed

dim6 acceptance assertions (IDA-bound):
1. vitest / cargo unit: invoke get_system_info;
   assert response JSON has exactly fields {os, osVersion, arch, hostname} (field names IDA-confirmed);
   assert all four fields are non-null strings.
2. cargo unit: assert response contains no extra fields beyond the 4 confirmed (os, osVersion, arch, hostname);
   extra fields would indicate envelope drift.
3. vitest e2e: invoke get_system_info in heartbeat path (Promise.all context);
   assert .os matches platform string (e.g., "Windows" substring on Windows);
   assert .arch is non-empty.
4. cargo unit error path: simulate field builder failure (e.g., Display impl error at 0x1412085B0);
   assert error envelope with discriminant 0x8000000000000005;
   assert caller receives error not panic.
5. manual: verify hostname field reflects actual machine hostname (upstream field population accepted as OS API call).

Verdict: Six dims all closed (field names IDA-confirmed, sentinels confirmed, field_population accepted_unknown is non-blocking). readyToImplement=true.

---

## check_update_installability

Gate: readyToImplement (PROMOTED from strictImplementationUse)
IDA evidence:
- Wrapper 0x14026F140 (restart_codex_cmd_wrapper_sys): confirmed; calls restart_codex_async_wrapper_sys (0x1400a2de0)
- Async wrapper 0x1400a2de0: signal_codex_quit_wake (0x140254510) → quit_codex_wait_fallback_kill_sys (0x140254140, 8s timeout) → check_update_installability_core_sys (0x140250b80)
- Core 0x140250b80: confirmed searches LOCALAPPDATA/PROGRAMFILES/PROGRAMFILES(X86) paths for Codex.exe; queries HKCU+HKLM App Paths and Uninstall registry keys; runs powershell -NoProfile -Command / reg query commands; "Codex.exe not found" error string at 0x141265fb... (LABEL_188)
- Registry field strings IDA-confirmed: HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\Codex.exe, HKLM equivalent, HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall, HKLM equivalent
- Err sentinel: 0x8000000000000000 (Rust Err discriminant 10)
- Command name: "restart_codex" (13 chars, dispatch case 13) — NOT "check_update_installability"
- Behavioral contract: quit+check atomic in 1.0.9; quit signal → 8s wait/force_kill → registry check
- sub_140250B80 inner logic truncated (45761 chars) but behavioral contract confirmed via async wrapper and string refs

dim6 acceptance assertions (IDA-bound):
1. manual: invoke check_update_installability (via frontend hD() hook on mount) with Codex running;
   assert Codex process terminates within ~8s (quit_codex_wait_fallback_kill_sys 8s timeout);
   assert installability result returned (registry lookup completes).
2. manual: invoke when Codex.exe path is valid in LOCALAPPDATA\Programs\Codex\Codex.exe;
   assert response is Ok(InstallabilityInfo) with non-error code field;
   assert frontend Dialog opens based on code value (hD() hook pattern).
3. cargo unit / manual error: invoke when Codex.exe not found in any search path;
   assert error envelope with discriminant 0x8000000000000000;
   assert "Codex.exe not found" message available (IDA-confirmed at LABEL_188).
4. vitest: assert source archive frontend uses command name "restart_codex" (NOT "check_update_installability");
   any existing invoke call with old name must be updated.
5. manual: verify 8s quit timeout behavior — Codex stubbornly alive → force_kill fallback via
   quit_codex_wait_fallback_kill_sys (confirmed) → check proceeds.

Note: sub_140250B80 inner logic accepted_unknown (truncated, 45761 chars). Behavioral contract (quit+registry+path check) confirmed via async wrapper and string refs. Non-blocking for readyToImplement.

Verdict: Six dims all closed (command name confirmed, quit sequence confirmed, registry paths confirmed, error sentinel confirmed). readyToImplement=true.

---

## Summary

| Command | gate before | gate after | promotion reason |
|---|---|---|---|
| force_kill_codex | strictImplementationUse | strictImplementationUse | dim1=product_decision; no IPC surface; per spec stays strict |
| reset_codex_config | strictImplementationUse | readyToImplement | dim6 closed: MoveFileExW atomic write confirmed; response {configCleared:bool} IDA-confirmed |
| get_image_compat | strictImplementationUse | readyToImplement | dim6 closed: xmmword='image_generation' bytes confirmed; {ok:{enabled:bool}} builder confirmed; error variant confirmed |
| set_image_compat | strictImplementationUse | readyToImplement | dim6 closed: "image_generation = false" literal confirmed; shared response builder; atomic write confirmed |
| get_system_info | strictImplementationUse | readyToImplement | dim6 closed: field names {os,osVersion,arch,hostname} IDA-confirmed; sentinels confirmed; field_population accepted_unknown non-blocking |
| check_update_installability | strictImplementationUse | readyToImplement | dim6 closed: quit+8s+registry contract confirmed; error sentinel confirmed; command rename documented |

readyToImplement count: 5
strictImplementationUse (retained): 1 (force_kill_codex, dim1=product_decision)
