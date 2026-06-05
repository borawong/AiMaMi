# proxy-config Cluster — macOS Distilled (<audit-session>)

**Platform**: macOS arm64 | **Binary SHA12**: 1db044e8efab | **Session**: <audit-session>
**Producer**: <workstation> | **Date**: 2026-06-03
**Bundle**: macos-1.0.9-relay-core (supplement to relay_proxy_config cluster)
**is_upstream**: true (all 3 commands confirmed upstream codex-cli)
**Gate**: strictImplementationUse (dim1-5 closed; dim6 ceiling — test/acceptance mapping not in scope)

---

## Commands

| command | VA | is_upstream | dim1-5 | gate |
|---|---|---|---|---|
| set_api_proxy_config | 0x100260078 | true | closed | strictImplementationUse |
| detect_api_proxy_config | 0x10032e504 | true | closed | strictImplementationUse |
| test_api_proxy_config | 0x10032e2e8 | true | closed | strictImplementationUse |

---

## set_api_proxy_config

**Entry**: `cmd_set_api_proxy_config@0x100260078` → acquires `Mutex<Repository>` (OnceBox) → `repo_set_api_proxy_config@0x1005e9808`.

**Parameters**:
- `mode: u8` — 0=direct, 1=manual/url, 10=system
- `url: Option<String>` — required if mode=1

**Flow**:
1. `sanitize_proxy_config@0x100544aec` — validates mode + url (scheme check: http/https/socks5/socks5h)
2. `Repository::load_settings@0x1005e2f68` — read current settings JSON
3. Update proxy_config fields (mode byte + optional URL string)
4. `Repository::save_settings@0x1005e3328` — write settings JSON to disk (NOT relay config.toml)
5. Return `CoreEnvelope<()>` with ok=true or Err

**Errors**:
- mode=1 without url: "Manual proxy mode requires a proxy URL"
- invalid scheme: sanitize_proxy_config validation error
- save_settings failure: propagated as CoreError
- poisoned lock: "poisoned lock: another task failed inside"

**Side effects**: writes `~/.codex/settings.json` (settings file). Does NOT write `~/.codex/config.toml`.

---

## detect_api_proxy_config

**Entry**: `cmd_detect_api_proxy_config_closure@0x10032e504` (async, tokio Core::poll@0x1001495dc).

**Parameters**: none — reads auth context from repo.

**Flow**:
1. `cmd_load_api_request_context_from_repo@0x100263838` — tauri StateManager → Mutex<Repo> → load_auth_file → make_api_request_context → returns (proxy_cfg: Option, sensitive-field: Option<String>)
2. `api_client_detect_api_proxy_config@0x1005454dc` — full detection:
   a. Env var candidates: `https_proxy`, `HTTPS_PROXY`, `http_proxy`, `HTTP_PROXY`, `all_proxy`, `ALL_PROXY`
   b. System proxy: `platform_proxy::detect_system_proxy_candidates@0x1002646f4` → 
etworksetup -getwebproxy/-getsecurewebproxy/-getsocksfirewallproxy` subprocess
   c. Static candidate list (18 entries, 127.0.0.1 / localhost across ports: 7890, 7891, 7892, 10808, 10809, 8080, 1080, 7893, 20171, 9090; schemes http/socks5)
   d. HashMap dedup (hashbrown::RandomState)
   e. Per candidate: url::parse → filter to 127.0.0.1/localhost only → to_socket_addrs → TCP probe 200ms (`try_connect_local_proxy@0x100546040`)
   f. On first reachable: `test_api_connectivity@0x100544e70` → GET `https://chatgpt.com/backend-api/accounts/check/v4-2023-04-27`
   g. No candidate: return not_found + error message

**Output** (`DetectedProxy`):
```
mode: u8        (1 = found, manual)
url: String     (confirmed reachable proxy URL)
code: String    ("ok" | "not_found")
message: String ("No reachable proxy configuration was detected from environment variables, system proxy, PAC, or common local addresses" on not_found)
```

**Side effects**: spawns 
etworksetup` subprocess; TCP connects to localhost ports (200ms each); HTTP GET to chatgpt.com; caches reqwest Client in global OnceLock.

---

## test_api_proxy_config

**Entry**: `cmd_test_api_proxy_config_closure@0x10032e2e8` (async, tokio Core::poll@0x10014a480).

**Parameters**:
- `mode: u8` — proxy mode (same as set)
- `url: Option<String>` — proxy URL to test

**Flow**:
1. `cmd_load_api_request_context_from_repo@0x100263838` — load auth context (same as detect)
2. Read mode/url from closure capture (`a2+152..+176`)
3. `api_client_test_api_connectivity@0x100544e70(url_buf, proxy_cfg_opt)`:
   a. `sanitize_proxy_config@0x100544aec` — validate mode + url
   b. `http_client@0x100543a54` — get/build reqwest Client (OnceLock keyed by proxy url string @0x1013903B8)
   c. `reqwest::blocking::Client::request(GET, "https://chatgpt.com/backend-api/accounts/check/v4-2023-04-27")` with `Authorization: Bearer <sensitive-field>` header
   d. Return status_code + "ok" / error code
4. Return `CoreEnvelope<TestResult>`

**Output** (`TestResult`):
```
code: String       ("ok" | "network_error" | "client_build_failed" | "invalid_config")
ok: bool
status_code: u16
message: String    ("direct connection" if mode=system; proxy_url if mode=manual)
```
String literals confirmed in decompile at `0x100f3a533`.

**Side effects**: outbound HTTP GET (blocking); caches reqwest Client in global OnceLock.

---

## Shared helpers

| function | VA | role |
|---|---|---|
| cmd_load_api_request_context_from_repo | 0x100263838 | tauri StateManager → Repo Mutex → auth file → (proxy_cfg, sensitive-field) |
| api_client_http_client | 0x100543a54 | OnceLock reqwest Client cache keyed by proxy URL |
| api_client_sanitize_proxy_config | 0x100544aec | mode + url validation; scheme check |
| api_client_try_connect_local_proxy | 0x100546040 | TcpStream::connect_timeout 200ms |
| platform_proxy::detect_system_proxy_candidates | 0x1002646f4 | networksetup subprocess → parse output |

---

## Platform Divergence

- **detect**: macOS uses 
etworksetup` subprocess; Windows uses WinHTTP env var enumeration + TCP probe without subprocess.
- **test / set**: behavior equivalent across platforms; settings JSON path same.
- Windows counterparts in: `WIN-RELAY-TRANSPORT-CLOSEOUT-109.md` §6 (windows-1.0.9-relay-core bundle).

---

## Evidence path

Raw distilled: `<source-location>/raw/aimami/1.0.9/macos/relay-core/relay_proxy_config/PROXY-CONFIG-DEEP-109-wf-dualcomplete.md`
Prior session raw: `<source-location>/raw/aimami/1.0.9/macos/relay-core/relay_proxy_config/RELAY-PROXY-CONFIG-MAC-109.md`
INDEX lines: 1187-1199 (relay-transport-closeout-109) + this session appended below.
