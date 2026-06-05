# RELAY-FETCH-MODELS-CCSWITCH-SUBSTITUTE-109 — macOS

**session**: <audit-session>
**machine**: <workstation>
**produced_at**: 2026-06-03  
**scope**: aimami/1.0.9/macos/relay-core · relay_fetch_models  
**gate_tier**: strictImplementationUse (startMode=product_decision)  
**not_upstream_strict_parity**: true  
**readyToImplement**: false  
**implementation_use**: false  

---

## 背景

`relay_fetch_models` 的两个异步叶子 `fetch_async` 与 `fetch_openai_async` 的 poll body 经 ICF 折叠进入 `respond_async_serialized_inner@0x100114ab0`（0x1b7c bytes），无独立 IDA decompile 入口，按现有口径为 `accepted_unknown`。这阻塞了 `full_leaf_100_definition_v2` 第三维（callees 到 HTTP terminal leaf），导致 `readyToImplement` 被禁。

本文件记录以 cc-switch (`ccswitch-ref-109`) 来源作为 **product_decision 替代**——即 source archive 可参考 cc-switch 开工，但这不是 upstream strict parity，不提升到 `strictImplementationUse` 档位，仅作为 `consumerStartReady.startMode=product_decision` 的开工依据。

---

## cc-switch 来源 (ccswitch-ref-109 研究)

### A. 主请求逻辑 — `services/model_fetch.rs:53-118`

文件路径（本机）：`<source-location>/local-archive bundleGame/Code/tmp/cc-switch-main/src-tauri/src/services/model_fetch.rs`

| 行范围 | 内容 |
|--------|------|
| 53-118 | `async fn fetch_models(base_url, api_key, is_full_url, models_url_override)` |

关键行为：
- GET `{base_url}/v1/models`（候选 URL 列表，最多 3 条，含 strip compat suffix 逻辑）
- Header: `Authorization: Bearer {api_key}` — 单一 Bearer 头；注意 AiMaMi 有 Anthropic / OpenAI 两个路径（见下文 AiMaMi 差异）
- Timeout: `Duration::from_secs(15)` (FETCH_TIMEOUT_SECS = 15)
- 响应解析: `data[*].id` → `Vec<String>` (cc-switch 返回 `Vec<FetchedModel>`; AiMaMi 输出 `CoreEnvelope<Vec<String>>` 即仅 id)
- 404/405 → `continue` (cc-switch 行 104-108); 其他非成功状态 → 立即返回错误
- 无 retry loop（cc-switch 无重试；AiMaMi 有 `is_transient_error` retry，见下文差异）
- 无 Anthropic-specific header（cc-switch 仅 Bearer；AiMaMi 有 x-api-field + anthropic-version:2023-06-01 路径）

### B. 异步转发结构等价 — `proxy/forwarder.rs:275-913`

文件路径（本机）：`<source-location>/local-archive bundleGame/Code/tmp/cc-switch-main/src-tauri/src/proxy/forwarder.rs`

| 行范围 | 内容 |
|--------|------|
| 275-303 | `forward_with_retry` — thin wrapper，active connection guard，计数 |
| 315-913 | `forward_with_retry_inner` — retry+breaker 主体，Provider 列表顺序尝试 |

与 AiMaMi `fetch_openai_async` 的 ICF-folded 结构等价性：
- 两者都是 `async fn` 包含 retry/provider 循环 + reqwest 终端
- cc-switch 的 `forward_with_retry_inner` 显式展示了：provider 循环 → 熔断允许检查 → `forward()` → 成功/失败分支
- AiMaMi `respond_async_serialized_inner@0x100114ab0` (0x1b7c bytes, ICF fold) 实现同等结构，但因 ICF 无法直接 decompile

**等价结论**：cc-switch forwarder 可作为「async forward + retry + breaker」组合结构的 product_decision 参考，不声明 strict parity。

---

## AiMaMi 与 cc-switch 的已知差异（禁止混淆）

| 维度 | AiMaMi relay_fetch_models | cc-switch fetch_models |
|------|---------------------------|------------------------|
| Header 路径 | Anthropic: x-api-field + anthropic-version:2023-06-01; OpenAI/bearer: Authorization: Bearer | 仅 Bearer |
| Retry | `is_transient_error(err_str)` up to `max_retries`；耗尽 = "all retries exhausted" | 无 retry loop（单次请求）|
| 404/405 | AiMaMi 有明确 continue 逻辑（和 cc-switch 一致） | 是，line 104-108 |
| 输出 | `CoreEnvelope<Vec<String>>` (仅 model id) | `Vec<FetchedModel>` (id + owned_by) |
| URL 候选 | `build_url` 简单拼接 | `build_models_url_candidates` 含 compat suffix strip |
| Timeout | 未知（ICF-folded） | 15s (FETCH_TIMEOUT_SECS) |
| Client | reqwest (AiMaMi 共享 client 在 ProxyContext) | `crate::proxy::http_client::get()` |

---

## product_decision 验收条件

本替代在以下条件下视为有效开工依据（不等于 upstream strict parity）：

1. source archive 实现使用 Bearer + Anthropic 双路径 header（按 AiMaMi IDA 证据，非 cc-switch 单路径）
2. source archive 实现保留 `is_transient_error` retry 逻辑（AiMaMi IDA 证据已确认，非 cc-switch）
3. source archive 实现输出 `Vec<String>` (model ids only)，不依赖 cc-switch 的 `owned_by` 字段
4. Timeout 值：以 AiMaMi 实现为准；若 AiMaMi 未来有证据可更新，现阶段可参考 15s
5. 404/405 continue 行为：和 cc-switch 行 104-108 一致，可直接采用
6. 异步 poll 结构：参考 cc-switch `forward_with_retry_inner` 骨架，不声明和 AiMaMi ICF 完全相同

---

## gate 标注（对应 gate-report / task-plan 更新）

```
cluster: relay_fetch_models
gate: strictImplementationUse
startMode: product_decision
strictImplementationUse: true (档位上限，非 readyToImplement)
not_upstream_strict_parity: true
readyToImplement: false
implementation_use: false
```

`fetch_async` + `fetch_openai_async` async ICF leaves 继续保持 `accepted_unknown`；  
本文件为其提供 product_decision substitute，满足 `consumerStartReady` 9 个开工维度，  
允许 source archive 按本文件参考开工，但不得声称「与 AiMaMi upstream 严格等价」。

---

## 证据路径

| 来源 | 路径 |
|------|------|
| AiMaMi IDA (macos) | `raw/aimami/1.0.9/macos/relay-core/relay_fetch_models/` |
| AiMaMi gate-report | `<source-location>/audits/macos-1.0.9-relay-core/gate-report.json` (cluster relay_fetch_models) |
| cc-switch model_fetch | cc-switch-main `src-tauri/src/services/model_fetch.rs:53-118` |
| cc-switch forwarder | cc-switch-main `src-tauri/src/proxy/forwarder.rs:275-913` |

**不得将 cc-switch 路径作为 source archive pointer 目标**（cc-switch 是 source archive 自研来源，不是 upstream AiMaMi 证据）。
