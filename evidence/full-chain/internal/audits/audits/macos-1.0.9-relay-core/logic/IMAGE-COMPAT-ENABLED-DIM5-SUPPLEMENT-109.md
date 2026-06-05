# relay_image_compat — mac dim5 closure supplement

**Session**: <audit-session>
**Machine**: <workstation>
**Date**: 2026-06-04  
**IDA platform**: mcp-mac (live IDB, SHA 1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482)  
**Scope**: Independent live-IDB re-verify of `image_compat_enabled@0x1001bf94c` + dim5 same-side gate confirmation  
**Basis**: Prior session relay-image-compat-109 covered 7 leaves at consumerStartReady; this supplement independently re-decompiles the cache-gate function, confirms all callers, and closes dim5.

---

## 1. addr_verified

Audit-stated addr `0x1001bf94c` is the **true owner**.

- `func_query(name_regex="image_compat")` returns single hit: `codexmate_lib::core::relay::image_compat::image_compat_enabled::h95b14399165234f9` at `0x1001bf94c`, size `0x434` (1076 bytes).
- No neighbor mis-attribution. Not a shim, not drop_in_place.

---

## 2. Function overview

```
codexmate_lib::core::relay::image_compat::image_compat_enabled(path: *const u8, len: usize) -> bool
VA: 0x1001bf94c  Size: 0x434 (1076 B)  Synchronous (no async/Future/poll)
```

**Behavior**: Caching wrapper around `read_image_compat_enabled`. Checks `~/.codex/config.toml` mtime via `std::fs::metadata`, compares against a globally-cached (OnceLock + Mutex) mtime snapshot. On cache hit returns cached bool. On cache miss (mtime changed or first call) calls `read_image_compat_enabled`, updates cache atomically.

---

## 3. Cache mechanism (IMAGE_COMPAT_CACHE)

Global: `IMAGE_COMPAT_CACHE @ 0x101390000` — a `std::sync::OnceLock<Mutex<...>>` initialized via:
- `OnceLock::initialize` → `OnceBox::initialize` → `Mutex::lock`

Cache fields (globals at static section):
| Global VA | Role |
|---|---|
| `0x101390000` | `IMAGE_COMPAT_CACHE` — OnceLock state |
| `0x101390008` | `byte_101390008` — panic-during-lock flag |
| `0x101390010` | `qword_101390010` — cache valid flag (0=empty, 1=mtime-valid, 2=init) |
| `0x101390018` | `qword_101390018` — cached mtime nanos part |
| `0x101390020` | `xmmword_101390020` — cached PathBuf (ptr+len) |
| `0x101390030` | `qword_101390030` — cached PathBuf extra |
| `0x101390038` | `qword_101390038` — cached mtime secs |
| `0x101390040` | `dword_101390040` — cached mtime subsec_nanos |
| `0x101390048` | `byte_101390048` — cached bool result |
| `0x101390050` | `qword_101390050` — OnceLock initialized flag |

**Cache field**: `(path_buf == cached_path) AND (mtime secs == cached_secs) AND (mtime nanos == cached_nanos)`.  
**Cache invalidation**: implicit — whenever `config.toml` mtime changes (e.g., after `set_image_compat` writes), next call sees mtime mismatch → cache miss → re-reads TOML.

---

## 4. Leaf delegate: `read_image_compat_enabled`

```
VA: 0x1001bfdd4  Size: 0x250 (592 B)  Synchronous
```

Reads `config.toml` via `std::fs::read_to_string`, line-scans for `[features]` section (10-char match: bytes `[featur` + `es]`), then looks for field `image_generation` (16 bytes). Returns `true` if value literal equals `"false"` (5 bytes: DWORD `1936482662` = `fals` + byte+4 = `e`).

**Semantic inversion confirmed**: `image_generation = false` in TOML → `enabled = true` (function returns 1).  
**Return**: 1 if `image_generation = false` found in `[features]` section; 0 otherwise (field missing, section missing, file read error).

