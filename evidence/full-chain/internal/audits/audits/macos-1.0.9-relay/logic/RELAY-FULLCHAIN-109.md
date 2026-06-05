# RELAY-FULLCHAIN-109 — AiMaMi 1.0.9 macOS Relay Module Full-Chain Logic

**produced_at**: 2026-06-02
**binary_sha256**: 985dae00be620b21164b4a8d35cc0379b750d5a6257b25897b0e813441e4d706
**idb_sha256**: 1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482
**platform**: macos-arm64
**module**: relay (18 commands)

---

## Shared Architecture

All relay commands share a common pattern:
1. IPC deserialization layer (Tauri command dispatch, `from_command::*`)
2. `RelayManager` state extraction (global singleton, OnceBox-initialized, Mutex-guarded)
3. Core business logic in `codexmate_lib::core::relay::manager::RelayManager::*`
4. `RelayManager::persist` → `storage::save` → `atomic_write::write_atomic` for state persistence
5. `CoreEnvelope<T>::ok` or `CoreEnvelope<Err>` IPC response (discriminant 2=Ok, 0x8000000000000000=Err)
6. `RelayState` = central state struct (~300+ bytes): providers Vec<RelayProvider (208 bytes each)>, grants, active, schemaVersion, blockedOfficialPassthrough, proxyStatus

**apiKey scrub**: `RelayProvider.apiKey` at byte offset +88 in 208-byte structs is **zeroed before any IPC return** in `load_relay_state`. Not scrubbed on write — keychain is the secure store.

**Keychain**: macOS Security.framework via `keychain::set_api_key / get_api_key / delete_api_key`. Not portable to Windows without re-implementation.

**atomic_write pattern**: temp file (basename + pid + UUID) → write_all → sync_data → close → rename → sync_parent_dir → remove on failure.

---

## Command 1: load_relay_state (0x1001dff6c)

**Purpose**: Returns full RelayState with apiKeys scrubbed, auto-starts proxy if needed.

**Chain**: `load_relay_state` → `ensure_proxy_started` (TCP probe 127.0.0.1:port, 300ms×2, 50ms gap; spawns proxy if down; writes relay.json on new state) → `snapshot` → `RelayState::clone` → **apiKey scrub** (field +88 per 208-byte entry, vectorized loop) → `CoreEnvelope::ok`

**Request**: none
**Response**: RelayState (providers with apiKey scrubbed, active, grants, proxyStatus, schemaVersion)
**Error**: proxy start IO error → CoreEnvelope::Err; atomic_write fail → CoreEnvelope::Err
**Side effects**: proxy auto-start (TCP spawn), relay.json write if proxy newly started

---

## Command 2: get_relay_active (0x1001dfe4c)

**Purpose**: Returns list of currently active provider IDs.

**Chain**: `get_relay_active` → `RelayManager::get_active` (Mutex::lock → Vec<String>::clone of active_providers at state+56 → unlock) → IPC frame layout (d0=7, active field at a1+72..+88)

**ABI note**: `__usercall` with d0=7 return is IPC frame count, not a float. The recon "returns double" was a Hex-Rays artifact — resolved.

**Request**: none
**Response**: `{ active: Vec<String> }` — list of active provider IDs (or empty Vec if none/mutex poisoned)
**Error**: Mutex poisoned → empty Vec (not error envelope, graceful degradation)
**Side effects**: none (pure read)

---

## Command 3: get_relay_proxy_status (0x1001e2294)

**Purpose**: Returns current proxy liveness and address.

**Chain**: `get_relay_proxy_status` → `RelayManager::compose_proxy_status` (Mutex::lock → read proxy_running flag at v3+32 → if running: port = *u16(v3+40), format_inner("127.0.0.1:{}", port) + format_inner("{}", port) → unlock) → IPC response (ProxyStatus at a2+72..+160)

