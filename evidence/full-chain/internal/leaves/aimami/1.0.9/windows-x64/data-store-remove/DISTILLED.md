# DISTILLED (canonical) — cmd_remove_data_store_coroutine (Win x64 1.0.9)

**authoritative**: true
**schema**: restoration.cm.distilled.v1
**session**: <audit-session>
**machine**: <workstation>
**model**: claude-sonnet-4-6
**produced_at**: 2026-06-04
**binary**: AiMaM 1.0.9 win64.exe
**binary_sha256**: a5822387fa3f56dc03893111f4ffdd074daa882e8887ec4e7c394879c0e9fe0b
**binary_size**: 26821632
**binary_format**: pe (x86_64)
**idb**: <source-location>\raw\binary\AiMaM 1.0.9 win64.exe.i64
**owner_va**: 0x1408f1e20
**owner_size**: 0x76b (1899 B)
**basic_blocks**: 58 (complete; no chunking needed)
**callees_count**: 14 (all internal)
**gate_tier**: strictImplementationUse
**real_body_found**: true
**genuine_ceiling**: false
**was_false_wall**: N/A
**caller_disambiguation_tried**: true
**supersedes**: intermediate/aimami/1.0.9/windows-x64/data-store-remove/DEEP-DISTILLED-109-wf-fullsurface-audit.md (authoritative=false)

> Fourth-pass live IDB re-decompile (this session <audit-session>).
> Upgrades intermediate → canonical. Confirms all prior intermediate evidence.
> New additions vs prior pass: (1) 4th await-suspend guard off_14129F590 on a1[2544]
> (tertiary case-0 path, not present in intermediate documentation); (2) frame copy size
> confirmed 0x440 (1088 B) vs prior intermediate entry (which had 0x440 correct in manifest);
> (3) arg-extractor sub_140462500 fully decompiled live including return-tag 6 Ok branch,
> type-mismatch path (sub_1411DBDF0), and all 4 error routes confirmed independently.

---

## dim1 — Frontend CCF

**status**: gap_product_frontend_lane (NOT a binary cap)

No static `invoke("remove_data_store")` callsite is reachable from the coroutine's task-poll drivers (`sub_1409CF080`/`sub_1409ED4B0`, both `caller_count=0`, dispatched via tokio task vtable). `remove_data_store` is not part of the observed 8-command `sessions-analytics` frontend surface and was not found in the windows-x64 frontend bundle evidence collected prior. This is the same class of frontend-lane gap as the sibling `fetch_data_store_identifiers` and `set_dock_visibility` Win coroutines. The absence is a product/frontend-lane evidence gap, **not** a binary recovery ceiling. dim1 remains open; does NOT block `strictImplementationUse`.

---

## dim2 — Owner pseudocode (REAL async coroutine poll body)

`cmd_remove_data_store_coroutine @ 0x1408f1e20` is the genuine Rust async coroutine state machine body. HexRays produced complete pseudocode (`#wind=15` exception states, no bail). **Not a shim or drop_in_place.**

### Async resume discriminants (3-level nested state machine + 4th tertiary guard)

- outer: `a1[2576]` switch (cases 0/1/2/3)
- inner: `a1[2560]` switch (cases 0/1/2/3)
- tertiary: `a1[2552]` switch (cases 0/1/2/3)
- sub-await: `a1[2544]` — 4th suspend-guard checked at LABEL_9 (`v14 = a1[2544]`) before `memcpy(Dst, v1+2376, 0x98)`
- `v55 = -2` / `v17 = -2` — Rust async-generator "not-started/completed" discriminant sentinel at entry

### Suspension point vtables

Four await suspension point markers (resume-guard vtable slots):

| vtable | scope | guards |
|---|---|---|
| `off_14129F6C0` | outer cases 1/2 (via `sub_141208950`/`sub_141208970`) | outermost resume-after-completion panic |
| `off_14129F5F8` | inner cases 1/2 (LABEL_34/LABEL_33) | inner resume-after-completion panic |
| `off_14129F748` | tertiary cases 1/2 (LABEL_256e/LABEL_255f) | tertiary resume-after-completion panic |
| `off_14129F590` | sub-await at a1[2544] (LABEL_9 check, cases 1/2) | 4th suspend-point resume panic |

These are standard Rust async `.await` poll-resume location markers. Not ICF-folded.

