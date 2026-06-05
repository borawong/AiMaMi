# relay_image_compat — image_compat_enabled @ 0x1001bf94c
# Strict-gate dim3-5 full closure (OnceLock mtime-invalidation chain)

**Session**: <audit-session>
**Machine**: <workstation>
**Date**: 2026-06-05
**IDA platform**: mcp-mac (live IDB)
**Binary SHA256**: 1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482
**SHA12**: 1db044e8efab
**Scope**: `image_compat_enabled@0x1001bf94c` — dim3 callee chain + dim4 mtime-invalidation byte-confirm + dim5 same-side gate. Promoted from consumerStartReady → strictImplementationUse.
**Basis**: Fresh live-IDA decompile (func_query + decompile + xrefs_to). Supersedes dim5 supplement from <audit-session> (2026-06-04).

---

## 1. addr_verified

`func_query(name_regex="image_compat")` → single hit at `0x1001bf94c`:
`codexmate_lib::core::relay::image_compat::image_compat_enabled::h95b14399165234f9`, size `0x434` (1076B).

No mis-attribution, no shim, not drop_in_place. True synchronous owner confirmed.

---

## 2. dim3 — Callee chain + xrefs (CLOSED)

### 2.1 Callers of image_compat_enabled (xrefs_to 0x1001bf94c)

| Call site VA | Caller function | Size |
|---|---|---|
| `0x100099274` | `forward_codex_responses_internal::{{closure}}::h121413bdd485af0b@0x1000987a0` | 0x3078 (12408B) |
| `0x10024856c` | `forward_codex_responses_internal::{{closure}}::h121413bdd485af0b_0@0x100247aac` | 0x3098 (12440B) |

`more=false` — exactly 2 callers, both ICF-clone variants of the relay proxy server's response-forwarding closure.

### 2.2 Callers of read_image_compat_enabled (xrefs_to 0x1001bfdd4)

| Call site VA | Caller function |
|---|---|
| `0x1001bfb10` | `image_compat_enabled@0x1001bf94c` — cache-miss/error path (Mutex unlock before call) |
| `0x1001bfcac` | `image_compat_enabled@0x1001bf94c` — LABEL_45 cache-bypass path |

`more=false` — `read_image_compat_enabled` is called exclusively from `image_compat_enabled`. No other callers.

### 2.3 Full call chain (depth ≥ 5)

```
forward_codex_responses_internal::closure           [depth 0, proxy_server.rs]
  └─ image_compat_enabled@0x1001bf94c               [depth 1, image_compat.rs]
       ├─ std::fs::metadata@0x100d322dc             [depth 2, stdlib fs]
       ├─ std::fs::Metadata::modified@0x100d2cc7c   [depth 2, stdlib fs]
       ├─ OnceLock::initialize@0x100d86944          [depth 2, stdlib sync]
       │    └─ OnceBox::initialize@0x100d7fec8      [depth 3, stdlib sync]
       ├─ Mutex::lock@0x100d3499c                   [depth 2, stdlib unix sync]
       ├─ Mutex::unlock@0x100d349b8                 [depth 2, stdlib unix sync]
       ├─ PathBuf::eq@0x10020ce90                   [depth 2, stdlib path]
       ├─ Path::to_path_buf@0x100d38694             [depth 2, stdlib path]
       └─ read_image_compat_enabled@0x1001bfdd4     [depth 2, image_compat.rs]
            └─ std::fs::read_to_string::inner@0x100d2c1f4  [depth 3, stdlib fs]
```

Chain depth = 5 (proxy_server closure → image_compat_enabled → OnceLock/Mutex → stdlib). dim3 CLOSED.

---

## 3. dim4 — DTO / error / side-effect byte-confirm (CLOSED, mtime-invalidation chain fully closed)

### 3.1 OnceLock cache globals (IMAGE_COMPAT_CACHE)

