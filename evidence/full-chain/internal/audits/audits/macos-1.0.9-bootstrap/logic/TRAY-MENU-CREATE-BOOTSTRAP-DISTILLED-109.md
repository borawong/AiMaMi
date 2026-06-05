# DISTILLED: tray_menu::create_bootstrap_tray_menu @ macOS arm64

**Product**: AiMaMi (source archive) 1.0.9  
**Platform**: macOS arm64  
**Binary SHA-12**: 1db044e8efab  
**Owner VA**: `0x100332790`  
**Mangled name**: `__ZN13codexmate_lib8commands9tray_menu26create_bootstrap_tray_menu17h0adb34ec05d5aeddE`  
**Size**: 0x7b0 (1968 B) · 53 basic blocks · 460 instructions  
**Session**: <audit-session>
**Machine**: <workstation>
**Date**: 2026-06-04  
**gate_tier**: strictImplementationUse  
**real_body_found**: true  
**genuine_ceiling**: false  
**accepted_unknown**: false  
**block_decomposed**: false  
**is_upstream**: true (tauri tray menu construction; core pattern shared with upstream Tauri apps)

---

## dim1 — Function Identity (closed)

- NOT async (no `{async_fn_env}`, no `::poll`, no state machine discriminant)
- `func_query(name_regex='create_bootstrap_tray_menu.*poll|async_fn_env')` = EMPTY — async decisively excluded
- Prototype: `_QWORD *__usercall@<X0>(__int64@<X0>, __int64 *@<X8>)` — sret output to X8
- Callers (xrefs_to 0x100332790):
  - `create_tray_menu @ 0x10033124c` (code xref @ 0x100331450): bootstrap-missing-snapshot branch
  - `FnOnce vtable shim @ 0x100334ce8` (code xref @ 0x100334f78): deferred closure call path

---

## dim2 — Owner Body Logic (closed)

The function builds the **bootstrap tray menu** displayed when no runtime snapshot is yet available (i.e., before first `broadcast_runtime_snapshot`). It constructs a `MenuBuilder`, adds 3 fixed menu items, appends the codex-router section, adds a separator, then builds and returns the `Menu`.

### Phase 1 — MenuItem::with_id for header item

```
xmmword_100EDC0E0 → MenuBuilder constructor args (capacity 0x14=20, flags)
MenuItem::with_id(app_handle, id="tray_bootstrap_header", label="当前账号正在...")
  → on success: item added to builder
  → on error: tauri::error::Error fmt'd → unwrap_failed panic (static msg at 0x100f2fc66 len=55)
```

- Menu item ID bytes at `0x100f2f2e4`: `tray_bootstrap_header` (21 bytes ASCII)
- Label continuation bytes at `0x100f2f2e4+21`: `当前账号正在` (partial; full label is from adjacent rodata — "当前账号正在..." status header)
- Arc refcount increment via `atomic_fetch_add_explicit(..., 1, relaxed)` after successful `with_id`

### Phase 2 — Second MenuItem (title)

```
xmmword_100EDEA90 → second MenuItem template
MenuItem::with_id(id="tray_bootstrap_title", ...)
  → appended to builder vec at index 1
```

- ID offset 0 in pool at `0x100f2f261`: `tray_bootstrap_title` (20 B)

### Phase 3 — Third MenuItem (subtitle)

```
MenuItem::with_id(id="tray_bootstrap_subtitle", ...)
  → appended to builder vec at index 2
```

- ID offset 20 in pool: `tray_bootstrap_subtitle` (23 B)

### Phase 4 — append_codex_router_section

```rust
append_codex_router_section(builder, app_handle, item_vec)
```

See dim3 below. This call may add 0, 1, or 2 items depending on RelayManager state. Returns `Result<MenuBuilder, Error>`.

- On `Err` (tag 0x8000000000000000): early return, propagate error
- On `Ok`: continue with separator

### Phase 5 — Separator + fourth MenuItem (quit)