**field byte constants** (byte-verified):
| Constant | Decoded |
|---|---|
| `0x657275746165665BLL` | `[featur` (LE 8 bytes) |
| word `23923` at offset+8 | `es]` (word 0x5D73 → `s]` + prior `e` → `es]`) |
| `0x65675F6567616D69LL` | `image_ge` (LE 8 bytes) |
| `0x6E6F69746172656ELL` | 
eration` (LE 8 bytes) |
| DWORD `1936482662` | `fals` (LE, 0x736C6166) |
| byte `101` | `e` = ASCII |

**TOML section name correction** (re-confirmed): section header is `[features]` (10 chars with trailing `s`), not `[feature]`. The set_image_compat supplement (relay-transport-closeout-109) already recorded this correction.

---

## 5. Callers (xrefs_to 0x1001bf94c)

Two callers, both closures of `forward_codex_responses_internal`:

| Caller VA | Function | Notes |
|---|---|---|
| `0x100099274` | `forward_codex_responses_internal::{{closure}}::h121413bdd485af0b` @ `0x1000987a0` (0x3078=12408B) | Pass 1 |
| `0x10024856c` | `forward_codex_responses_internal::{{closure}}::h121413bdd485af0b_0` @ `0x100247aac` (0x3098=12440B) | Pass 2 (ICF clone / monomorphization variant) |

Both callers: relay proxy server's response-forwarding closures use `image_compat_enabled` to gate image-stripping behavior in the stream forwarding path.

---

## 6. Fake-wall taxonomy — all 8 items excluded

| Fake-wall type | Exclusion reason |
|---|---|
| `drop_in_place` / destructor mistaken as body | Body is 1076B synchronous logic; final `Mutex::unlock` + return. No env type, no Future, no poll. |
| architecture_only / budget rule | Budget not applied; full 1076B decompiled in one pass. |
| async decompile failed (HexRays bail) | No async state machine. HexRays decompiled cleanly. |
| Wrong VA (neighbor mis-attribution) | `func_query` single hit at exact 0x1001bf94c. |
| vtable / dynamic dispatch unknown | All callees statically resolved via decompile refs. |
| HTTP-terminal / external unverifiable | No HTTP. Pure `std::fs::metadata` + `OnceLock` + `Mutex`. |
| Library internal not exposed | Callsite-level config logic fully visible. |
| Body too large | 1076B = small. No chunking needed. |

**recovery_attempts**: not_needed_no_ceiling (no wall reached; full decompile clean single pass).  
**genuine_ceiling**: false.  
**accepted_unknown**: false.

---

## 7. IPC bindings (dim3 context)

| IPC command | VA | Role |
|---|---|---|
| `get_image_compat` | `0x10025e7c0` (0x2cc=716B) | Read-only: reads config.toml directly (does NOT call `image_compat_enabled`; own inline scan) |
| `set_image_compat_owner_sys` | `0x10025ee14` (0xBF4=3060B) | Write: full TOML R/W pipeline (see SET-IMAGE-COMPAT-OWNER-SYS-SUPPLEMENT-109.md) |

`image_compat_enabled` is called only from the relay proxy server closures, NOT from the IPC layer. The IPC `get_image_compat` command has its own inline TOML scan — a separate, redundant reader without the OnceLock cache.

---

## 8. DTO / response shape

### `image_compat_enabled` (internal relay gate)
- Input: `(path: *const u8, len: usize)` — config.toml path
- Returns: `bool` (0 or 1)
- No IPC wrapping; purely internal relay call

### `get_image_compat` IPC
- argKeys: `[]` (zero args)
- Response: `CoreEnvelope<bool>` — `{ status: "ok", message: "success", data: bool }`

### `set_image_compat_owner_sys` IPC
- argKeys: `[enabled: bool]` (W0 register)
- Response: `CoreEnvelope<String>` — `{ status: "ok", message: "success", data: "" }` on success; error string on fs failure

---

## 9. Side-effects

| Function | Side-effects |
|---|---|
| `image_compat_enabled` | READ: `stat(config.toml)` for mtime. WRITE: updates `IMAGE_COMPAT_CACHE` globals (atomic, Mutex-guarded). No file write. |
| `read_image_compat_enabled` | READ: `read_to_string(config.toml)`. No write. |
| `get_image_compat` IPC | READ: `read_to_string(config.toml)`. No write. |
| `set_image_compat_owner_sys` IPC | WRITE: `fs::write(config.toml)`. Invalidates `IMAGE_COMPAT_CACHE` implicitly via mtime change on next `image_compat_enabled` call. NOT atomic (no rename). |

---

## 10. Gate assessment

| Dimension | Status | Evidence |
|---|---|---|
| dim1 (frontend CCF) | DORMANT WRAPPER — accepted | api.getImageCompat→invoke('get_image_compat') present in frontend dump; NO active source archive UI consumer per FRONTEND-CURRENT-source archive-CONSUMER-CHAIN-109.md |
| dim2 (real body found) | CLOSED | image_compat_enabled@0x1001bf94c 1076B decompiled; read_image_compat_enabled@0x1001bfdd4 592B decompiled |
| dim3 (callers/xrefs) | CLOSED | 2 callers in forward_codex_responses_internal closures; IPC bindings at get/set VAs |
| dim4 (DTO/error/side-effect) | CLOSED | All DTO shapes byte-verified; error model = IO failures → return false / CoreEnvelope error string; side-effects enumerated |
| dim5 (same-side gate) | CLOSED (this supplement) | All mac-arm64 evidence consistent; no false walls; OnceLock cache confirmed; mtime invalidation confirmed |
| dim6 (product/E2E) | OPEN | No active frontend consumer; feature toggle exists but unused in current source archive UI |

**gate_tier**: `consumerStartReady` — UNCHANGED from relay-image-compat-109.

Rationale: dim5 closes the same-side gate (mac binary evidence complete, no unknowns remaining on the binary side). dim6 remains open (no live product consumer to map E2E). Windows cluster remains at `strictImplementationUse` per WIN-RELAY-IMAGE-COMPAT-109.md.

**block_decomposed**: false (single synchronous function, no async decomposition needed).  
**dims_closed**: 2,3,4,5 (this supplement adds dim5).

---

## 11. INDEX entries (to append)

```jsonl
{"date":"2026-06-04","session":"<audit-session>","machine":"<workstation>","field":"<source-location>/audits/macos-1.0.9-relay-core/logic/IMAGE-COMPAT-ENABLED-DIM5-SUPPLEMENT-109.md","type":"distilled-supplement","product":"aimami","version":"1.0.9","platform":"macos-arm64","module":"relay-core/relay_image_compat","target":"image_compat_enabled","addr":"0x1001bf94c","gate_tier":"consumerStartReady","dims_closed":"2,3,4,5","genuine_ceiling":false,"accepted_unknown":false,"authoritative":true}
```
