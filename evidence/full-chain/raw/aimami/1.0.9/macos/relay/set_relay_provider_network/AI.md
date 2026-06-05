# AI Handoff — set_relay_provider_network

status: strictImplementationUse
evidence_root: raw/aimami/1.0.9/macos/relay/set_relay_provider_network/
versions: 1.0.9
platforms: macos-arm64 (confirmed); Windows Unknown
session: relay-A-state-crud-20260602

owner_resolution_status: Accepted — dispatch closure 0x10031d8c8 → true owner 0x1001e28e4; core 0x1001c99d8 (RelayManager::set_provider_network, size=0x3fc)
note: Prior recon had owner as TBD/dispatch-only — NOW CORRECTED to 0x1001e28e4 (CORRECTED from seed)

frontend_ccf_status: Unknown (accepted_unknown)
backend_ccf_status: Accepted
pseudocode_status: Accepted — 0001 (true command owner at 0x1001e28e4)
call_tree_status: Accepted — depth=7; dispatch→owner→core→(memcmp_find|idempotent_return|field_write+timestamp+persist+breaker)
interface_status: Accepted — argKeys={providerId,network}; network=u8@+205; idempotent on same value
error_path_status: Accepted — provider_not_found, persist_IO, idempotent_early_return_documented
boundary_status: Accepted — macOS; Windows Unknown; no platform-specific OS APIs
gate_leaf_status: strictImplementationUse

key_implementation_facts:
  - dispatch closure at 0x10031d8c8: extracts RelayManager via StateManager::try_get, deserializes args
  - True owner: 0x1001e28e4 (hfd713d2139c85809), size ~0x2dc
  - IDEMPOTENT: if provider.network == new_network -> early return clone of existing (NO mutation)
  - network field: u8 at RelayProvider+205 (208-byte struct)
  - updated_at: i64 at RelayProvider+192 (chrono_ms = 1000*(days*86400+secs)+millis/1000000)
  - breaker::record_success (0x1001592a0): circuit breaker update — affects health scoring
  - NO keychain mutation (network change does not touch apiKey)
  - NO tray refresh
  - NO config.toml mutation (no sync_codex_config call)
  - persist: compose_proxy_status + serde_json + atomic_write(relay.json) + memmove(state+32, 0x128)
  - Response: CoreEnvelope<RelayProvider> (0x120=288 bytes) — updated provider

no_side_effects_confirmed:
  - no macOS Keychain interaction
  - no system tray update
  - no config.toml / Codex router entry mutation

unknowns:
  - frontend_ccf
  - Windows evidence
  - from_command::hdb947155c825df06 deserialization details (network enum values/names beyond 0=default)
