# get_cached_display_snapshot — Distilled Evidence (macOS 1.0.9)

**Target**: `codexmate_lib::commands::accounts::get_cached_display_snapshot` @ `0x1001e45dc`
**Platform**: macOS arm64
**Binary SHA256**: `1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482` (SOT `.app` == `_ida.app`, byte-verified this pass)
**Session**: <audit-session>
**Machine**: <workstation>
**Producer**: claude-opus-4-8
**Produced**: 2026-06-04
**Owner-gate**: ALLOW / write_mode=owner (bundle manifest owner <workstation> == this machine; exit 0)
**gate_tier**: strictImplementationUse — dim1-5 closed; dim6 (test/acceptance mapping) is source archive-side, out of reverse scope
**is_upstream**: true (display-snapshot cache fast-path is part of the upstream codex-cli runtime-snapshot/tray subsystem; cache writer `broadcast_runtime_snapshot` @ 0x1001e3858 already documented is_upstream=true)

> **Companion to `USAGE-ONLY-RUNTIME-SNAPSHOT-DISTILLED-109.md`.** Same accounts cluster, same OnceLock<Mutex<…>> cache subsystem. That doc covers the usage-only refresh worker; **this doc covers the read fast-path `get_cached_display_snapshot` @ 0x1001e45dc** — the cheap cache reader that lets `create_tray_menu` and `resolve_cached_auto_switch_service_state` skip the expensive `bootstrap_cache::load` rebuild. Previously uncovered (absent from REVERSE-STATUS.md / task-plan.json / INDEX.jsonl before this pass).

---

## Classification (important)

`get_cached_display_snapshot` @ `0x1001e45dc` is **NOT a directly-registered Tauri IPC command**. It is a **shared synchronous CACHE-READ FAST-PATH helper** behind the runtime-snapshot display cache. Positive evidence:

