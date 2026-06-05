# System Diff — set_block_official_passthrough (windows-x64 vs macOS)

## Platform Artifacts

- **Windows**: AiMaM 1.0.9 win64.exe (PE stripped, x64)
- **macOS**: Not analyzed this session

## Frontend IPC / Control-flow

- Windows: NOT COVERED
- macOS: Not analyzed

## Backend Commands / Control-flow / Pseudocode / Call-tree / Leaf

### Windows

| Item | Value |
|---|---|
| Owner pattern | Inline in dispatcher@0x1402663e0, case@0x140266cf5 (ICF folded) |
| Write helper | set_block_official_passthrough_write_sys@0x140440370 |
| Atomic leaf | relay_state_block_passthrough_atomic_write_sys@0x14014DD10 |
| State mutation | v4[317] = blocked_bool |
| Lock | _InterlockedCompareExchange8 on relay_state+16; WakeByAddressSingle |
| Persist | sub_1401523E0 → config.toml |

### macOS

- Not analyzed; do not infer

## Interface / Error / Boundary

- Args: manager(internal handle), blocked(bool)
- Relay state struct: offset +16 = lock byte (atomic), offset +317 = blockOfficialPassthrough bool
- config.toml field: blockOfficialPassthrough = true|false
- Panic string: "relay state poisoned" @ 0x14125D823

## Gate Leaf

- Windows: strictImplementationUse
- macOS: Unknown

## Resource / Binary Surface

- String "set_block_official_passthrough" @ 0x1412690DC
- String "blocked" @ 0x1412692B5
- String "relay state poisoned" @ 0x14125D823
- String "passthrough blocked but no active relay provider" (router rejection string, in relay strings pool)

## Unknown

- macOS behavior (not analyzed)
- Full relay state struct layout beyond +16 and +317
