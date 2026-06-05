# System Diff — get_relay_proxy_status (1.0.9 Windows)

## Platform Artifacts

| Platform | Binary | Status |
|---|---|---|
| Windows x64 | AiMaM 1.0.9 win64.exe (SHA a5822387fa3f) | Confirmed, IDA decompiled |
| macOS arm64 | Not evidenced in this pass | Unknown |

## Backend / Call-tree / Interface

Command: `get_relay_proxy_status`
Owner: sub_14027DBF0 (IDA: get_relay_proxy_status_owner_sys, A-grade)
Core chain: sub_14043F4F0 → sub_140148BE0 (full proxy struct reader)
Lock: _InterlockedCompareExchange8 + WakeByAddressSingle (CAS-based, external_call_recorded)
Provider count check at v2+24; port u16 at provider+0; has_proxy bool at output+74
URL encoding via byte_14125B6 format; network via byte_14125BC38
ProxyStatus: {hasProxy: bool, port: u16, url: string, network: string}
Side effects: none

## Gate Leaf

strictImplementationUse — Windows confirmed; macOS Unknown
