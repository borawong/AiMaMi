# reqwest TLS Config — AiMaMi 1.0.9 macOS (arm64)

**session**: <audit-session>
**machine**: <workstation>
**method**: callsite-config (IDA MCP mac, xref → disasm)  
**gate**: owner-ALLOW (<workstation> owns path per INDEX.jsonl)  
**was_drop_in_place_only**: false  
**caller_disambiguation_tried**: false (no ICF ambiguity; callsites are distinct real bodies)  
**genuine_ceiling**: false  
**date**: 2026-06-03

---

## Summary

AiMaMi 1.0.9 macOS uses **reqwest** (async, rustls backend) for all HTTP operations. There are **3 distinct callsites** that call `ClientBuilder::new`. None calls `danger_accept_invalid_certs`, `add_root_certificate`, `tls_built_in_root_certs`, or any other dangerous TLS override method directly. The dangerous TLS option names present in binary strings are config field labels (deserialization targets), not active method calls in the binary.

---

## Binary Facts

- **IDB**: `<source-location>/source-binary/AiMaMi 1.0.9_ida.app/Contents/MacOS/AiMaMi.i64`
- **imagebase**: `0x100000000`
- **arch**: arm64 macOS

### ClientBuilder::new entry points

| Symbol | VA | Notes |
|---|---|---|
| `reqwest::async_impl::client::ClientBuilder::new::haa69260c2cesource archive118` | `0x10070e6b4` | used by all 3 AiMaMi callsites |
| `reqwest::async_impl::client::ClientBuilder::new::hb10e2f8294b69c45` | `0x1009b3a2c` | only called from `Default::default` trait impls (library-internal) |

### ClientBuilder::build entry points

| Symbol | VA |
|---|---|
| `reqwest::async_impl::client::ClientBuilder::build::hdd85889573053e4cE` | `0x10070eae4` |
| `reqwest::async_impl::client::ClientBuilder::build::h0845abca34bc0244E` | `0x1009b3df4` |

### Callsite inventory (xrefs to `0x10070e6b4`)

| # | Callsite VA | Containing function | Context |
|---|---|---|---|
| 1 | `0x1000ed77c` | `0x1000ecbf4` — `tauri::ipc::InvokeResolver::respond_async_serialized_inner::closure::h441a342b39ce74dc` | `download_and_install` Tauri command handler (primary) |
| 2 | `0x10010e270` | `0x10010d6a0` — `tauri::ipc::InvokeResolver::respond_async_serialized_inner::closure::ha5da4755983e07ce` | `download_and_install` Tauri command handler (second copy) |
| 3 | `0x100216b1c` | `0x10021632c` — `tauri_plugin_updater::updater::Updater::check::closure::h0e695e8bd0691dce` | `Updater::check` — update availability check |

---

## Callsite 1 & 2 — Builder Chain (identical pattern)

**Context**: Both are `download_and_install` Tauri command handlers. They share byte-for-byte identical builder logic.

```
0x1000ed77c  BL ClientBuilder::new
0x1000ed794  BL ClientBuilder::user_agent("tauri-plugin-updater/2.10.0", 0x1B)
             [conditional block, reads settings struct at [X19,#0x30C0]]
             bit [X8,#0xB1]:  0 → skip proxy block (→ no_proxy path)
                               1 → check bit [X8,#0xB2]
             bit [X8,#0xB2]:  0 → check timeout at [X8,#0x248]
                               1 → skip timeout check
             [X8,#0x248]:     compared vs 0x3B9ACA00 (1_000_000_000 ns = 1s default timeout sentinel)
             [X8,#0x240]:     custom timeout value (u64 nanos) when != sentinel
             [X8,#0x2A8]:     proxy-active bool
             [X8,#0x1E8]:     timeout Option<u64> — sentinel 0x8000000000000000 = None
             [X8,#0x1F0]:     proxy URL (ptr+len) loaded for Proxy::all()
             
             PATH A (no proxy):
0x1000ed800  BL ClientBuilder::no_proxy
             
             PATH B (proxy set):
0x1000ed9a0  BL reqwest::proxy::Proxy::all([X8,#0x1F0], [X8,#0x1F8])
             → result checked: if Proxy::all() fails → error branch
             → on success: ClientBuilder::proxy(proxy) (via memcpy into builder)
             
0x1000ed900  BL ClientBuilder::build  (→ 0x10070eae4)
```

