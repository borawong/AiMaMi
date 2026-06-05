# DISTILLED: tray_menu::append_codex_router_section (macos 1.0.9)

**session**: <audit-session>
**produced**: 2026-06-04  
**binary SHA**: 1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482  
**idb_saved**: true  
**authoritative**: false (additive logic/*.md inside bundle macos-1.0.9-tray owned by <workstation>; no canonical top-level file touched)

---

## dim1 — Owner / Identity

| Field | Value |
|---|---|
| symbol | `codexmate_lib::commands::tray_menu::append_codex_router_section` |
| addr | `0x1003332a4` |
| size | 0x554 = 1364 B |
| is_async | false — `func_query(async_fn_env|poll|generator)` = EMPTY; straight-line synchronous |
| real_body_found | true |
| decompile_status | SUCCESS — full HexRays pseudocode, single pass, clean |
| callers | `create_bootstrap_tray_menu @ 0x100332790` (xref @ 0x100332a2c) + `create_tray_menu_from_snapshot @ 0x100333924` (xref @ 0x1003341d4) |
| caller_count | 2 (confirmed via xrefs_to, more=false) |

---

## dim2 — Backend Pseudocode (full logic)

`append_codex_router_section(a1: *mut MenuBuilder, a2: *AppHandle, a3: *MenuBuilder_src)` — synchronous.

**Step 1 — State acquisition:**
```
result = StateManager::try_get(AppHandle[136+4872+16])   // get Arc<RelayManager>
if result == null { copy a3 sret into a1; return; }      // no RelayManager → pass-through, no section appended
RelayManager::snapshot(result, &v59)                     // mutex-locked clone of RelayState into v59
RelayState::clone(&v48, &v59)                            // second clone for label computation
drop RelayState(&v59)  drop RelayState(&v48 clone)       // RAII cleanup
```
The flag `v16 = v52` is a byte field from inside the `RelayState` clone — read from the struct at +0x1C4 relative to stack frame. This is the relay-enabled boolean: `1` = relay feature enabled, `0` = not enabled.  
`v7 = v49` is the relay count (number of relay entries in `RelayState`).

**Step 2 — Separator insertion:**
```
MenuBuilder::separator(&v48, &v59)    // inserts a visual separator item into the builder copy
```

**Step 3 — Label string construction (4-branch on v16 + v7):**

| Branch | Condition | Label string (UTF-8) |
|---|---|---|
| B1 relay_disabled | `v16 == 0` | `"智能路由：未启用"` (24 B @ 0x100F2F181) |
| B2 relay_on_no_entries | `v16 != 0 && v7 == 0` | `"智能路由：已启用 · 暂无中转模型"` (46 B @ 0x100F2F199) |
| B3 relay_on_1_entry | `v16 != 0 && v7 == 1` | `"智能路由：已启用 · 路由 1 个中转模型"` (52 B @ 0x100F2F1C7) |
| B4 relay_on_N_entries | `v16 != 0 && v7 > 1` | `format!("{}个中转模型", v7)` via `alloc::fmt::format` with `#` prefix template @ 0x100EA9456 → `"智能路由：已启用 · 路由 N 个中转模型"` |

All branches heap-alloc the label string via `__rust_alloc` then store as `(ptr, len)` tuple in `v43`.

**Step 4 — MenuItem::with_id construction:**
```
MenuItem::with_id(                                          // h76e8fe6cf3ffsource archive7d (disabled=no-enable variant)
    &v45,                                                   // sret buffer
    a2,                                                     // AppHandle (runtime R param)
    "tray_codex_router_status",                             // item id (0x100F2F28C, 24 B)
    24,                                                     // id len
    label_ptr (v43),                                        // from v43[1], len v43[0]
    1,                                                      // enabled: appears fixed=1
    0                                                       // shortcut/accel: None
) → Result<MenuItem, tauri::Error>
```
First call uses variant `h76e8fe6cf3ffsource archive7d` (label from B1 path).  
Second call (B2-B4 paths after format) uses variant `h161ef7c8385a0b2b`.

**Step 5 — Result handling (both MenuItem calls):**
```
if v45 != Ok sentinel (0x8000000000000025) {
    // Error branch: format tauri::Error as Display string → unwrap_failed panic
    drop tauri::Error(&v45_or_v48)
    write Err sret into a1: discriminant=0x8000000000000000, ptr+len of Display string
    drop MenuBuilder(&v39 or &v48)
    return
}
```
Ok sentinel = `0x8000000000000025` (first word); `0x8000000000000000` = Err discriminant.

**Step 6 — Arc MenuItem ref-counting + append to builder Vec:**
```
Arc::increment_strong_count(MenuItem Arc ptr)   // atomic fetch_add +1
if overflow bit set: __break(1) trap            // Arc overflow guard
RawVec::grow_one if needed                      // Vec capacity grow
write MenuItem (48 B) into Vec slot
Arc::decrement (fetch_add -1); if last: drop_slow
```
MenuItem appended to MenuBuilder's internal Vec.

**Step 7 — Final sret return (Ok path):**
```
*a1 = updated MenuBuilder (ptr/cap/len triple + overflow)
return
```

---

## dim3 — Call Tree

```
append_codex_router_section @ 0x1003332a4
  ├─ StateManager::try_get @ 0x10034a8ac           [relay state access guard]
  ├─ RelayManager::snapshot @ 0x1001cfc44          [mutex-locked RelayState clone]
  │   └─ RelayState::clone @ 0x10020cc2c           [deep clone relay entries vec]
  ├─ RelayState::clone @ 0x10020cc2c               [second clone for label]
  ├─ drop_in_place<RelayState> @ 0x1001fd8fc/0x100342624
  ├─ MenuBuilder::separator @ 0x1003cdb78          [separator item insert]
  ├─ MenuItem::with_id @ 0x1003af5f8               [B1 path]
  ├─ MenuItem::with_id @ 0x1003aefd0               [B2/B3/B4 path]
  ├─ alloc::fmt::format @ 0x100d60b34              [B4 dynamic label format]
  ├─ tauri::Error::fmt (Display) @ 0x100b446d4     [error branch only]
  ├─ unwrap_failed @ 0x100db45b0                   [panic on tauri::Error]
  ├─ RawVec::grow_one @ 0x100d85bd4                [Vec capacity growth]
  ├─ Arc::drop_slow @ 0x100196564                  [Arc dealloc if last ref]
  └─ MenuBuilder::drop_in_place @ 0x100339f88      [builder cleanup on Err path]
```
Call-tree depth: ≥ 7 edges. Terminated reasons:
- `response_serialize`: `*a1 = MenuBuilder` sret on Ok path
- `error_return`: `unwrap_failed` panic (panics on any tauri::Error)

---

## dim4 — DTO / Error / Side-Effect

**Request DTO**: internal-impl — no IPC argKeys. Arguments are:
- `a1`: `*mut MenuBuilder<R,M>` (sret output buffer, caller-owned stack)
- `a2`: `*AppHandle` (pointer into Tauri app state; provides `StateManager`)
- `a3`: `*MenuBuilder<R,M>` (incoming builder state to copy into output on No-RelayManager path)

**Response DTO**: sret `Result<MenuBuilder, String>` written into `a1`:
- Ok: 4×8B = `(ptr, cap, len, overflow)` of MenuItem Vec; discriminant implicit (non-Err)
- Err: `(0x8000000000000000, ptr_str, len_str, ...)` — Err wrapping Display-formatted `tauri::Error`

**Relay state fields accessed (from RelayState clone):**
- `v52` offset `+0x1C4`: relay-enabled boolean (u8)
- `v49` from Vec metadata: relay entry count (usize)
- Vec of RelayEntry objects (208 B each), count up to `v7`; only count used for label, not contents

**MenuItem produced:**
- id: `"tray_codex_router_status"` (24 B, static rodata @ 0x100F2F28C)
- label: one of the 4 static/dynamic strings enumerated in dim2
- enabled: 1 (hardcoded)
- shortcut: None (0)

**Side effects:**
- READ-ONLY relay state (mutex lock → clone → mutex unlock, no writes)
- Heap alloc for label string (stack `v43` holds ptr+len; freed via RAII on Err path)
- Arc refcount atomic ops on MenuItem Arc (increment + decrement)
- Arc::drop_slow dealloc if last reference
- No FS, no HTTP, no event emit, no sqlite, no spawn
- MenuBuilder separator + MenuItem appended to builder (in-memory Vec mutation, caller owns builder)

**Error paths:**
- `StateManager::try_get` returns null → no-op, pass `a3` sret through, return Ok with incoming builder
- `MenuItem::with_id` Err → Display-format tauri::Error → `unwrap_failed` panic (abort)
- Arc overflow (`0x8000000000000000` bit set) → `__break(1)` trap (hardware breakpoint / abort)
- `RawVec::grow_one` OOM → `handle_error` abort (alloc failure)

---

## dim5 — Gate

- dim1 owner: CONFIRMED (unique demangled symbol, single VA 0x1003332a4, 1364 B clean)
- dim2 pseudocode: CONFIRMED (full HexRays, no failure markers, SHA bound)
- dim3 call-tree: CONFIRMED (depth ≥7, 2 terminated_reasons)
- dim4 interface/DTO/error/side-effect: CONFIRMED (all fields byte-resolved from rodata + pseudocode)
- dim5 same-platform gate: CONFIRMED (mac arm64, live IDB 1db044e8)
- dim6 test/acceptance: OPEN (source archive runtime/acceptance only — not a binary cap)

**gate_tier**: `strictImplementationUse` (dim1–5 closed; dim6 open — source archive-side only)  
**genuine_ceiling**: false  
**real_body_found**: true  
**was_false_wall**: none

---

## Fake-wall taxonomy exhaustion

| Fake-wall pattern | Status |
|---|---|
| `drop_in_place` / destructor mistaken for body | EXCLUDED — owner 0x1003332a4 is the real synchronous body; drop_in_place appears only as RAII callee |
| `architecture_only` / budget rule self-limit | EXCLUDED — full 1364 B decompile succeeded in single pass; no budget limit hit |
| `async decompile failed` (HexRays bail) | EXCLUDED — func_query(async_fn_env|poll|generator) = EMPTY; function is synchronous |
| Wrong VA / ICF twin | EXCLUDED — xrefs_to(0x1003332a4) = 2 named callers, both expected; distinct demangled symbol, 0 ICF twin candidates |
| vtable / dynamic dispatch unknown | EXCLUDED — all callees are direct BL to demangled symbols; no trait object dispatch in hot path |
| HTTP-terminal / external transport | EXCLUDED — no HTTP client, no reqwest, no network call; pure in-memory builder mutation |
| Library internals (reqwest/rustls) | EXCLUDED — no lib internal calls; only tauri menu + alloc + relay core |
| Body too large / budget bail | EXCLUDED — 1364 B is well within HexRays budget; single-pass success |

`recovery_attempts`: None needed — no ceiling encountered. All 8 fake-wall patterns trivially excluded.  
`caller_disambiguation_tried`: N/A (no ICF fold candidate).

---

## Binary / IDA session

| Field | Value |
|---|---|
| binary_sha256 | 1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482 |
| idb_path | <source-location>/source-binary/AiMaMi 1.0.9_ida.app/Contents/MacOS/AiMaMi.i64 |
| idb_saved | true |
| ida_comment_appended | @ 0x1003332a4 (func scope) |
| hexrays_ready | true |
| strings_cache_ready | true |
| source | ida |
| confidence | high |