**Request**: none
**Response**: ProxyStatus `{ active: bool, port: u16, hostStr: "127.0.0.1:PORT" | "", portStr: "PORT" | "" }`
**Error**: Mutex poisoned → active=false, all empty (graceful degradation)
**Side effects**: none (pure read)

---

## Command 4: upsert_relay_provider (0x1001e19b4)

**Purpose**: Create or update a relay provider; writes to keychain and config.

**Chain**: `upsert_relay_provider` → `RelayManager::upsert` → [if INSERT: uuid::new_v4 → strip dashes → prefix format; if UPDATE: find by id via memcmp] → merge fields (url, transport, command, headers, environment, sensitive-field, blocked, enabled, name) → chrono::Utc::now → `keychain::set_api_key` (LEAF: macOS Keychain write) → `RelayManager::persist` → `storage::save` → `atomic_write::write_atomic` (LEAF: relay.json) → `sync_codex_config_with_outcome` → `codex_writer::apply_codex_state` (LEAF: config.toml) → `refresh_tray_menu` (LEAF: tray UI)

**RelayProvider struct** (208 bytes at offset from base):
- +0: id (String ptr+len)
- +88: apiKey/sensitive-field (scrubbed in load_relay_state reads)
- +145: enabled (u8: 0=inactive, 1=active, 2=force-active)
- +192: updated_at (i64 chrono_ms)
- +204: blocked (bool)
- +205: network (u8 enum)

**Request**: `{ providerId?: string (omit=INSERT), url, transport, command?, headers?, environment?, sensitive-field?, blocked?, enabled: u8, name? }`
**Response**: Upserted RelayProvider (288-byte CoreEnvelope payload, 0x120)
**Errors**: keychain write fail → CoreError; persist fail → CoreError; sync_codex fail → CoreError; Mutex poisoned → unwrap_failed panic
**Side effects**: macOS Keychain write, relay.json atomic write, config.toml mutation, tray refresh, in-memory state memmove

---

## Command 5: delete_relay_provider (0x1001e0afc)

**Purpose**: Delete a provider with pre-condition guards.

**Chain**: `delete_relay_provider` → `RelayManager::delete` → GUARD: read router-migration-manifest.json (`router_thread_migration_target_model`) → if provider is migration target: CoreError(9) → GUARD: if sole active grant member: CoreError(9) → Mutex::lock → Vec::retain (filter providers) → Vec::retain (filter grants) → `keychain::delete_api_key` (LEAF: Keychain delete, error non-fatal) → `persist` → `atomic_write` (LEAF: relay.json) → `sync_codex_config_with_outcome` → `remove_catalog` + `apply_codex_state` (LEAF: config.toml) → snapshot → SESSION GUARD (post-persist): read session files, if provider_id found in content → CoreError(9) → `refresh_tray_menu` (LEAF: tray UI)

**CRITICAL behavioral boundary**: session guard runs **after** persist. If session found active, state is already mutated (providers/grants removed, relay.json written). This is a post-commit guard with no rollback in upstream — source archive implementation must decide on compensation strategy.

**Request**: `{ providerId: string }`
**Response**: unit (discriminant=10) on success
**Errors**: CoreError(9) with various messages; CoreError::Io on fs failures
**Side effects**: relay.json write, config.toml write, catalog removal, keychain delete (non-fatal), tray refresh, in-memory memmove

---

## Command 6: set_relay_provider_network (0x1001e28e4)

**Purpose**: Update the network tier for a provider (idempotent if unchanged).

**Chain**: dispatch closure (0x10031d8c8) → `set_relay_provider_network` (0x1001e28e4) → `RelayManager::set_provider_network` → Mutex::lock → find provider (memcmp loop) → **early return** if network unchanged (clone existing, no persist) → write *u8(provider+205) = new_network (LEAF: in-memory) → chrono_ms → write *i64(provider+192) = timestamp (LEAF: in-memory) → `persist` → `atomic_write` (LEAF: relay.json) → `breaker::record_success` (LEAF: circuit breaker update) → `CoreEnvelope::ok(RelayProvider)`