**TLS flags observed**: NONE. No `danger_accept_invalid_certs`, no `add_root_certificate`, no `tls_built_in_root_certs`, no `use_rustls_tls`, no custom CA. Builder chain is: 
ew → user_agent → (no_proxy | proxy) → build`.

**User-agent**: `"tauri-plugin-updater/2.10.0"` (0x1B = 27 bytes), loaded from `aUpdaterdownloa+0x61` (`0x100edd0c9` + offset).

---

## Callsite 3 — Builder Chain (Updater::check)

**Context**: `Updater::check` — called when the app checks for an available update (not downloading yet).

**Critical gate before `ClientBuilder::new`**:
```
0x100216b10  BL rustls::crypto::CryptoProvider::get_default()
0x100216b14  CBZ X0, loc_100217444   ; → error branch if no crypto provider installed
```
→ If `rustls::crypto::CryptoProvider::install_default()` has not been called, `ClientBuilder::new` is never reached and returns an error.

```
0x100216b1c  BL ClientBuilder::new
0x100216b34  BL ClientBuilder::user_agent("tauri-plugin-updater/2.10.0", 0x1B)
             [conditional block, reads settings struct at [X19,#0x190] → X20]
             bit [X20,#0xB1]:   0 → skip proxy block (→ loc_100216C18)
                                 1 → check bit [X20,#0xB2]
             bit [X20,#0xB2]:   0 → check timeout at [X20,#0x1A8]
                                 1 → skip timeout
             [X20,#0x1A8]:      timeout u32 vs 0x3B9ACA00 sentinel
             [X20,#0x1A0]:      custom timeout u64
             [X20,#0x220]:      proxy-active bool (different offset vs callsites 1/2)
             [X20,#0x130]:      timeout Option<u64> sentinel 0x8000000000000000
             [X20,#0x138/0x140]: proxy URL ptr+len (different offsets vs callsites 1/2)
             
             PATH A (no proxy):
0x100216c10  BL ClientBuilder::no_proxy
             
             PATH B (proxy set, logged):
0x100216d0c  BL reqwest::proxy::Proxy::all([X20,#0x138], [X20,#0x140])
0x100216dbc  BL ClientBuilder::proxy(proxy)

             [ADDITIONAL: vtable-dispatched builder injection]
0x100216ddc  LDR X8, [X9,#0x210]  ; Option<Arc<dyn BuilderExt>>
0x100216de4  CBZ X8, loc_100216E3C  ; if None → skip
             ; if Some: BLR X9 [X20,#0x28] at 0x100216e20
             ; → indirect call through vtable — applies additional builder config
             ; This is the mechanism for dangerous TLS flags if configured
             
0x100216e54  BL ClientBuilder::build  (→ 0x10070eae4)
```

**TLS flags observed**: No direct call to `danger_accept_invalid_certs` or similar in the visible builder chain. The `dangerous-accept-invalid-certs` / `dangerousAcceptInvalidCerts` strings at `0x100ee2source archive9` are **config field names** for JSON/TOML deserialization (tauri-plugin-updater's endpoint config). They are decoded into fields that may be passed through the vtable-dispatch at `0x100216e20` — but the vtable target at build time depends on runtime config; no static path to a `danger_accept_invalid_certs` call was found.

**User-agent**: `"tauri-plugin-updater/2.10.0"` (same 27 bytes), from `unk_100EE2source archive9`.

---

## TLS Backend

The `ClientBuilder::build` function at `0x10070eae4` references:
- `"No provider set"` — confirming rustls backend requires `CryptoProvider::install_default()` 
- `"disabling rustls hostname verification only allowed with tls_certs_only()"` — error path for hostname override
- `"invalid TLS verification settings"` — validation error in build
- `"empty supported tls versions"` — TLS version config validation
- `rustls::crypto::CryptoProvider::get_default()` — called by build itself too

**Backend**: **rustls** (via `rustls-platform-verifier`). No native TLS (
ative-tls`) code paths found in the binary.

---

## Security-relevant findings

| Item | Finding |
|---|---|
| `danger_accept_invalid_certs` | NOT called anywhere in builder chains |
| `danger_accept_invalid_hostnames` | NOT called anywhere in builder chains |
| `add_root_certificate` | NOT present as compiled function |
| `tls_built_in_root_certs` | NOT present as compiled function |
| Proxy: system proxy | NOT used; proxy configured via AiMaMi settings struct only |
| Proxy: `Proxy::all()` | Used when settings struct proxy-active flag set |
| Timeout | Default: 1s (0x3B9ACA00 ns sentinel) or configured u64 nanos from settings |
| User-agent | `"tauri-plugin-updater/2.10.0"` in all 3 callsites |
| rustls provider gate | Callsite 3 gates on `CryptoProvider::get_default()` != None |
| Dangerous TLS config keys | Present as deserialization field strings only; not statically applied in builder chains |
| Vtable injection (callsite 3) | `[Updater.0x210]` Arc<dyn Trait> object applied to builder if non-None; not statically resolvable |

---

## Verdict

**real_body_found**: true  
**was_drop_in_place_only**: false  
**genuine_ceiling**: false  
**gate_tier**: readyToImplement  
**tls_config**: rustls-default, no cert overrides in static paths; dangerous flags are config keys only, not applied builder calls  
**method_used**: callsite-config  
**platform**: macos-arm64  
