# create_bootstrap_tray_menu — DISTILLED Evidence (macos 1.0.9)

## Identity

| Field | Value |
|---|---|
| function | `codexmate_lib::commands::tray_menu::create_bootstrap_tray_menu` |
| addr | `0x100332790` |
| size | 1968B / 0x7b0 |
| binary SHA | `1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482` |
| platform | macos-arm64 |
| session | <audit-session> [<workstation> sonnet] |
| produced_at | 2026-06-04 |
| callers | 2: `create_tray_menu@0x10033124c`, `FnOnce::call_once vtable.shim@0x100334ce8` |

## Ledger / Ownership

- Owner-gate: ALLOW / write_mode=first (no prior INDEX owner, no bundle manifest machine owner)
- Bundle: `macos-1.0.9-tray` (manifest: gate_accepted=true, readyToImplement=true — this function is additive logic inside that accepted bundle)
- AGENTS.md: additive output allowed to `logic/*.md`
- Authoritative: true (first distilled coverage of this function)

## dim1 — Frontend CCF / IPC Binding

This function is NOT a directly-registered IPC command. It is an internal menu construction helper.

- `func_query(create_bootstrap_tray_menu.*(async_fn_env|poll|closure|generator))` = only one closure found: `hb0d0764ade886468@0x1003331d8` — the MenuBuilder.build result-error handler, not a Future poll.
- No `__cmd__` wrapper found. No handler-table data xref.
- **Callers (xrefs_to 0x100332790):**
  1. `codexmate_lib::commands::tray_menu::create_tray_menu @ 0x10033124c` (calls at `0x100331450`) — the main tray refresh path; invoked when runtime snapshot is already available.
  2. `core::ops::function::FnOnce::call_once{{vtable.shim}} @ 0x100334ce8` (calls at `0x100334f78`) — the boot-spawn vtable shim; this is the pre-auth tray initialization path during bootstrap (app startup before accounts are loaded).
- **dim1 status**: internal-impl, no own IPC invoke string. Pre-auth bootstrap entry: called from `call_once` shim @ 0x100334ce8 during bootstrap before snapshot available. The sibling `create_tray_menu` calls it again once snapshot is ready.
- Tray menu item IDs confirmed from rodata `@0x100F2F20B`: `tray_bootstrap_title`, `tray_bootstrap_subtitle`, `tray_codex_router_status`, `tray_quit`, `tray_account:` (prefix).

## dim2 — Owner Decompile

Full clean HexRays decompile: 1968B body, `__usercall` sret signature returning `MenuBuilder`-wrapped `Result`.

**Signature:**
```
_QWORD *__usercall create_bootstrap_tray_menu(
    __int64 a1@<X0>,   // AppHandle ptr
    __int64 *a2@<X8>)  // sret out -> Result<Menu, tauri::Error> (3 qwords)
```

**Logic sequence (synchronous, no await):**

1. **MenuBuilder init**: Stack-init `MenuBuilder` in `v58[0..31]` with `xmmword_100EDC0E0` default state.

2. **MenuItem 1 — tray_bootstrap_title** (string from rodata pool `@0x100F2F20B`):
   - `tauri::menu::MenuItem::with_id(&v44)` → on Ok: Arc-refcount clone into MenuBuilder Vec via `RawVec::grow_one` + 48B stride write. On Err: `Display::fmt` + `unwrap_failed` + drop.

3. **MenuItem 2 — tray_bootstrap_subtitle** (rodata pool):
   - Same pattern: `with_id(&v47)` → clone + append into Vec at `v55[0]` offset.

4. **MenuItem 3 — tray_codex_router_status** (id string `@0x100F2F28C` = `"tray_codex_router_status..."`):
   - Same pattern: `with_id(&v54)` → clone + append into Vec at `v51[0]` offset.

5. **append_codex_router_section call** (`@0x1003332a4`):
   - `codexmate_lib::commands::tray_menu::append_codex_router_section(v58_out, a1/*AppHandle*/, v38/*item_vec*/)` — conditionally adds relay-state menu item (separator + relay provider count label, formatted as `"#"` + integer via `format_inner`).
   - Inside `append_codex_router_section`: calls `tauri::state::StateManager::try_get` — if no `RelayManager` state registered yet (pre-auth): copies item-vec unchanged and returns (no relay section). If `RelayManager` present: `RelayManager::snapshot` + `RelayState::clone` → reads provider count (`v7 = v49`) → formats count string → `MenuItem::with_id` for `unk_100F2F28C` (`"tray_codex_router_status"` label area) + appends. Label pattern: relay count=0 → `"no relay provider configured for codex"` (24B heap `@xmmword_100F2F181`); count=None → 46B message; count=1 → 52B `"1 relay..."`.

6. **separator** (`tauri::menu::builders::menu::MenuBuilder::separator`) — appended after codex router section.