**Request**: `{ providerId: string, network: u8 }`
**Response**: Updated RelayProvider (288 bytes)
**Errors**: provider not found → CoreError; persist IO → CoreError; idempotent → existing clone
**Side effects**: in-memory network+timestamp write, relay.json atomic write, circuit breaker success record; NO keychain, NO config.toml, NO tray refresh

---

## Command 7: activate_relay_provider (0x1001e23c8)

**Purpose**: Activate a provider for the current IDE context; starts proxy.

**Chain**: `activate_relay_provider` → `RelayManager::activate` → `snapshot` → `ensure_provider_loaded` (Mutex lock/unlock) → `ensure_proxy_started` (TCP probe → proxy spawn if needed) → `RelayActiveByIde::add` (add current IDE to active set) → `persist` (LEAF: config commit) → `sync_codex_config_with_outcome` (LEAF: config.toml)

**Multi-IDE tracking**: `RelayActiveByIde` tracks which IDEs have the provider active. Different from source archive implementation which uses single global activation.

**Request**: `{ providerId: string }`
**Response**: CoreEnvelope<RelayState> after activation
**Errors**: provider not found → CoreError; persist fail → CoreError
**Side effects**: proxy start, in-memory IDE set update, relay.json write, config.toml write

---

## Command 8: deactivate_relay_provider (0x1001e25a4)

**Purpose**: Deactivate provider for current IDE; stops proxy if no other IDEs hold it.

**Chain**: `deactivate_relay_provider` → `RelayManager::deactivate` → `RelayActiveByIde::remove` (Vec::retain, remove current IDE) → if no IDEs remain: stop proxy → `persist` → `sync_codex_config_with_outcome`

**Multi-IDE guard**: If other IDEs still hold the provider → CoreError(9) "Provider is still active in other IDE" (len=123). source archive implementation ignores multi-IDE tracking.

**Request**: `{ providerId: string }`
**Response**: CoreEnvelope<RelayState>
**Errors**: provider still active in other IDE → CoreError(9)
**Side effects**: IDE set update, possibly proxy stop, relay.json write, config.toml write

---

## Command 9: set_codex_router_enabled (0x1000df2d0)

**Purpose**: Enable/disable codex router; emits progress event; optionally relaunches.

**Chain**: async IPC closure (0x1000df2d0) → inner blocking closure (0x10032dfa0) → emit_js_filter('codex-router-toggle-progress') to all webview windows (LEAF: Tauri event) → write config.toml [router] block via RelayManager → `refresh_tray_menu` (LEAF: tray) → `CoreEnvelope::ok(CodexRouterTogglePayload)`

**config.toml safety**: router block uses block migration pattern — guaranteed coexistence with MCP block. Both write same config.toml.

**Request**: `{ enabled: bool, relaunch?: bool, app: AppHandle, manager: State<RelayManager> }`
**Response**: `{ enabled: bool, relaunch: bool }` (CodexRouterTogglePayload)
**Errors**: blocking task fail → CoreError; config write fail → CoreError
**Side effects**: Tauri JS event emit (codex-router-toggle-progress), config.toml [router] block write, tray refresh

---

## Command 10: test_relay_provider (0x1000f03ac)

**Purpose**: Health check for a saved provider; persists result.

**Chain**: async IPC closure → `build_test_request` (determines endpoint from model prefix: `claude-*` → `/v1/messages`, others → `/v1/chat/completions`) → `reqwest::Client::send` (**HTTP TERMINAL** — external_call_recorded; server behavior not provable statically) → `should_retry_test` (retry logic) → `apply_health_result` → `RelayManager::persist` (LEAF: state write with health result)

**HTTP terminal**: POST /v1/messages or /v1/chat/completions. Headers: x-api-field, anthropic-version: 2023-06-01, Content-Type: application/json, Authorization: Bearer (openai path).