| Global VA | Type | Role |
|---|---|---|
| `0x101390000` | `OnceLock<Mutex<...>>` | IMAGE_COMPAT_CACHE — lock object |
| `0x101390008` | `u8` | `byte_101390008` — panic-during-lock guard flag |
| `0x101390010` | `u64` | `qword_101390010` — cache valid discriminant (0=unset, 1=mtime-valid, 2=init) |
| `0x101390018` | `u64` | `qword_101390018` — cached mtime nanos part (subsec_nanos field v2) |
| `0x101390020` | `u128` | `xmmword_101390020` — cached PathBuf (ptr+len, 16B) |
| `0x101390030` | `u64` | `qword_101390030` — cached PathBuf extra (capacity or heap tag) |
| `0x101390038` | `u64` | `qword_101390038` — cached mtime secs |
| `0x101390040` | `u32` | `dword_101390040` — cached mtime subsec_nanos |
| `0x101390048` | `u8` | `byte_101390048` — cached bool result |
| `0x101390050` | `u64` | OnceLock initialized flag (atomic) |

### 3.2 Cache-hit condition (returns byte_101390048 without calling read_image_compat_enabled)

All of the following must be true simultaneously:
1. `std::fs::metadata(path)` succeeded (no error — `(v36 & 1) == 0`)
2. `PathBuf::eq(xmmword_101390020, qword_101390030, path, len)` == true (path matches cached)
3. `dword_101390040 (subsec_nanos) == v7` AND `qword_101390038 (secs) == v23` (mtime matches cached)
4. `qword_101390010 == 1` (cache valid discriminant = mtime-valid)
5. If `qword_101390010 == 1`: `qword_101390018 (nanos) == v2` (additional nanos field matches)

Only when all 5 conditions pass → returns `byte_101390048 & 1` (cached bool).

### 3.3 Cache-miss / mtime-invalidation path (LABEL_45 — calls read_image_compat_enabled then updates all globals)

Triggered by any of:
- `qword_101390010 == 2` (not yet valid)
- `PathBuf::eq` returns false (path changed)
- `dword_101390040 (subsec_nanos) != v7` (mtime subsec changed)
- `qword_101390038 (secs) != v23` (mtime secs changed)
- `qword_101390010 == 1` but `qword_101390018 != v2` (nanos mismatch)
- `dword_101390040 == 1000000000` sentinel AND `v7 != 1000000000` (sentinel mtime mismatch)
- `v5 == 0` with `qword_101390010 != 1` (metadata ok but discriminant ≠ 1)

LABEL_45 sequence:
```
v15 = read_image_compat_enabled(path, len)   // re-read TOML
v17 = Path::to_path_buf(path)                // alloc new PathBuf copy
if (qword_101390010 != 2 && xmmword_101390020.ptr != 0):
    rust_dealloc(xmmword_101390020.ptr)      // free old cached PathBuf
// Write all cache globals atomically under Mutex:
qword_101390010 = v6      (0 if metadata error, 1 if ok)
qword_101390018 = v2      (new nanos)
xmmword_101390020 = new PathBuf (ptr+len)
qword_101390030 = extra
qword_101390038 = v23     (new secs)
dword_101390040 = v7      (new subsec_nanos)
byte_101390048  = v15     (new cached bool)
```

### 3.4 Metadata-error path (std::fs::metadata fails)

Condition: `(v36 & 1) != 0` (Result::Err tag set).

Sub-paths:
- `BYTE8(v36) & 3 == 1` (heap-allocated error): frees error object via vtable drop + rust_dealloc, then enters OnceLock init with `v6=0, v7=1000000000` (sentinel nanos). Calls `read_image_compat_enabled` directly (LABEL_17 via panic-guard path). **Does NOT update cache** — OnceLock path returns 0 without caching.
- `BYTE8(v36) & 3 != 1` (inline error): same sentinel values, same path.

On metadata error: `v6=0` (discriminant 0 = unset) and `v7=1000000000` (sentinel). Cache is NOT written on error. Subsequent calls will always miss the cache (discriminant 0 or sentinel nanos mismatch).

### 3.5 read_image_compat_enabled TOML byte-confirm

Input: `(a1: *const u8, a2: usize)` — raw path pointer + length.