### Coroutine frame layout (from live decompile)

- Frame copy at case-0 entry: `memcpy(a1+1480, a1+392, 0x440)` (1088 B snapshot of input args region)
- `a1+392` = coroutine frame input region (argument blob pointer at `a1+1480`)
- `v41 = aRemoveDataStor` ("remove_data_store" @ `0x14129f63e`, len 17) — IPC command name loaded at LABEL_4
- `v43 = aApp_3` ("app" @ `0x14129c7cd`, len 3) — IPC namespace
- `v51 = a1+2000` — data-store Vec region (count@`a1+2000`, ptr@`a1+2008`, end-ptr@`a1+2016`, 96B stride)
- `a1+2024` = parsed uuid staging area (memcpy 0x98 bytes of Src after Ok)
- `a1+2200` = secondary staging region (memcpy 0xB0 bytes)
- `a1+2376` = tertiary frame region (memcpy 0xB0 bytes at LABEL_8)
- `a1+2544` = 4th sub-await state byte
- `a1+2552` = tertiary discriminant
- `a1+2560` = inner discriminant
- `a1+2576` = outer discriminant
- `a1[2577..2579]` = state flags (`*(_WORD*)(a1+2577) = 257` / `a1[2579] = 1` at case-0 entry; cleared before IPC resolve)

---

## dim2/dim4 — Owner binding (A-level, sole string xref)

- `"remove_data_store"` @ `0x14129f63e` (len 17) has **exactly 1 xref** inside `cmd_remove_data_store_coroutine @ 0x1408f1e20` — loaded at LABEL_4/case-0 dispatch (`v41 = aRemoveDataStor`).
- IPC namespace `"app"` (`aApp_3` @ `0x14129c7cd`, len 3) loaded alongside: `v41=name/v42=17`, `v43=app/v44=3`.
- IPC path: `app::remove_data_store` (Tauri invoke namespace::command).
- Wrong-VA excluded by sole xref + `func_query` sole hit.

---

## dim1-substitute — Caller disambiguation

`xrefs_to 0x1408f1e20` (from intermediate pass, confirmed by async vtable dispatch pattern):

| xref addr | kind | enclosing fn | meaning |
|---|---|---|---|
| 0x1409cf080 | code | sub_1409CF080 | tokio task poll harness A |
| 0x1409ed4b0 | code | sub_1409ED4B0 | tokio task poll harness B |
| (vtable data) | data | — | async Future `poll` vtable slot |
| (vtable data) | data | — | async Future `poll` vtable slot |

Both harnesses are tokio JoinHandle poll drivers with `caller_count=0` each (driven via task vtable). Each dispatches on stage discriminant and calls `cmd_remove_data_store_coroutine` at coroutine frame offset +56 inside try/catch, with "internal error: entered unreachable code: unexpected stage" panic guard.

`caller_disambiguation_tried=true`. This is the normal tokio vtable-dispatch pattern — **not ICF ambiguity**. `genuine_ceiling=false`. No static frontend invoke chain (backend-only async IPC).

---

## dim3 — Call tree to leaf (depth ≥ 5; terminated_reason = response_serialize)

```
cmd_remove_data_store_coroutine @0x1408f1e20
├─ memcpy (0x1411ccb90)                          [frame snapshot at entry; size 0x440]
├─ get_usage_refresh_interval_core_read (0x1402dcbc0)    [AppState/usage ctx snapshot read]
│   └─ (Arc-refcount Repository helpers; clones data-store Vec region)
├─ sub_140462500 (0x140462500)                   [arg validate + extract uuid]
│   ├─ import_remote_device_secret_arg_validator_sys (0x14045efd0)  [uuid string validator, 3 error paths]
│   │   ├─ sub_140FF5620                          [trim-empty check leaf]
│   │   └─ sub_14105D150 + sub_1411CF380          [error construction + cleanup leaves]
│   ├─ sub_140542F70                             [16-byte UUID byte parser leaf]
│   ├─ sub_1411DBDF0                             [type-mismatch error helper]
│   └─ sub_140DE5140                             [CoreError Display impl, 0x25 variants]
│       └─ sub_1412085B0                         [Display panic guard — "a Display impl returned error unexpectedly"]
├─ sub_1400550D0 (0x1400550d0)                   [Arc deref-drop: request src buffer]
├─ nullsub_1 (0x1400013a0)                       [noop]
├─ sub_140001360 (0x140001360)                   [alloc 128B result buffer]
├─ sub_140889870 (0x140889870)                   [string-field + Arc cleanup]
├─ sub_1400CA020 (0x1400ca020)  ×N               [per-record data-store destructor]
│   ├─ _InterlockedDecrement64                   [Arc strong-count atomic dec]
│   ├─ sub_140EF5750                             [Arc inner drop on zero]
│   ├─ sub_1400F5530                             [sub-vec element drop]
│   └─ sub_140001370 (0x140001370)               [dealloc leaf]
├─ sub_140001370 (0x140001370)                   [Vec backing free: ptr, 96*count, align=8]
├─ sub_140861820 (0x140861820)                   [outer cleanup wrapper]
├─ sub_14120829B (0x14120829b)                   [alloc-fail abort guard]
├─ sub_141208950 / sub_141208970                 [async resume/poison guards (all 4 vtable slots)]
└─ tauri_ipc_resolve_sys (0x140062230)  ← terminated_reason=response_serialize (258 callers)
```

