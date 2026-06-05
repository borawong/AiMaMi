# System Diff — load_relay_state (1.0.9 Windows)

## Platform Artifacts

| Platform | Binary | Status |
|---|---|---|
| Windows x64 | AiMaM 1.0.9 win64.exe (SHA a5822387fa3f) | Confirmed, IDA decompiled |
| macOS arm64 | Not evidenced in this pass | Unknown — must not infer from Windows |

## Frontend IPC / Control-flow

Not evidenced in this pass (Windows backend-only).
CCF row 112: wrapper `loadState`, args none — accepted_unknown (product decision).

## Backend Commands / Control-flow / Pseudocode / Call-tree / Leaf

Command: `load_relay_state`
Owner: sub_14027D660 (IDA renamed: load_relay_state_owner_sys, A-grade)
String bound: "load_relay_state" @ 0x141268FEB → data ref @ 0x14027D6E0
Call-tree depth: 4
Terminal leaves: external_call_recorded (tauri_ipc_resolve_sys), response_serialize, error_return

Core state reader: sub_14043BAA0
- Acquires RwLock: sub_140148EA0 + sub_140153300 + sub_1401BDED0
- Provider array stride: 208 bytes/entry; Duff device unroll for zero-fill
- Releases: sub_1401802B0
- Error serialize: sub_140464400; Ok pack: sub_140439740
- Response envelope: {schemaVersion, success, code, message, data}

## Interface / Error / Boundary (dim4 closed)

- Input: none (argKeys=[])
- Output: CoreEnvelope<RelayState> (Ok) or error envelope (Err)
- RelayState.providers: Vec<RelayProvider>, each 208 bytes
- Side effects: read-only
- Error boundary: auth guard failure → error envelope; JSON dispatch failure → error; core reader failure → sub_140464400 serializes error

## Gate Leaf

strictImplementationUse — Windows confirmed; macOS Unknown for this pass

## Unknown

- macOS platform: Unknown (must not infer from Windows)
- Frontend trigger path (CCF): accepted_unknown / product decision
- test/acceptance mapping (dim6): empty per task spec
- Exact JSON field names for RelayProvider (url/address naming)
