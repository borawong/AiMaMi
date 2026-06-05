# load_relay_state — AiMaMi 1.0.9 macOS Raw Leaf

**Produced**: 2026-06-02
**Session**: relay-A-state-crud-20260602
**Gate**: `strictImplementationUse` (macOS confirmed; Windows Unknown; dim6 empty)
**IDB SHA256**: 1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482
**SOT SHA256**: 985dae00be620b21164b4a8d35cc0379b750d5a6257b25897b0e813441e4d706

## Final Conclusion

load_relay_state is a Tauri IPC command that:
1. Auto-starts the relay proxy if not running (TCP probe → spawn)
2. Takes a snapshot of the current RelayState (clone under Mutex)
3. Scrubs all RelayProvider apiKey fields (byte offset +88, 208-byte entry) before returning
4. Returns the scrubbed RelayState as IPC response via CoreEnvelope::ok

**Security-critical**: apiKey zero-scrub is vectorized (4-at-a-time for >3 providers). upstream implementation must replicate this exact scrubbing logic.

## Evidence Index

| File | Content |
|------|---------|
| ida/pseudocode/0001_load_relay_state_owner_cmd_h8ced6f0.c | Decompiled command owner (IDA HexRays) |
| call-trees/codexmate_lib::commands::relay::load_relay_state.jsonl | Full call-tree (12 nodes, depth=6) |
| validation/result.json | Gate assessment dim1-5 |
| evidence.md | Prior session evidence summary |

## Coverage

| Dimension | Status |
|-----------|--------|
| frontend CCF | Unknown (accepted) |
| backend owner + pseudocode | Accepted |
| call-tree to impl leaf | Accepted (depth=6) |
| interface/DTO/error/side-effect | Accepted |
| platform gate | macOS confirmed; Windows Unknown |
| test/acceptance mapping | Empty (dim6 not required for strictImplementationUse) |

## Backend Control Flow / Pseudocode / Call-tree

```
load_relay_state (0x1001dff6c)
  ├─ ensure_proxy_started (0x1001c91c0) [SIDE-EFFECT: proxy TCP probe + optional storage::save]
  │    ├─ TcpStream::connect_timeout(127.0.0.1:port, 300ms, retry 50ms) [LEAF]
  │    └─ storage::save -> atomic_write::write_atomic(relay.json) [LEAF: if proxy newly started]
  ├─ RelayManager::snapshot (0x1001cfc44) [reads RelayState under Mutex]
  │    └─ RelayState::clone [LEAF]
  ├─ RelayState::clone (2nd — IPC copy) [LEAF]
  ├─ apiKey scrub loop — *(_QWORD*)(entry+88)=0 per 208-byte provider [LEAF: security scrub]
  ├─ CoreEnvelope::ok (0x1001d9e60) [LEAF: success response]
  └─ CoreError::fmt (error path) [LEAF]
```

## Interface / Error / Boundary

**Request**: No parameters.

**Response**: `RelayState` with apiKey fields zeroed:
- `providers`: Vec<RelayProvider> (apiKey@+88 scrubbed)
- `active`: Option<String>
- `grants`: Vec<GrantEntry>
- `proxyStatus`: ProxyStatus (fresh compose)
- `schemaVersion`: u32

**Errors**:
- `CoreError(proxy_start_fail)` — TCP probe fails
- `CoreError(storage_save_fail)` — relay.json write fails
- `unwrap_failed panic` — Mutex poisoned (exceptional)

**Side Effects**: proxy auto-start (TCP+spawn), file write (relay.json on proxy start), apiKey scrub in response

## Gate Leaf Status

`strictImplementationUse`: true
`readyToImplement`: false (missing frontend CCF, test/acceptance mapping)
`implementation_use`: false

## Unknown / Missing

- frontend_ccf: not analyzed — accepted_unknown
- Windows: no evidence — do not infer
- ensure_proxy_started spawn internals: out of scope for this leaf

## Action / Non-action

- **DO**: implement apiKey zero-scrub at exactly offset +88 per 208-byte RelayProvider entry
- **DO**: replicate ensure_proxy_started TCP probe (127.0.0.1, 300ms×2, 50ms sleep)
- **DO NOT**: return apiKey in any IPC response
- **DO NOT**: infer Windows behavior from macOS evidence