7. **MenuItem 4 — tray_quit** (rodata `@0x100F2F28C` offset: `"tray_quit"`):
   - `with_id(&v62)` → on Ok: Arc-clone + append. On Err: same Display+unwrap path.

8. **MenuBuilder.item + build**:
   - `MenuBuilder::item(&v44, &v47, &v62, &off_1012C7A50)` — assembles final quit item.
   - `MenuBuilder::build(v41, &v44)` → Result<Menu>:
     - On Ok: calls `create_bootstrap_tray_menu::{{closure}}::hb0d0764ade886468(&v54, v58)` which formats any `tauri::Error` via `Display::fmt` + `unwrap_failed` (panic on Err). Returns sret `*a2 = (discriminant=0x8000000000000000, ptr, len)` for success.
     - On Err (build fails): same `Display::fmt` + `unwrap_failed` + drop path.

9. **Arc release chain**: refcounts for `MenuItem` Arcs decremented with `atomic_fetch_add_explicit(-1, release)` + `__dmb(9)` + `Arc::drop_slow` if count reaches 1.

## dim3 — Call Tree

```
create_bootstrap_tray_menu@0x100332790
  ├── tauri::menu::MenuItem::with_id@0x1003af5f8  [MenuItem 1: tray_bootstrap_title]
  ├── tauri::menu::MenuItem::with_id@0x1003af5f8  [MenuItem 2: tray_bootstrap_subtitle]
  ├── tauri::menu::MenuItem::with_id@0x1003af5f8  [MenuItem 3: tray_codex_router_status seed]
  ├── alloc::raw_vec::RawVec::grow_one@0x100d85bd4  [Vec capacity growth]
  ├── alloc::sync::Arc::drop_slow@0x100196564  [Arc refcount release]
  ├── append_codex_router_section@0x1003332a4
  │     ├── tauri::state::StateManager::try_get@0x10034a8ac  [RelayManager presence check]
  │     ├── RelayManager::snapshot@0x1001cfc44  [relay state snapshot]
  │     ├── RelayState::clone@0x10020cc2c  [relay state clone]
  │     ├── drop_in_place<RelayState>@0x1001fd8fc  [cleanup]
  │     ├── MenuBuilder::separator@0x1003cdb78  [separator before relay item]
  │     ├── tauri::menu::MenuItem::with_id@0x1003aefd0  [relay count label item]
  │     │     └── alloc::fmt::format::format_inner@0x100d60b34  [relay count string fmt]
  │     └── MenuBuilder::separator/item append chain
  ├── MenuBuilder::separator@0x1003cdb78  [separator before quit]
  ├── tauri::menu::MenuItem::with_id@0x1003af5f8  [MenuItem 4: tray_quit]
  ├── MenuBuilder::item@0x1003cd48c  [add quit item to builder]
  ├── MenuBuilder::build@0x1003cd558  [finalize menu]
  └── create_bootstrap_tray_menu::{{closure}}@0x1003331d8  [build error handler / unwrap]
        ├── tauri::error::Error::fmt@0x100b446d4  [Display format]
        ├── core::result::unwrap_failed@0x100db45b0  [panic on build Err]
        └── drop_in_place<tauri::Error>@0x10033d560
```

**Call-tree depth**: 7+ edges. `terminated_reason`: `response_serialize` (MenuBuilder::build produces `Menu` value returned via sret) + `error_return` (unwrap_failed panic on any `tauri::Error` propagation path).

## dim4 — DTO / Error / Side-Effect

### Request DTO (Input)
- `a1: __int64 @ X0` = `AppHandle` pointer (passed to `append_codex_router_section` and `MenuItem::with_id`)
- No IPC argKeys — called internally, not via invoke

### Response DTO (Output)
- `sret a2: __int64*` → `(discriminant @ a2[0], ptr @ a2[1], len @ a2[2])` — `Result<tauri::Menu, String>` shaped (3 qwords):
  - **Success**: `a2[0] = 0x8000000000000000` discriminant (Ok tag), `a2[1..2]` = Menu Arc ptr + data
  - **Err**: `a2[0] = discriminant != 0x8000000000000000`, `a2[1..2]` = String ptr+len from Display-formatted `tauri::Error`
- `create_bootstrap_tray_menu::{{closure}}@0x1003331d8` writes `*(_OWORD*)a1 = v5` (128-bit result) + `*(a1+16) = v6` on the build result path.

### Error Paths
1. `MenuItem::with_id` Err (any of 3+1 items): `tauri::Error::Display::fmt` → `unwrap_failed` → **panic** (no soft error return — bootstrap menu construction is mandatory).
2. `MenuBuilder::build` Err: same panic path via closure `hb0d0764`.
3. `Arc` refcount overflow (`& 0x8000000000000000 != 0`): `__break(1u)` trap — UB/hardware breakpoint (Rust debug assertion).
4. `append_codex_router_section` inner `MenuItem::with_id` Err: `a1[0] = 0x8000000000000000`, returns partial menu (relay section omitted).

