# Evidence Paths — cross-1.0.9-relay-core-bootstrap

All raw/intermediate evidence is stored under `<source-location>`. These are env-relative pointers only.

## macOS Evidence Roots (SHA 1db044e8efab)

| cluster | raw path |
|---|---|
| relay_breaker | `raw/aimami/1.0.9/macos/relay-core/relay_breaker/` |
| relay_fetch_models | `raw/aimami/1.0.9/macos/relay-core/relay_fetch_models/` |
| relay_models | `raw/aimami/1.0.9/macos/relay-core/relay_models/` |
| relay_translator_stream | `raw/aimami/1.0.9/macos/relay-core/relay_translator_stream/` |
| relay_web_executor | `raw/aimami/1.0.9/macos/relay-core/relay_web_executor/` |
| relay_web_tools | `raw/aimami/1.0.9/macos/relay-core/relay_web_tools/` |
| relay_codex_writer | `intermediate/aimami/1.0.9/macos/relay-core/relay_codex_writer/` |
| relay_diagnostic | `raw/aimami/1.0.9/macos/relay-core/relay_diagnostic/` |
| relay_health_audit | `raw/aimami/1.0.9/macos/relay-core/relay_health_audit/` |
| relay_manager | `raw/aimami/1.0.9/macos/relay-core/relay_manager/` |
| relay_proxy_server | `raw/aimami/1.0.9/macos/relay-core/relay_proxy_server/` |
| relay_thread_migration | `raw/aimami/1.0.9/macos/relay-core/relay_thread_migration/` |
| relay_translator | `intermediate/aimami/1.0.9/macos/relay-core/relay_translator/` |
| app_run_entry | `raw/aimami/1.0.9/macos/bootstrap/app_run_entry/` |
| boot_spawn_threads | `raw/aimami/1.0.9/macos/bootstrap/boot_spawn_threads/` |
| bootstrap_cache | `raw/aimami/1.0.9/macos/bootstrap/bootstrap_cache/` |
| managed_state_registry | `raw/aimami/1.0.9/macos/bootstrap/managed_state_registry/` |

## Windows Evidence Roots (SHA a5822387fa3f)

| cluster | raw path |
|---|---|
| relay_breaker | `raw/aimami/1.0.9/windows/relay-core/relay_breaker/` |
| relay_fetch_models | `raw/aimami/1.0.9/windows/relay-core/relay_fetch_models/` |
| relay_models | `raw/aimami/1.0.9/windows/relay-core/relay_models/` |
| relay_web_executor | `raw/aimami/1.0.9/windows/relay-core/relay_web_executor/` |
| relay_web_tools | `raw/aimami/1.0.9/windows/relay-core/relay_web_tools/` |
| relay_manager | `raw/aimami/1.0.9/windows/relay-core/relay_manager/` |
| relay_proxy_server | `raw/aimami/1.0.9/windows/relay-core/relay_proxy_server/` |
| relay_codex_writer | `raw/aimami/1.0.9/windows/relay-core/relay_codex_writer/` |
| relay_diagnostic | `raw/aimami/1.0.9/windows/relay-core/relay_diagnostic/` |
| relay_thread_migration | `raw/aimami/1.0.9/windows/relay-core/relay_thread_migration/` |
| relay_health_audit (BLOCKED) | `raw/aimami/1.0.9/windows/relay-core/relay_health_audit/` (0/11 decompiled) |
| bootstrap (IDA-offline) | `raw/aimami/1.0.9/windows/bootstrap/` |

## Consumer Bundle Pointers

| bundle | path |
|---|---|
| macos relay-core | `<source-location>/audits/macos-1.0.9-relay-core/` |
| macos bootstrap | `<source-location>/audits/macos-1.0.9-bootstrap/` |
| windows relay-core | `<source-location>/audits/windows-1.0.9-relay-core/` |
| windows bootstrap | `<source-location>/audits/windows-1.0.9-bootstrap/` |
| cross ACK (this bundle) | `<source-location>/audits/cross-1.0.9-relay-core-bootstrap/` |

## IDB Paths

- macOS IDB: `<source-location>/source-binary/AiMaM\ 1.0.9\ mac.app` (IDA Pro, mac endpoint <network-share>:13337)
- Windows IDB: `<source-location>/source-binary/AiMaM\ 1.0.9\ win64.exe.i64` (IDA Pro, win endpoint <network-share>:13337)
