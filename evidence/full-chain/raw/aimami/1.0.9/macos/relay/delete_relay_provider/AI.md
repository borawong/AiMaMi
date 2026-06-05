# AI Handoff — delete_relay_provider

status: strictImplementationUse
evidence_root: raw/aimami/1.0.9/macos/relay/delete_relay_provider/
versions: 1.0.9
platforms: macos-arm64 (confirmed); Windows Unknown
session: relay-A-state-crud-20260602

owner_resolution_status: Accepted — 0x1001e0afc (wrapper); core 0x1001cd5f8 (RelayManager::delete, size=0xb58)

frontend_ccf_status: Unknown (accepted_unknown)
backend_ccf_status: Accepted
pseudocode_status: Accepted — 0001 (command owner wrapper)
call_tree_status: Accepted — depth=8+; multiple terminal leaves including CRITICAL post-persist session guard
interface_status: Accepted — argKeys={managerId, providerId}; 5 distinct CoreError(9) codes
error_path_status: Accepted — all guards documented with exact error messages
boundary_status: Accepted — macOS; Windows Unknown; keychain macOS-specific
gate_leaf_status: strictImplementationUse

CRITICAL_ORDERING_BUG:
  The session guard check (depth=8) fires AFTER persist has already written to relay.json.
  If active sessions are found, the state is already mutated (provider removed from file).
  upstream implementation MUST either:
  a) Move session check BEFORE persist (pre-validate)
  b) Implement compensation/rollback logic on session-found case
  This is a known behavioral boundary in the upstream implementation.

key_implementation_facts:
  - Guard 1 (router_migration): reads router-migration-manifest.json; provider==migration_target -> CoreError(9)
  - Guard 2 (grant): provider is active AND sole grant member -> CoreError(9)
  - Both guards fire BEFORE any mutation
  - keychain::delete_api_key (0x10015a6b8): NON-FATAL (error logged, execution continues)
  - persist: relay.json write + memmove(state+32, 0x128)
  - Vec<RelayProvider>::retain + Vec<GrantEntry>::retain (both filtered atomically under lock)
  - Session guard: fs::metadata + fs::read_to_string session files + string search for provider_id
  - Success: CoreEnvelope::ok(discriminant=10, unit response)
  - Tray refresh only on success path
  - IPC args: a3={capacity, ptr, len} *const &str triple

error_codes:
  - CoreError(9, "provider is active router migration target")
  - CoreError(9, "cannot delete last active provider with grants" or similar ~135 bytes)
  - CoreError(9, "provider '{id}' not found in active state")
  - CoreError(9, "provider '{id}' has active sessions") [POST-PERSIST — compensation needed]
  - CoreError(2=Io, fs read error during session check)

unknowns:
  - frontend_ccf
  - Windows: keychain::delete_api_key uses macOS Security.framework
  - RelayManager::delete full core (size=0xb58) not fully decompiled
