# delete_relay_provider — AiMaMi 1.0.9 macOS Raw Leaf

**Produced**: 2026-06-02 | **Session**: relay-A-state-crud-20260602
**Gate**: `strictImplementationUse` (macOS; Windows Unknown)

## CRITICAL: Post-Persist Session Guard

The session guard check (fires at call-tree depth=8) executes **AFTER** `relay.json` has already been written. If active sessions are found, state is already mutated. upstream must either pre-check sessions or implement compensation rollback.

## Guard Chain (pre-mutation)

1. **Router migration guard**: reads `router-migration-manifest.json` — blocks if provider is current migration target
2. **Grant guard**: blocks if provider is active AND sole grant member

## Mutation Sequence

1. `Vec<RelayProvider>::retain` (remove provider)
2. `Vec<GrantEntry>::retain` (remove grants)
3. `keychain::delete_api_key` (**NON-FATAL** — error logged, continues)
4. `persist` → `relay.json` atomic write + `memmove(state+32, 0x128)` ← **STATE COMMITTED HERE**
5. `sync_codex_config` → catalog remove + `apply_codex_state(config.toml)`
6. **Session guard** ← **FIRES AFTER COMMIT** (consistency gap)
7. `refresh_tray_menu` (success path only)

## argKeys

`managerId(String)`, `providerId(String)`

## Error Codes (all CoreError(9))

| Code | Message |
|------|---------|
| 9 | "provider is active router migration target" |
| 9 | "cannot delete last active provider..." |
| 9 | "provider '{id}' not found in active state" |
| 9 | "provider '{id}' has active sessions" [POST-COMMIT] |
| 2 | CoreError::Io (fs read session check fail) |

## Gate: strictImplementationUse=true | readyToImplement=false