14 direct callees; all `type:internal`. **No http / no spawn / no fs / no sqlite write** in chain.

---

## dim4 — Interface / DTO / error / side-effect

### Request

```ts
invoke("remove_data_store", { uuid: string })
// uuid: non-empty string after trim; parsed to 16 raw bytes by sub_140542F70
// IPC path: app::remove_data_store
```

Arg deserialization flow:
1. `get_usage_refresh_interval_core_read(Dst)` — snapshot AppState/usage ctx; if `Dst[0]==3` → direct error path
2. Builds Dst[0..6] with IPC header: `[aRemoveDataStor, 17, aUuid, 4, frame+1480, frame+2000]`
3. `sub_140462500(&v41, Dst)` — validate + extract uuid; returns byte tag in `v41`
4. If `(BYTE)v41 == 6` → Ok (proceed to teardown); otherwise → error path

### Response DTO — 
ull` on success

Success allocates a 128-byte buffer initialized with `0x6C6C756E` = "null" LE sentinel (`*v16 = 1819047278`). Resolved via `tauri_ipc_resolve_sys` with null payload. No data returned.

### Errors (4 paths)

1. `import_remote_device_secret_arg_validator_sys` path 1: `uuid` length == 0 → error via `unk_14127DD9C` template
2. `import_remote_device_secret_arg_validator_sys` path 2: `*(*(a1+32)+480) == 6` (arg already-consumed/wrong type tag) → error via `unk_14127DE02`
3. `import_remote_device_secret_arg_validator_sys` path 3: `uuid` trims to empty (`sub_140FF5620`) → error via `unk_14127DDDF`
4. `sub_1411DBDF0` (outer type-mismatch): value tag != 4 (not a string) → type-mismatch error
   (`aADisplayImplem_6` = "a Display implementation returned an error unexpectedly" is a fmt-path panic guard, not user-facing)

All 4 error paths converge to LABEL_19 → cleanup → `tauri_ipc_resolve_sys` with Err envelope.

### Side-effects — in-memory data-store Vec teardown (destructive)

On Ok path after uuid extraction:
1. `memcpy(v54+2024, Src, 0x98)` + `memcpy(v54+2200, v11, 0xB0)` — stage parsed args in frame
2. Alloc 128B null-sentinel result buffer
3. `sub_140889870(v53)` — drop remaining string fields + Arc
4. Data-store Vec teardown loop (`v54+2000`, count@`*((_QWORD*)v54+250)`, ptr@`*((_QWORD*)v54+251)`, end@`*((_BYTE**)v54+252)`, 96B stride):
   - `while v50 != v52`: `sub_1400CA020(v19+12)` per entry (Arc `_InterlockedDecrement64` + `sub_140EF5750` + buffer frees + 2×56B sub-vec frees)
   - After loop: `sub_140001370(*v49, 96*count, 8)` — free Vec backing allocation
5. `a1[2560] = 1` (inner done), `sub_140861820(v53)` (outer cleanup), `a1[2579]=0 / a1[2578]=0 / a1[2577]=0` state flag clear
6. `tauri_ipc_resolve_sys` → `a1[2576]=1` Poll::Ready; return 0

On error path, same Vec teardown (`v51` count path) is also performed before resolve.

**No disk write** (no FS path callee, no `write_atomic`, no `fs::write`, no SQLite).
**No HTTP/network** (no reqwest/rustls/socket callee).
**No spawn/threading** (no `tokio::spawn`, no `spawn_blocking`, no `thread::spawn`).

---

## dim5 — Same-platform gate

All evidence from Win x64 IDA (`ida-pro-mcp-win`, `AiMaM 1.0.9 win64.exe.i64`), binary SHA `a5822387fa3f56dc03893111f4ffdd074daa882e8887ec4e7c394879c0e9fe0b` == raw/binary SOT confirmed by `server_health`. No macOS cross-port. **dim5 closed.**

---

## dim6 — Test / acceptance mapping

**Open.** No test fixture for `remove_data_store` in known suite. Not collected. Does not block `strictImplementationUse`.

---

## recovery_attempts — anti-cheat gate (red-line 13), all 8 fake-wall taxonomy items EXCLUDED

| taxonomy item | verdict | evidence |
|---|---|---|
| drop_in_place ≠ async body | EXCLUDED | owner is 1899B 58BB async state machine with `-2` generator sentinel, outer/inner/tertiary/4th discriminants, IPC resolve, arg validation; `sub_1400CA020` is a callee (per-entry drop), not the owner |
| architecture_only / budget rule | EXCLUDED | single clean HexRays pass, 58 BB fully listed via `basic_blocks`, no sensitive-field truncation; `func_query` confirms size 0x76b |
| async decompile failed (HexRays bail) | EXCLUDED | decompile complete with `#wind=15` exception states; all 3 outer switch levels + LABEL structures recovered in one pass |
| wrong VA | EXCLUDED | sole string xref of `"remove_data_store"` (0x14129f63e) inside body at LABEL_4; `func_query(name_regex='remove_data_store')` returns exactly 0x1408f1e20; no other hit |
| vtable / dynamic dispatch | EXCLUDED | owner uses state-machine discriminant; caller vtable slots resolved to tokio harness bodies; all 14 callees are concrete internal addresses |
| HTTP-terminal / external-only | EXCLUDED | no http/transport callee; terminal = `tauri_ipc_resolve_sys` (258-caller internal resolver) |
| library internals (reqwest/rustls/serde) | EXCLUDED | all 14 callees `type:internal`; no library boundary deferred |
| body too large | EXCLUDED | 58 BB / 1899 B; fully decompiled in single pass; `basic_blocks` returns `total_blocks=58 done=true` |