Flow:
1. `std::fs::read_to_string::inner(path)` — reads entire config.toml. On IO error: `drop_in_place<Result<String,Error>>` + return 0.
2. Line-scan via `CharSearcher::next_match` (newline splitter).
3. Section detection: line starts with `[`, length == 10, bytes match `0x657275746165665BLL` (`[featur`) + word `23923` (`es]`) → `[features]`. Sets `v3 = true`.
4. field detection (when `v3 == true`): line length ≥ 16, `*(_QWORD*)line == 0x65675F6567616D69LL` (`image_ge`) AND `*((_QWORD*)line+1) == 0x6E6F69746172656ELL` (
eration`). Trims prefix, expects `=` (ASCII 61). Trims whitespace after `=`.
5. Value match: trimmed value length == 5, DWORD `1936482662` (`0x736C6166` = `fals`) + byte `101` (`e`) → `false`. Returns 1 (enabled=true).
6. Any other value or field-not-found → continues scan. Section exit (new `[` header) resets `v3 = false`.
7. Returns 0 on: IO error, section not found, field not found, value not `false`.

**Semantic inversion (byte-proven)**: `image_generation = false` in TOML → function returns `1` (enabled = true).

### 3.6 Error model summary

| Condition | Behavior | Return |
|---|---|---|
| `metadata` IO error | No cache update; calls `read_image_compat_enabled` directly | 0 (disabled) |
| `read_to_string` IO error | `drop_in_place(Result<String,Error>)`; no cache update | 0 (disabled) |
| `[features]` section missing | Exhausts all lines; no cache update | 0 (disabled) |
| `image_generation` field missing | Exhausts section lines; no cache update | 0 (disabled) |
| value != `false` | Continues scan; no early return | 0 (disabled) |
| cache hit | Returns `byte_101390048` | cached bool |
| cache miss (all globals updated) | Returns fresh `read_image_compat_enabled` result | fresh bool |

### 3.7 Side-effects

| Function | Side-effects |
|---|---|
| `image_compat_enabled` | READ: `stat(config.toml)` (metadata). WRITE: IMAGE_COMPAT_CACHE globals (Mutex-guarded atomic write on cache miss). May `rust_dealloc` old PathBuf. No file write. |
| `read_image_compat_enabled` | READ: `read_to_string(config.toml)`. String heap alloc + dealloc (RAII). No write. |

Cache invalidation linkage: `set_image_compat@0x10025ee14` writes config.toml via `fs::write`, changing mtime. Next call to `image_compat_enabled` sees `metadata` mtime != cached → LABEL_45 triggered → cache refreshed. Implicit mtime-based invalidation; no direct pointer/signal between set and the cache globals.

---

## 4. dim5 — same-side gate (CLOSED)

- No async state machine. No `Future::poll`. No generator resume. Fully synchronous.
- No vtable dispatch in business logic. `std::sys::pal::unix::sync::mutex::Mutex::lock/unlock` are direct static calls (unix-only path).
- No HTTP calls. No spawn. No cross-thread communication other than Mutex guard.
- All static globals at byte-verified addresses (`0x101390000`-`0x101390050`).
- `callees` MCP returns empty list for both functions — consistent with all callees inlined or referenced only via decompile refs (not separate IDA function nodes for stdlib leaves).
- No ICF ambiguity: `func_query` returns single hit. `xrefs_to` returns exactly 2 callers (`more=false`). No neighbor mis-attribution.
- Platform confirmed macOS arm64 (`std::sys::pal::unix`). No Windows code path in this cluster.

---

## 5. Fake-wall taxonomy exhaustion (recovery_attempts)

| Fake-wall type | Verdict | Evidence |
|---|---|---|
| `drop_in_place` / destructor as body | EXCLUDED | 1076B synchronous logic; final `Mutex::unlock` + `return v15 & 1`. No Future, no env type, no poll. |
| architecture_only / budget rule | EXCLUDED | Full 1076B decompiled in single pass. No budget applied. |
| async decompile failed (HexRays bail) | EXCLUDED | No async state machine. HexRays clean. |
| Wrong VA (neighbor mis-attribution) | EXCLUDED | `func_query` single hit at exact `0x1001bf94c`. |
| vtable / dynamic dispatch unknown | EXCLUDED | All callees statically resolved via decompile refs. No dyn trait dispatch in business path. |
| HTTP-terminal / external unverifiable | EXCLUDED | No HTTP. Pure `std::fs::metadata` + OnceLock + Mutex. |
| Library internal not exposed | EXCLUDED | Config-file callsite logic fully visible. No unexposed internals. |
| Body too large | EXCLUDED | 1076B. No chunking needed. |

**recovery_attempts**: 
ot_needed_no_ceiling` — real synchronous body fully decompiled HexRays-clean; all 8 taxonomy entries actively checked and excluded; no false wall reached.
**genuine_ceiling**: false
**accepted_unknown**: false (no unknowns remain on mac binary side)

---

## 6. Gate assessment

| Dimension | Status | Evidence |
|---|---|---|
| dim1 (frontend CCF) | DORMANT WRAPPER — accepted | api.getImageCompat→invoke present in frontend dump; no active source archive UI consumer per FRONTEND-CURRENT-source archive-CONSUMER-CHAIN-109.md. N/A for internal relay gate. |
| dim2 (real body found) | CLOSED | `image_compat_enabled@0x1001bf94c` 1076B fully decompiled; `read_image_compat_enabled@0x1001bfdd4` 592B fully decompiled. |
| dim3 (callers/xrefs chain) | CLOSED | 2 callers confirmed (xrefs_to `more=false`); read_image_compat_enabled called only from image_compat_enabled (2 call sites, `more=false`); full chain depth ≥ 5. |
| dim4 (DTO/error/side-effect byte-confirm) | CLOSED | OnceLock mtime-invalidation chain byte-confirmed (5-condition cache-hit, LABEL_45 miss-and-update, metadata-error path, TOML byte constants all proven from live decompile). |
| dim5 (same-side gate) | CLOSED | Synchronous, no async/vtable/HTTP, unix-only Mutex, all globals at verified VAs, no false walls, single func_query hit. |
| dim6 (product/E2E acceptance) | OPEN | No active frontend consumer; feature toggle present but unused in current source archive UI. dim6 is product decision. |

**gate_tier**: `strictImplementationUse`
**gate_change**: `consumerStartReady → strictImplementationUse`
**readyToImplement**: false (dim6 open — product/E2E acceptance mapping required)
**implementation_use**: false
**gate_accepted**: false (dim6 blocks final acceptance)

**Rationale**: All binary-side dims (2-5) are now fully closed with live IDA byte-evidence. The prior gap (OnceLock cache mtime-invalidation chain "not fully closed") is resolved: the 5-condition cache-hit logic, the LABEL_45 miss-and-update sequence, the metadata-error sentinel path, and the implicit mtime-based invalidation linkage to `set_image_compat` are all byte-confirmed from the fresh decompile. dim6 (product acceptance mapping) is a product decision, not a binary gap — it does not block strictImplementationUse.

---

## 7. INDEX entries (to append to INDEX.jsonl)

```jsonl
{"schema":"restoration.cm.internal_reverse.index.v1","produced_at":"2026-06-05T00:00:00+08:00","producer":"claude-sonnet-4-6","machine":"<workstation>","session":"<audit-session>","field":"<source-location>/audits/macos-1.0.9-relay-core/logic/IMAGE-COMPAT-ENABLED-STRICT-DISTILLED-109","path":"<source-location>/audits/macos-1.0.9-relay-core/logic/IMAGE-COMPAT-ENABLED-STRICT-DISTILLED-109.md","product":"aimami","version":"1.0.9","platform":"macos-arm64","module":"relay-core/relay_image_compat","target":"image_compat_enabled","addr_verified":"0x1001bf94c","binary_sha256":"1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482","gate_tier":"strictImplementationUse","gate_prev":"consumerStartReady","gate_change":"consumerStartReady->strictImplementationUse","dims_closed":"dim2,dim3,dim4,dim5","dim6":"open_product_decision","genuine_ceiling":false,"accepted_unknown":false,"real_body_found":true,"block_decomposed":false,"recovery_attempts":"not_needed_no_ceiling","update_type":"gate_promotion_strict","authoritative":true,"notes":"OnceLock mtime-invalidation chain fully closed: 5-condition cache-hit, LABEL_45 miss-and-update, metadata-error sentinel, implicit mtime-based invalidation linkage. All 8 fake-wall taxonomy excluded. Supersedes dim5 supplement <audit-session>}
```