```
MenuBuilder::separator(&builder)
MenuItem::with_id(id="tray_codex_router_status", ...)
  → appended after separator
  → ID at offset 43 in pool: tray_codex_router_status (24 B)
MenuBuilder::separator(&builder)  [second separator]
MenuItem::with_id(id="tray_quit", ...)  [already present in pool after "tray_codex_router_status"]
  → error: not reached on happy path — see LABEL_23 handling below
```

Wait — re-reading the decompile more carefully: after `append_codex_router_section` succeeds:

```
separator → MenuItem::with_id("tray_codex_router_status")  // 4th item
  → on Err: format error, return
  → on Ok: arc-ref ++, append to builder
separator (second) → MenuItem::with_id("tray_quit" or per dynamic id?)
  → on Ok: MenuBuilder::item(builder, quit_item, app_handle_ref)
  → MenuBuilder::build(builder_slot)
    → on Ok (tag==0x8000000000000025 sentinel): write result ptr to X8, return Ok
    → on Err: propagate
  → call closure: create_bootstrap_tray_menu::{{closure}} for final error-path
```

### Phase 6 — Build

```
MenuBuilder::build(builder)
  → returns Result<Menu, Error>
  → Ok: closure `create_bootstrap_tray_menu::{{closure}}` called with (out_slot, builder)
       closure body: formats tauri Error, unwrap_failed or returns Ok(menu_ptr) via output sret slot
  → Err: propagate
```

### Return type

Sret via X8 ptr: `(tag: u64, ptr_or_val: u64, extra: u64)` — Rust Result<Menu, Error> repr. On success tag == `0x8000000000000000` (Ok discriminant), on error tag == 0.

---

## dim3 — field Callee: append_codex_router_section @ 0x1003332a4 (closed)

This is the only source archive-custom logic in this function. It queries the managed state for a `RelayManager`, then conditionally adds a relay-router status item.

### Flow

```
StateManager::try_get(app_handle) -> Option<&RelayManager>
  if None: copy input item_vec to output unmodified, return Ok
  if Some(relay_mgr):
    RelayManager::snapshot(&relay_mgr) -> RelayState (cloned from manager)
    RelayState::clone(&snapshot) -> owned RelayState
    // count active relay entries: field at offset +88 per 208-byte struct element
    // SIMD vectorized loop: zero out slot[+88] per entry (208*n stride)
    // v7 = count of active relay entries
    drop_in_place::<RelayState>(&snapshot_copy)
    drop_in_place::<RelayState>(&snapshot)
    
    // copy input item_vec to working builder
    MenuBuilder::separator(builder, &working_vec)
    MenuItem::with_id(id="tray_codex_router_status", label=<relay_label>)
      → relay_label = match v7:
          0  → alloc 24B → "智能路由：未启用"
          1  → alloc 46B → "智能路由：已启用 · 暂无中转模型"
          N>=2 → format!("#") → alloc 52B → "智能路由：已启用 · 路由 N 个中转模型"
               [uses alloc::fmt::format::format_inner with format string "#" at 0x100ea9456
                and usize Display impl at core::fmt::num::imp]
      → MenuItem::with_id (overloaded: h161ef7c8385a0b2b for labeled variant)
          id_ptr = &unk_100F2F28C = "tray_codex_router_status" (24B, addr confirmed)
          id_len = 24
    → on Err: error return (tag 0x8000000000000000, error ptr)
    → on Ok: append to builder
    → copy builder to output a1
    return Ok
```

### RelayState struct layout (208 B / 0xD0 per entry)

- +88 (offset 0x58): active-relay marker field (zeroed in clone loop = indicates active if nonzero)
- 208 = 0xD0 bytes per relay entry
- Loop: iterates all entries, count of entries with nonzero slot[+88] = `v7`

### MenuItem IDs confirmed in append_codex_router_section

- `tray_codex_router_status` (24 B) at `0x100f2f28c` — used as id_ptr argument

---

