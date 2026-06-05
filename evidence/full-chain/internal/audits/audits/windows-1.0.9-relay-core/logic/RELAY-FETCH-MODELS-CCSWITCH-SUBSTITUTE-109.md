# RELAY-FETCH-MODELS-CCSWITCH-SUBSTITUTE-109 — Windows x64

**session**: <audit-session>
**machine**: <workstation>
**produced_at**: 2026-06-03  
**scope**: aimami/1.0.9/windows-x64/relay-core · relay_fetch_models  
**gate_tier**: strictImplementationUse (startMode=product_decision)  
**not_upstream_strict_parity**: true  
**readyToImplement**: false  
**implementation_use**: false  

---

## 背景

Windows `relay_fetch_models` 的 `fetch_async` + `fetch_openai_async` async poll bodies 同样 ICF-merged，未作独立 decompile（`dim2_backend_owner_pseudocode=closed_10_of_12`，2 叶 blocked）。该 ICF 模式与 macOS 等价（独立于 macOS ICF 的具体 VA，Windows async 终端同样无独立符号入口）。

本文件记录与 macOS 同口径的 cc-switch product_decision 替代，用于 Windows relay_fetch_models 的 `consumerStartReady.startMode=product_decision` 开工依据。Windows 平台 gate 完全独立于 macOS，本文件不引用 macOS VA 或 macOS 证据作为 Windows 实现依据。

---

## cc-switch 来源 (ccswitch-ref-109 研究)

与 macOS 替代文件同一来源；cc-switch 本身无平台区分（纯 Rust 跨平台库代码）。

### A. 主请求逻辑 — `services/model_fetch.rs:53-118`

| 行范围 | 内容 |
|--------|------|
| 53-118 | `async fn fetch_models(base_url, api_key, is_full_url, models_url_override)` |

关键行为（与 macOS 文件相同，此处不重复，以 macOS 文件为主）：
- GET `/v1/models` + Bearer header + 15s timeout + parse `data[].id` + 404/405 continue

### B. 异步转发结构等价 — `proxy/forwarder.rs:275-913`

Windows AiMaMi `fetch_async`/`fetch_openai_async` 与 macOS 同属 ICF-merged 模式；cc-switch `forward_with_retry_inner`（行 315-913）作为 async forward + retry + breaker 结构参考，与 Windows ICF-folded terminals 结构等价。

---

## Windows 与 macOS 的已知平台差异（relay_fetch_models 范围）

| 维度 | Windows relay_fetch_models | macOS relay_fetch_models |
|------|---------------------------|--------------------------|
| 10/12 decompiled leaves | parse_model_ids / parse_extra_headers / build_url_normalize / classify_error / is_transient_request_error / strip_v1_suffix / apply_extra_headers_openai / build_openai_headers_authorization / keychain_get_api_key (dual-use) / is_transient_error | 类似，7/7 leaves (outer logic) |
| Blocked 2 leaves | fetch_async + fetch_openai_async poll bodies ICF-merged | 同，ICF-folded into respond_async_serialized_inner@0x100114ab0 |
| dim6 | missing | missing |

**Windows gate 独立于 macOS**：Windows ICF 证据不能从 macOS ICF 外推，也不能反向。本文件仅作 product_decision substitute，不声明 Windows 与 macOS 实现完全相同。

---

## AiMaMi Windows 已知 leaves（product_decision 外无需再引用 cc-switch）

以下 Windows 证据已直接由 IDA 确认，不依赖 cc-switch：

- `parse_model_ids` VA 0x140113100
- `parse_extra_headers` VA 0x1401134F0
- `build_url_normalize` VA 0x140113280
- `classify_error` VA 0x140431D00
- `apply_extra_headers_openai` VA 0x14010EFC0
- `build_openai_headers_authorization` VA 0x1401AD5A0
- `keychain_get_api_key` VA 0x140571180 (relay_manager dual-use)
- Retry: `is_transient_request_error` 名确认

ICF-blocked leaves (仅 cc-switch product_decision 覆盖)：
- `fetch_async` poll body
- `fetch_openai_async` poll body / HTTP terminal

---

## product_decision 验收条件（Windows）

与 macOS 同等条件（见 macOS 文件），另加：

1. Windows Keychain 路径：SHA256(USER+USERNAME+provider_id) + CredentialManager（独立于 macOS Keychain Services）
2. Windows 无 macOS 的 `sanitize_api_key` 等特定 helper；source archive 实现应以 Windows IDA 证据为准
3. `is_transient_request_error` 名已确认（Windows IDA）；与 macOS `is_transient_error` 逻辑等价但独立验证
4. 输出 `CoreEnvelope<Vec<String>>`（model ids），不依赖 cc-switch `owned_by`

---

## gate 标注

```
cluster: relay_fetch_models (windows-x64)
gate: strictImplementationUse
startMode: product_decision
strictImplementationUse: true (档位上限，非 readyToImplement)
not_upstream_strict_parity: true
readyToImplement: false
implementation_use: false
```

---

## 证据路径

| 来源 | 路径 |
|------|------|
| AiMaMi IDA (windows) | `raw/aimami/1.0.9/windows/relay-core/relay_fetch_models/` |
| AiMaMi gate-report | `<source-location>/audits/windows-1.0.9-relay-core/gate-report.json` (cluster relay_fetch_models) |
| cc-switch model_fetch | cc-switch-main `src-tauri/src/services/model_fetch.rs:53-118` |
| cc-switch forwarder | cc-switch-main `src-tauri/src/proxy/forwarder.rs:275-913` |
| macOS substitute (同口径) | `<source-location>/audits/macos-1.0.9-relay-core/logic/RELAY-FETCH-MODELS-CCSWITCH-SUBSTITUTE-109.md` |