`caller_disambiguation_tried = true` (tokio harnesses `sub_1409CF080` / `sub_1409ED4B0` confirmed vtable-only dispatch).
`genuine_ceiling = false`. `real_body_found = true`. `was_false_wall = N/A`.

---

## Gate assessment

| dim | status |
|---|---|
| dim1 frontend CCF | gap_product_frontend_lane (NOT binary cap) |
| dim2 owner pseudocode | closed |
| dim3 call tree | closed |
| dim4 DTO/error/side-effect | closed |
| dim5 same-platform | closed |
| dim6 test/acceptance | open |

**gate_tier**: `strictImplementationUse`
**consumerStartReady**: false
**strictImplementationUse**: true
**readyToImplement**: false (dim1 gap + dim6 open)
**implementation_use**: false
**gate_accepted**: false
**full_leaf_100**: false

dim1 gap = product/frontend-lane. This does NOT block `strictImplementationUse`. The command is fully reversible from the binary; frontend invocation evidence would be required to close dim1 and reach `readyToImplement`.

---

## Evidence pointers

- IDB: `<source-location>\raw\binary\AiMaM 1.0.9 win64.exe.i64`
- Intermediate (prior passes, retained): `intermediate/aimami/1.0.9/windows-x64/data-store-remove/DEEP-DISTILLED-109-wf-fullsurface-audit.md` + `manifest.json`
- Prior local-outtake (superseded by intermediate): `<source-location>/audits/windows-1.0.9-sessions-analytics/reviews/cmd-remove-data-store-coroutine-local-outtake.md`
- Canonical: this file (`<source-location>/aimami/1.0.9/windows-x64/data-store-remove/DISTILLED.md`)
- Sibling: `<source-location>/aimami/1.0.9/windows-x64/data-store-identifiers/DISTILLED.md` (`fetch_data_store_identifiers @ 0x1408f2ad0`)
