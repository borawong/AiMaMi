# AiMaM 1.0.9 Windows — relay::get_relay_proxy_status

同步时间: 2026-06-02
范围: backend call-chain (Windows x64 PE)
最终结论: strictImplementationUse — dim1-5 closed; dim6 empty per task spec

## 证据索引

| 文件 | 内容 |
|---|---|
| ida/pseudocode/0001_get_relay_proxy_status_owner_sys_h27dbf0.c | command owner pseudocode |
| ida/pseudocode/0002_get_relay_proxy_status_core_reader_h43f4f0.c | core reader + proxy struct reader (sub_140148BE0) |
| ida/pseudocode-manifest.jsonl | pseudocode index |
| call-trees/codexmate_lib::commands::relay::get_relay_proxy_status.jsonl | call-tree depth 4 |
| validation/result.json | gate result |

## Interface (dim4 closed)

**Command:** `get_relay_proxy_status`
**argKeys:** [] | **scope:** "manager"

**Response (Ok):** `{schemaVersion, success, code, message, data: ProxyStatus}`

**ProxyStatus struct (confirmed from sub_140148BE0 full decompile):**
```json
{
  "hasProxy": boolean,   // a1+74, bool u8: 1 if provider configured
  "port": number,        // a1+72, u16, from relay provider struct +0
  "url": string,         // a1+0..15 decoded via byte_14125B6 format
  "network": string      // a1+24..39 decoded via byte_14125BC38 format (RelayNetworkMode)
}
```

**Empty status (no providers):** hasProxy=false, port=0, url/network empty, sentinel @ +48
**Lock:** CAS at a2+16 + WakeByAddressSingle; reads provider count at a2+24
**Side effects:** read-only

## Gate Leaf

strictImplementationUse | dim4 closed | dim6 empty per task spec