### Side Effects
- **No filesystem I/O** — no `write_atomic`, no `rebuild_registry`, no sqlite.
- **No network** — no HTTP client, no relay proxy launch.
- **No Tauri event emit** — no `emit` / `emit_to` call.
- **No spawn** — no `thread::spawn`, no `tokio::spawn`.
- **Read-only state access**: `tauri::state::StateManager::try_get` for `RelayManager` (read-only snapshot); `RelayManager::snapshot` clones state — no mutation.
- **Heap allocation**: `RawVec::grow_one` for `Vec<MenuItem>` + format string allocation (`__rust_alloc` for relay count label).
- **Arc refcount mutations**: `atomic_fetch_add_explicit` for MenuItem Arc clone/release — no shared app state mutated.

## dim5 — Same-Platform Gate

Verified on macOS arm64 IDB, binary SHA `1db044e8...` (confirmed via IDA `server_health` + `shasum -a 256`). All callees have demangled Rust symbols, directly confirmed in this IDB session.

## Fake-Wall Taxonomy Exhaustion

| Taxonomy item | Check result |
|---|---|
| `drop_in_place` / destructor mistaken as body | NOT this body. `drop_in_place<tauri::Error>@0x10033d560` is a callee (cleanup), not the owner. `func_query(create_bootstrap_tray_menu)` = exact match 0x100332790 0x7b0. |
| `architecture_only` / budget rule self-limit | 1968B body fully decompiled in single pass, no budget override needed. |
| `async decompile failed` HexRays bail | NOT async. `func_query(create_bootstrap_tray_menu.*(async_fn_env\|poll\|closure\|generator))` = only the named error-handler closure hb0d0764 — no Future poll, no state machine. All `.await` patterns excluded. |
| Wrong VA / ICF adjacent function | `func_query(create_bootstrap_tray_menu)` exact match = single entry 0x100332790 0x7b0, `has_type=true`. No ICF twin. `xrefs_to(0x100332790)` = 2 code xrefs, 0 data xrefs — distinct from siblings. |
| vtable / dynamic dispatch unresolvable | All callees are direct BL (demangled static symbols). No trait-object fat-pointer. `append_codex_router_section` is a direct `BL` call to named Rust symbol. |
| `HTTP-terminal` / external transport | No HTTP client in this body. `append_codex_router_section` reads relay state snapshot in-memory only — no network call. |
| Library internals opaque | Not applicable — `MenuItem::with_id`, `MenuBuilder::build` etc. are Tauri framework calls whose inputs/outputs are fully observable at the callsite in the decompile. |
| Body too large (42KB+) | 1968B — single pass, no chunking needed. |

**`recovery_attempts`**: not needed — no ceiling encountered. All 8 taxonomy items definitively excluded by positive IDA proof (single-pass decompile, exact func_query match, synchronous straight-line logic, 0 async env functions).

**`genuine_ceiling`**: false. Full body recovered. dim6 (runtime/acceptance mapping) is the only open lane — source archive-side, not a binary cap.

**`real_body_found`**: true.
**`was_false_wall`**: none.

## Gate Assessment

| Dim | Status | Evidence |
|---|---|---|
| dim1 | closed — internal-impl bootstrap path | `call_once` vtable shim @ 0x100334ce8 (bootstrap); `create_tray_menu` @ 0x10033124c (refresh). Tray item IDs confirmed from rodata. |
| dim2 | closed — full HexRays decompile 1968B | Single-pass clean decompile; signature, MenuBuilder sequence, Arc management all confirmed. |
| dim3 | closed — call tree depth 7+, terminated | `MenuBuilder::build` → response_serialize (Menu sret) + error_return (unwrap_failed panic). |
| dim4 | closed — DTO/error/side-effect | AppHandle in, Result<Menu> sret out; 4 error panic paths; read-only relay state; heap allocation only; no FS/net/event/spawn. |
| dim5 | closed — same-platform mac verified | SHA match confirmed, all symbols live IDB. |
| dim6 | open — source archive runtime/acceptance scope | Not a binary cap. |

**gate_tier**: `strictImplementationUse` (dim1–5 closed; dim6 open — source archive-side runtime acceptance only).

## Summary

`create_bootstrap_tray_menu @ 0x100332790` is the **pre-auth tray state machine entry point** called during AiMaMi bootstrap (via `FnOnce::call_once` vtable shim @ 0x100334ce8). It constructs the initial system tray menu before any account snapshot is available: 3 static MenuItem seeds (tray_bootstrap_title, tray_bootstrap_subtitle, tray_codex_router_status placeholder), then delegates to `append_codex_router_section` which conditionally adds a relay provider count label if `RelayManager` state is registered, then adds a separator and the quit item, finalizes via `MenuBuilder::build`. All MenuItem construction panics on error — bootstrap menu is mandatory. Synchronous; no async, no IPC, no FS, no network, no event emit. The companion `create_tray_menu @ 0x10033124c` is the post-snapshot refresh path that calls this function again once accounts are loaded.