**Request**: `{ providerId: string }`
**Response**: `CoreEnvelope<RelayTestResult>` — health score, latency, error info
**Errors**: provider not found; HTTP error (network/server)
**Side effects**: HTTP request to external server, health result persisted to relay.json

---

## Command 11: test_relay_draft (0x1000e7a90)

**Purpose**: Health check for an unsaved draft provider; does NOT persist result.

**Chain**: async IPC closure → `build_test_request` (same endpoint selection as test_relay_provider) → `reqwest::Client::send` (**HTTP TERMINAL**) — draft sentinel `__draft__` present in binary

**field difference from test_relay_provider**: No `apply_health_result`, no `persist`. Draft test is stateless.

**Request**: `{ manager, input: DraftTestInput { transport, command, headers, environments, sensitive-field } }`
**Response**: `CoreEnvelope<RelayTestResult>`
**Errors**: HTTP error (network/server)
**Side effects**: HTTP request only; no state written

---

## Command 12: fetch_relay_models_draft (0x100114ab0)

**Purpose**: Fetch available model list from draft provider's API endpoint.

**Chain**: async IPC closure → `parse_extra_headers` (0x100238b78) → `sanitize_api_key` (0x1002387ec) → `reqwest::Client::send` (**HTTP TERMINAL** GET /v1/models) → parse Vec<String>

**HTTP terminal**: GET /v1/models. Headers: x-api-field, Authorization: Bearer, Content-Type: application/json, plus parsed extra_headers from JSON field.

**Request**: `{ manager, input: FetchModelsInput }` (input likely contains url, api_key, extra_headers)
**Response**: `CoreEnvelope<Vec<String>>` — model ID strings
**Side effects**: HTTP GET to /v1/models; no state written

---

## Command 13: export_relay_config (0x1001e01c8)

**Purpose**: Export relay configuration to a JSON file; optionally includes API keys.

**Chain**: `export_relay_config` → `RelayManager::snapshot` → `io::export_to_file` → [per provider: if includeApiKey: `keychain::get_api_key`] → `chrono::Utc::now` → serialize RelayExportFile JSON → normalize extension (.aimami-relay.json) → `atomic_write::write_atomic` (LEAF: fs write) → if includeApiKey: `set_permissions(0o600)` (LEAF: chmod)

**Request**: `{ filePath: string, includeApiKey: bool }`
**Response**: `{ filePath, rewritten_to, providers_count, include_api_key }`
**Errors**: serialization fail → CoreError(9); IO fail → CoreError(9)
**Side effects**: file write (atomic), optional keychain reads, optional chmod 0600; NO relay.json mutation

---

## Command 14: import_relay_config (0x1001e0468)

**Purpose**: Import providers from a previously exported config file (append+deduplicate).

**Chain**: `import_relay_config` → `RelayManager::import_config` → `io::parse_import_file` → Mutex::lock → `RelayState::clone` → `io::apply_import_to_state` (merge providers) → `RelayManager::persist` → `atomic_write::write_atomic` (LEAF: relay.json) → if providers changed: `sync_codex_config_with_outcome` → `refresh_tray_menu` (LEAF: tray)

**Request**: `{ filePath: string }`
**Response**: `{ filePath, rewritten_to }`
**Errors**: parse fail; persist fail; sync fail (no rollback — source archive must handle)
**Side effects**: relay.json write, possibly config.toml, tray refresh

---

## Command 15: set_block_official_passthrough (0x1001e2source archive4)

**Purpose**: Set/unset the blockedOfficialPassthrough flag in RelayState.

**Chain**: `set_block_official_passthrough` → `RelayManager::set_block_official_passthrough` → Mutex::lock → write blocked:bool to state@offset+325 (blockedOfficialPassthrough field) → unlock → snapshot → `persist` → `atomic_write` (LEAF: relay.json with blockedOfficialPassthrough serialized at +292)

**RelayState field order in relay.json** (from storage::save serde sequence): providers, grants, active, schemaVersion(+288), blockedOfficialPassthrough(+292 bool), proxyStatus(+293 byte)

