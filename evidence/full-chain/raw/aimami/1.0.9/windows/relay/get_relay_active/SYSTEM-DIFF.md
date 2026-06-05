# System Diff — get_relay_active (1.0.9 Windows)

## Platform Artifacts

| Platform | Binary | Status |
|---|---|---|
| Windows x64 | AiMaM 1.0.9 win64.exe (SHA a5822387fa3f) | Confirmed, IDA decompiled |
| macOS arm64 | Not evidenced in this pass | Unknown |

## Backend Commands / Call-tree / Interface

Command: `get_relay_active`
Owner: sub_140280810 (IDA: get_relay_active_owner_sys, A-grade)
Core reader: sub_14043B940 → sub_140147AB0 → reads bool @ relay_lock_struct+17
Active encoding: Ok tag=2, "ok"(2B)+"enabled"(7B) string pair — deserializes as data=true on frontend
WakeByAddressSingle: Windows futex-style lock release (external_call_recorded)
Response: {schemaVersion, success, code, message, data: bool}
Side effects: none (read-only)

## Gate Leaf

strictImplementationUse — Windows confirmed; macOS Unknown