## dim4 — DTO / Error / Side-effects (closed)

### DTO: Menu items constructed (all synchronous, no IPC, no fs, no HTTP, no spawn)

| Menu item ID | Label source | Dynamic |
|---|---|---|
| `tray_bootstrap_header` | rodata adjacent to ID pool | No |
| `tray_bootstrap_title` | xmmword_100EDEA90 rodata | No |
| `tray_bootstrap_subtitle` | xmmword_100EDEA90 variant | No |
| `tray_codex_router_status` | relay count-based: 0/1/N label | Yes (relay count) |
| `tray_quit` | pool offset (implicit from builder::item call) | No |
| `tray_account:<N>` | format "#" with account index | Yes (account index) |

Note: `tray_account:` items (with dynamic numeric suffix) are added dynamically via `append_codex_router_section`'s second MenuItem::with_id call (`h161ef7c8385a0b2b` variant with label param).

### Error paths

- `MenuItem::with_id` errors: formatted via `tauri::error::Error::fmt`, then `unwrap_failed` panic with static location string at `0x100f2fc66` len=55
- `MenuBuilder::build` error: propagated via sret Result discriminant
- `StateManager::try_get` None: graceful — no router section added

### Side-effects

- NONE: No file I/O, no HTTP, no tauri event emit, no async spawn, no global state mutation
- Only creates tauri menu objects in-process
- Temporarily clones RelayState (heap alloc + drop within function)
- Arc refcount manipulation for MenuItem handles (normal Tauri Arc<MenuItem> semantics)

---

## dim5 — Caller Context (closed)

- Called from `create_tray_menu @ 0x10033124c` when the display snapshot cache is absent (cache miss = tag==3 sentinel in `get_cached_display_snapshot`)
- Called from `FnOnce vtable shim @ 0x100334ce8` for deferred tray initialization
- NOT an IPC command handler (no `__cmd__` wrapper, no Tauri invoke_handler registration)
- No callers outside these two — this is a pure internal menu-construction helper

---

## dim6 — source archive-side implementation (open)

Not applicable for judgment here: dim6 requires source archive frontend or IPC command use of this output. The function produces a `Menu` object consumed entirely by the tray manager. No frontend observation needed for gate purposes.

---

## Fake-wall Taxonomy Exhaustion

| Fake wall | Status | Evidence |
|---|---|---|
| `drop_in_place` / async body | EXCLUDED | func_query for async_fn_env/poll EMPTY; body is synchronous 1968B |
| `architecture_only` / budget rule | EXCLUDED | Full decompile succeeded, no budget bail |
| `async decompile failed` | EXCLUDED | HexRays produced complete pseudocode |
| Wrong VA / adjacent fn confusion | EXCLUDED | xrefs_to confirms 2 callers pointing directly to 0x100332790 |
| vtable / dynamic dispatch | EXCLUDED | All calls are static direct jumps |
| `HTTP-terminal` / external transport | EXCLUDED | No HTTP, no network, synchronous only |
| Library internal (reqwest/rustls) | EXCLUDED | No network library calls present |
| Oversized body bail | EXCLUDED | 1968B, fully decompiled in single pass |

**recovery_attempts**: n/a — no fake wall was initially mistaken; all 8 taxonomy entries confirmed excluded on first analysis pass.

---

## Gate Summary

| Dim | Status |
|---|---|
| dim1 (identity) | closed |
| dim2 (owner body) | closed |
| dim3 (callees/xrefs) | closed |
| dim4 (DTO/error/side-effect) | closed |
| dim5 (caller context) | closed |
| dim6 (source archive-side) | open (not required for strictImplementationUse) |

**gate_tier**: `strictImplementationUse`  
**genuine_ceiling**: false  
**accepted_unknown**: false  
**block_decomposed**: false  
**callee_count_owner**: 13 (7 unique non-Arc/alloc callees)  
**callee_count_append_section**: 12 (including RelayManager::snapshot, RelayState::clone)