**Request**: `{ blocked: bool }`
**Response**: unit `CoreEnvelope<()>`
**Errors**: persist IO fail → CoreError
**Side effects**: relay.json write; NO config.toml mutation; NO codex process interaction

**source archive note**: Not yet in source archive commands/relay.rs — needs implementation.

---

## Command 16: get_passthrough_audit_log (0x1001e2780)

**Purpose**: Read recent entries from passthrough-audit.jsonl log.

**Chain**: `get_passthrough_audit_log` → `CodexPaths::resolve_codex_home` → `CodexPaths::from_home` → `passthrough_audit::read_recent_entries` → `Path::join(codex_home, "passthrough-audit.jsonl")` → `fs::read_to_string` (LEAF: fs read) → Vec::from_iter (parse JSONL, take last `limit` entries)

**File path**: `<codex_home>/passthrough-audit.jsonl`
**File-not-found**: returns Ok([]) (empty Vec, not error)

**Request**: `{ limit?: u64 }` (default: 50)
**Response**: `Vec<AuditEntry>` — JSONL entries. AuditEntry field schema accepted_unknown.
**Errors**: none (file-not-found = empty response, IO error = also may return empty)
**Side effects**: none (pure read)

**source archive note**: Not yet in source archive commands/relay.rs — needs implementation.

---

## Command 17: run_codex_router_diagnostics (0x1001e2ad4)

**Purpose**: Run full codex-router diagnostic suite.

**Chain**: `run_codex_router_diagnostics` → `CodexPaths::resolve_codex_home` → `RelayManager::snapshot` → `codex_diagnostic::run_diagnostics` (0x10054aa94) — **DECOMPILE TIMED OUT**; known from refs: builds HashMap<String, DiagStatus>, known status values "ok"/"medium", inputs are CodexPaths + RelayState snapshot

**Known issue keys** (from fix_issue cross-reference): "auth_integrity", "config_stale", "config_profile_conflict", "db_orphan_providers", "config_third_party", "config_omit_syntax", "catalog_path_validity"

**Request**: none
**Response**: DiagResult (exact schema accepted_unknown — HashMap<String, DiagStatus> inferred)
**Side effects**: none (read-only diagnostic run; no file writes)

**source archive note**: Implemented as `diagnose_codex_router` in source archive (different command name).

---

## Command 18: fix_codex_router_issue (0x1001e1b9c)

**Purpose**: Fix a specific diagnostic issue or all issues; may stop Codex process.

**Chain**: `fix_codex_router_issue` → `CodexPaths::resolve` → `snapshot` → dispatch on itemId byte comparison:
- `"all"` (len=3): `codex_diagnostic::fix_all` → run_diagnostics + per-issue fix_issue
- specific itemId: `codex_diagnostic::fix_issue` → match len/bytes:
  - "config_stale" (12): `fix_config_stale_text` (0x1005595bc) — accepted_unknown internals
  - "auth_integrity" (14): accepted_unknown
  - "config_third_party" (18): candidate (byte match 0x745F6769666E6F63+...)
  - "config_omit_syntax" (18): candidate
  - "db_orphan_providers" (19): accepted_unknown
  - "catalog_path_validity" (21): accepted_unknown
  - "config_profile_conflict" (23): accepted_unknown
- → if codex running (`is_process_running`): `stop_codex_app_gracefully` (LEAF: process kill)
- → `Ok(Vec<FixResult>)` (each entry = string-valued result, 61-char graceful-stop message confirmed)

**Request**: `{ itemId: "all" | <known_key> }` (arg field is itemId, NOT issueKey)
**Response**: `Vec<FixResult>` — each FixResult is a string-valued result
**Errors**: fix function errors → CoreError propagated
**Side effects**: may stop Codex process, may rewrite config files (fix_config_stale_text, resync_codex_config); takes snapshot, no mutex held in command layer
