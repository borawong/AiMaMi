# System Diff — test_relay_provider (macOS 1.0.9)

## Platform Artifacts

macOS arm64: AiMaMi 1.0.9 (SHA 1db044e8efab)
Windows: Unknown — not evidenced in this pass. Must not infer from macOS.

## Frontend IPC / Control-flow

Unknown — not evidenced. Backend-only pass. Frontend CCF accepted_unknown for strictImplementationUse.

## Backend Commands / Control-flow / Pseudocode / Call-tree / Leaf

| Item | macOS | Windows |
|---|---|---|
| Owner VA | 0x1000f03ac | Unknown |
| Role | async IPC closure (respond_async_serialized_inner) | Unknown |
| Call-tree depth | 8 | Unknown |
| HTTP terminal | POST /v1/messages or /v1/chat/completions | Unknown |
| retry logic | should_retry_test (6 patterns) | Unknown |
| persist | relay.json via atomic_write | Unknown |

Call-chain: ensure_provider_loaded → test_provider_async → build_test_request → reqwest::send [ext_call] → apply_health_result → mutex_lock → persist → sync_codex_config

## Interface / Error / Boundary

| Field | Value |
|---|---|
| Input | providerId: String |
| Output | CoreEnvelope<RelayTestResult> {latency_ms, health_score, error_msg, timestamp_ms} |
| Error | CoreEnvelope<Err(String)> |
| health_score 100 | latency < 200ms |
| health_score 70 | 200ms ≤ latency < 600ms |
| health_score 40 | 600ms ≤ latency < 1500ms |
| health_score 20 | latency ≥ 1500ms |
| health_score 0 | HTTP failure |

## Gate Leaf

macOS: strictImplementationUse
Windows: Unknown — not gated

## Plugin / Capability

N/A (relay domain, not plugin domain)

## OTA / Package

N/A

## Resource / Binary Surface

Binary SOT: <source-location>/source-binary/AiMaMi 1.0.9_ida.app
Pseudocode files: ida/pseudocode/ (3 files)

## Unknown

- Frontend CCF: accepted_unknown
- Windows platform behavior: Unknown
- Max retry count for should_retry_test