- Owner symbol `__ZN13codexmate_lib8commands8accounts27get_cached_display_snapshot17h21d457d265f3c81cE`, size **0x198 = 408 B**, `has_type=true`. `func_query(get_cached_display_snapshot)` returns **exactly one** function (no ICF twin, no shim/body split).
- **No Tauri command wrapper**: `func_query(name_regex='(__cmd__|wrap).*get_cached_display_snapshot|get_cached_display_snapshot.*(wrap|cmd)')` = **EMPTY**. No `__cmd__get_cached_display_snapshot`.
- **No `invoke()` data-xref / handler-table entry**: `xrefs_to 0x1001e45dc` = exactly **2 code xrefs, zero data xrefs**. A registered command would have a data reference from a `generate_handler` dispatch table; this has none.
- Reached only via two backend callers (xrefs_to = 2 sites):
  1. **`create_tray_menu` @ 0x10033124c** (call site `0x10033127c`) — the registered tray-menu build command. Consumed by `refresh_tray_menu` @ 0x100331688.
  2. **`resolve_cached_auto_switch_service_state` @ 0x1001e8e68** (call site `0x1001e8e94`) — accounts auto-switch helper. Reached from `tauri::ipc::InvokeResolver::respond_async_serialized_inner::{{closure}}` @ 0x100126f38 (a registered command's async IPC resolver) **and** from `refresh_usage_snapshot_with_retry` @ 0x1001e7eec (the registered `refresh_usage_snapshot` command).

So this is the **fast read leg of the runtime-snapshot fast/slow architecture**: cheap cache read here vs expensive `bootstrap_cache::load` rebuild on miss. The task-header "IPC command" label is the surface description; the binary shows a shared cache-reader invoked by registered command owners, not its own registered command.

---

## Signature & Return

```
__int64 __usercall get_cached_display_snapshot(
    __int64 *a1@<X8>)   // sret: CoreSnapshotPayload-shaped, 680 B (0x2A8)
```

- `__usercall`, single sret arg in X8 (caller-allocated return slot). No `&Repository` arg — it reads a process-global cache, not the Tauri-managed state.
- Return shape: a tagged value whose discriminant is at offset 0 of `*a1`.
  - **Cache MISS / empty**: `*a1 = 3` (discriminant 3 = "no cached snapshot" sentinel; only 8 bytes written).
  - **Cache HIT**: full `CoreSnapshotPayload` clone (`0x10020cfd4`) memcpy'd into `*a1` (0x2A8 = 680 B).

---

## Behavior (synchronous, no await)

Reads the process-global cache `DISPLAY_SNAPSHOT_CACHE` (`std::sync::OnceLock<Mutex<…>>` @ `0x101390058`; inner Mutex/box `qword_101390060`; payload-with-tag at `qword_101390070`):

1. **Init the OnceLock** — `atomic_load_explicit(&DISPLAY_SNAPSHOT_CACHE, acquire)`; if set, `OnceLock::initialize` (`0x100d868a4`); then `atomic_load_explicit(&qword_101390060, acquire)` and, if 0, `OnceBox::initialize` (`0x100d7fec8`) for the inner Mutex box.
2. **Lock the inner Mutex** — `std::sys::pal::unix::sync::mutex::Mutex::lock` (`0x100d3499c`). Poison-checked via `GLOBAL_PANIC_COUNT` (`0x101399888`) + `is_zero_slow_path` (`0x100db0a84`); sets the poison flag byte (`byte_101390068`) when a panic count is observed unwinding.
3. **Read discriminant** `qword_101390070`:
   - **== 3** → write `*a1 = 3` (cache-empty sentinel), unlock, return. (No payload copy.)
   - **!= 3** → `CoreSnapshotPayload::clone` (`0x10020cfd4`) into a 680-B stack buffer (`__src[680]`), then `memcpy(a1, __src, 0x2A8)` (680 B), unlock, return.
4. **Unlock** — `Mutex::unlock` (`0x100d349b8`) on every exit path.

**No HTTP, no fs, no Tauri event, no spawn, no SQLite.** Pure in-memory cache read + deep clone. The cache is **populated by `broadcast_runtime_snapshot` @ 0x1001e3858** (which "updates DISPLAY_SNAPSHOT_CACHE" per its SoT line) and by `bootstrap_cache::load` on the slow path.

### Static-image confirmation of cache layout
`get_bytes 0x101390058` (static image) = `0x03 00 00 … 00` (32 B): the OnceLock guard byte is `0x3` (INCOMPLETE state) and `qword_101390070` is 0 — i.e. the cache is **BSS-resident, runtime-populated**, never baked into the binary. The runtime `qword_101390070 == 3` check is the inner enum/`Option` **empty/None** variant tag, distinct from the OnceLock guard.

---

## Consumer fast/slow architecture (proven from both callers)

Both callers use the identical pattern — call `get_cached_display_snapshot`, branch on `tag == 3`:

**`create_tray_menu` @ 0x10033124c** (has existing SOURCE_ARCHIVE comment "chooses cached display snapshot, bootstrap cache, or bootstrap tray menu"):
- `get_cached_display_snapshot(__src)`; `if (__src[0] != 3)` → **fast hit**: `memcpy 0x2A8` → `create_tray_menu_from_snapshot` (`0x100333924`) → `drop_in_place<CoreSnapshotPayload>` (`0x100342a38`) → return menu.
- `if (== 3)` → **miss**: `StateManager::try_get` (`0x10034b0fc`, fetches the Tauri-managed `Repository`) → Mutex lock (poison panic msg `"poisoned lock: another task failed inside"` @ 0x100f305e9) → `bootstrap_cache::load` (`0x1001beef8`, slow rebuild into a 696-B buffer) → if rebuilt tag != 3 → `create_tray_menu_from_snapshot`, else → `create_bootstrap_tray_menu` (`0x100332790`, empty default menu).

**`resolve_cached_auto_switch_service_state` @ 0x1001e8e68**:
- `get_cached_display_snapshot(v28)`; `if (v28[0] == 3)` (miss) → `StateManager::try_get` Repository → Mutex lock → `bootstrap_cache::load` → returns service-state (4 on empty). On hit (`!= 3`) → uses the cached `CoreSnapshotPayload` directly, then drops nested types.

This is the canonical fast/slow snapshot pattern: **`get_cached_display_snapshot` = cheap O(clone) read; `bootstrap_cache::load` = expensive rebuild from Repository.**

---

## Call-tree (depth ≥ 5, terminals reached)

```
get_cached_display_snapshot (0x1001e45dc)
├─ std::sync::OnceLock::initialize (0x100d868a4)                           [lazy cache init]
├─ std::sys::sync::once_box::OnceBox::initialize (0x100d7fec8)             [inner Mutex box init]
├─ std::sys...Mutex::lock (0x100d3499c) / unlock (0x100d349b8)             [sync primitive, poison-checked]
├─ std::panicking::panic_count::is_zero_slow_path (0x100db0a84)            [poison detection]
└─ CoreSnapshotPayload::clone (0x10020cfd4)   [on cache HIT]
    ├─ <alloc::string::String as Clone>::clone (0x100d62688)  ×18 fields
    ├─ <alloc::vec::Vec<T> as Clone>::clone (0x1004ce3c0)     [trailing Vec at a2+82]
    └─ memcpy (0x100db5318)  →  memcpy(a1, payload, 0x2A8)                 [response_serialize, 680 B]
```

**terminated_reason**: `response_serialize` (memcpy 0x2A8 of cloned CoreSnapshotPayload into sret) + `error_return` (tag-3 cache-empty sentinel written to `*a1`). No external call / persistence in this body — the cache is in-memory; the producing writes live in `broadcast_runtime_snapshot` / `bootstrap_cache::load`.

---

## DTO

- **Response**: `CoreSnapshotPayload`-shaped value, sret 680 B (0x2A8). Discriminant at `*(u64*)a1`: `3` = cache-empty (None/Empty), else cloned payload.
- **Input**: none (no args besides the sret slot). Reads process-global `DISPLAY_SNAPSHOT_CACHE`.
- **`CoreSnapshotPayload` field shape** (from `CoreSnapshotPayload::clone` @ 0x10020cfd4 + consumer drop sequences): a large (680 B) struct containing —
  - top-level discriminant byte at offset 0 (the `== 2` checks inside `clone` are nested `Option::None` sentinels; `0x8000000000000000` = niche-optimized `None` for `String`/Vec fields);
  - **18+ `String` fields** (cloned at struct offsets +18,+22,+25,+28,+31,+34,+37,+42,+45,+48,+51,+54,+57,+60,+64,+69,+72,+76);
  - an `AppStatusPayload` sub-struct (dropped via `0x1001fd3a0`);
  - `Vec<AccountSummary>` (336-byte stride; drop `0x1004c19b4`);
  - `Option<McpServerListPayload>` (drop `0x100344e40` / `0x1001fe120`);
  - `Vec<InstalledSkillSummary>` (184-byte stride; drop `0x1004c31f8`);
  - trailing `Vec<T>` cloned at +82 (offset 0x290 region).
- This is the same `CoreSnapshotPayload` carried by the runtime-snapshot/bootstrap subsystem (consistent with the `CoreEnvelope<CoreSnapshotPayload>` 760-B return of the sibling usage-only worker — here the bare payload is 680 B, the envelope adds the warnings Vec).

## Error paths

- **Cache empty** → not an error: discriminant `3` returned; callers treat it as "miss" and fall back to the slow `bootstrap_cache::load` path. No CoreError, no panic.
- **Mutex poisoned** → the body sets the poison byte (`byte_101390068 = 1`) when it observes a panic unwinding through the lock, but still returns the (possibly empty) value — it does **not** itself panic. (The consumer `create_tray_menu`'s separate Repository-Mutex lock has the explicit `"poisoned lock: another task failed inside"` → `unwrap_failed` panic; that belongs to the slow path, not to `get_cached_display_snapshot`.)
- No IO / HTTP / parse error classes exist in this body (pure in-memory read).

## Side effects

- **Read-only** w.r.t. persistent state: reads process-global `DISPLAY_SNAPSHOT_CACHE`.
- Lazy `OnceLock`/`OnceBox` initialization of the cache cell (first-call only).
- Poison-flag byte set on observed unwind (`byte_101390068`).
- **No** fs, **no** HTTP, **no** Tauri event, **no** spawn, **no** SQLite, **no** registry. (Those side effects belong to the cache *writers*: `broadcast_runtime_snapshot` emits `"runtime-state-updated"`; `bootstrap_cache::load` reads Repository.)

---

## dim1 (frontend)

- The display snapshot surfaces through the registered tray-menu refresh and auto-switch/usage commands, not through a dedicated `invoke("get_cached_display_snapshot")` string. Consumers reached from the frontend: `refresh_tray_menu` → `create_tray_menu` (tray rebuild) and the `refresh_usage_snapshot` / auto-switch resolver paths (`resolve_cached_auto_switch_service_state` is called from the IPC InvokeResolver async closure).
- No `G("get_cached_display_snapshot")` / `invoke("get_cached_display_snapshot")` exists in the frontend — it is a backend-internal cache-read fast path. UI state it backs: tray menu contents + cached auto-switch service state shown in overview.
- dim1 status: **shared cache-read core behind active source archive consumers** (tray refresh + usage/auto-switch UI), with no own 1:1 command name.

---

## Fake-wall taxonomy exhaustion (recovery_attempts)

**No accepted_unknown / genuine_ceiling claimed. Real synchronous body fully recovered (HexRays-clean, single pass).** Taxonomy checked, none applicable:

- **drop_in_place ≠ async body**: owner is the named, typed, complete `get_cached_display_snapshot::h21d457d265f3c81c` (408 B), not a destructor. The `drop_in_place<CoreSnapshotPayload>` symbols (0x100342a38, etc.) are the consumers' payload destructors, not this body.
- **async decompile failed (HexRays bail)**: did NOT occur — full pseudocode in one pass, no bail marker. **Positive proof of synchronous**: `func_query(name_regex='get_cached_display_snapshot.*(poll|async_fn_env|closure|generator)')` = **EMPTY** → no state machine, no `::poll`, no `async_fn_env`. Straight-line OnceLock-init → lock → tag-branch → clone/memcpy → unlock; no `.await` discriminant.
- **wrong VA / ICF size guess**: `func_query(get_cached_display_snapshot)` = **exactly one** fn @ 0x1001e45dc (0x198, has_type=true). No ICF twin, no neighbor confusion. Address verified against the live IDB symbol.
- **architecture_only / budget rule**: no budget override needed; 408 B decompiled whole, no `basic_blocks` chunking.
- **body_too_large**: 408 B — trivially within single-decompile range.
- **vtable / dynamic dispatch**: all callees are direct, demangled, statically-bound (OnceLock/OnceBox init, Mutex lock/unlock, CoreSnapshotPayload::clone, memcpy) — resolved by name in decompile refs. No trait object / fat pointer.
- **HTTP-terminal external-only**: N/A — no network in this body.
- **reqwest/rustls library internals**: N/A — no network.
- **caller_disambiguation**: N/A — not ICF-folded (single owner, distinct VA).

---

## Gate Summary

| dim | status | evidence |
|---|---|---|
| dim1 frontend CCF/UI | ✅ | shared cache-read core behind tray-refresh (`refresh_tray_menu`→`create_tray_menu`) + usage/auto-switch UI; no own invoke string |
| dim2 owner/pseudocode | ✅ | A-level full decompile @ 0x1001e45dc (408 B / 0x198), HexRays-clean, IDA comment written |
| dim3 deep call-tree | ✅ | depth ≥ 5; OnceLock/OnceBox init + Mutex lock/unlock + CoreSnapshotPayload::clone(String×18 + Vec) + memcpy 0x2A8 terminal |
| dim4 interface/DTO/error/side-effect | ✅ | sret 680 B CoreSnapshotPayload; tag-3 cache-empty sentinel; read-only side effect; no IO/HTTP; cache writer = broadcast_runtime_snapshot |
| dim5 same-platform gate | ✅ | macOS arm64; SHA `1db044e8efab…` verified SOT==IDB; Windows independent (Unknown, not inferred) |
| dim6 test/acceptance | ⬜ | source archive implementation-side acceptance mapping, out of reverse scope |

**ceiling**: strictImplementationUse — dim1-5 closed; dim6 is source archive-side. Not a real wall — full real body recovered, async decisively excluded by positive proof.

---

## Evidence Paths

- IDB: `<source-location>/source-binary/AiMaMi 1.0.9_ida.app/Contents/MacOS/AiMaMi.i64`
- IDA comment written: `0x1001e45dc` (owner)
- Cache writer (already documented): `broadcast_runtime_snapshot` @ 0x1001e3858 (REVERSE-STATUS.md line 140)
- Sibling worker (same cluster): `logic/USAGE-ONLY-RUNTIME-SNAPSHOT-DISTILLED-109.md` (load_usage_only_runtime_snapshot @ 0x1001e74d0)
- Consumers: `create_tray_menu` @ 0x10033124c, `resolve_cached_auto_switch_service_state` @ 0x1001e8e68, slow-path `bootstrap_cache::load` @ 0x1001beef8
- Companion machine-readable: `logic/CACHED-DISPLAY-SNAPSHOT-109.json`
