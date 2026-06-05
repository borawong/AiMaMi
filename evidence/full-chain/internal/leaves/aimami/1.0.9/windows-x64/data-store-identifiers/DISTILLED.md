# DISTILLED (canonical) — cmd_fetch_data_store_identifiers_coroutine (Win x64 1.0.9)

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
**owner_va**: 0x1408f2ad0
**owner_size**: 0x7b0 (1968 B)
**basic_blocks**: 60 (complete; no chunking needed)
**callees_count**: 14 (all internal)
**gate_tier**: strictImplementationUse
**real_body_found**: true
**genuine_ceiling**: false
**was_false_wall**: N/A
**caller_disambiguation_tried**: true
**supersedes**: intermediate/aimami/1.0.9/windows-x64/data-store-identifiers/DEEP-DISTILLED-109-wf-fullsurface-audit.md (authoritative=false)

> Third-pass live IDB re-decompile (this session). Confirms all prior evidence.
> New additions vs prior pass: (1) drop-loop stride disambiguation (error path 96B vs ok-path 12B),
> (2) sub_1400CA020 inner structure (Arc+two 56B sub-vecs per record), (3) serializer sub_140415E30
> fully verified in this session including `v2+=16` outer stride and `for i=1..16` inner byte write.

---

## dim1 — Frontend CCF

**status**: gap_product_frontend_lane (NOT a binary cap)

No `fetch_data_store_identifiers` invocation found in the windows-x64 frontend bundle (no terminal_call or IPC invoke chain). This command is backend-only or the frontend evidence was not captured. The absence is a product/frontend-lane gap — the binary itself terminates cleanly at `tauri_ipc_resolve_sys` with no conditional frontend dependency. dim1 remains open; does NOT block `strictImplementationUse`.

---

## dim2 — Owner pseudocode (REAL async coroutine poll body)

`cmd_fetch_data_store_identifiers_coroutine @ 0x1408f2ad0` is the genuine Rust async coroutine state machine body. HexRays produced a complete pseudocode (`#wind=15` exception states, no bail). **Not a shim or drop_in_place.**

### Async resume discriminants (3-level nested state machine, standard `.await` lowering)

- outer: `a1[2480]` switch (cases 0/1/2/3)
- inner: `a1[2464]` switch (cases 0/1/2/3)
- inner2: `a1[2456]` switch (cases 0/1/2/3)
- `v66 = -2` generator-state guard at entry

### Suspension point vtables

Four await suspension point markers (resume-guard vtable slots):
- `off_14129F6C0` — outer cases 1/2 (sub_141208950/sub_141208970)
- `off_14129F5C0` — inner case 1 path (inner await A)
- `off_14129F5F8` — inner cases 1/2 (LABEL_36/LABEL_35)
- `off_14129F748` — inner2 case 1 (sub_141208950), also contains `<local-path>

These are standard Rust async `.await` poll-resume location markers, NOT ICF-folded ambiguous bodies.

### Coroutine frame layout (from live decompile)

- Initial frame copy at case-0 entry: `memcpy(a1+1432, a1+392, 0x410)` (1040 B snapshot)
- `a1+392` = coroutine frame input region (0x188 = 392 bytes; no DTO deserialization — zero-arg IPC)
- `a1+1952` (frame+1952) = data-store Vec pointer (*(Src+245)=count, *(Src+246)=ptr)
- `a1+2136` = intermediate result region (0xA0 bytes, memcpy'd to a1+2296)
- `a1+2296` = result buffer region (0x98 bytes)
- `a1+2448` = inner await state byte
- `a1+2456` / `a1+2464` / `a1+2480` = outer/inner/inner2 discriminant bytes
- `a1+2481..2483` = state flags (set to 257 / 1 at case-0 entry; cleared before IPC resolve)

---

## dim2/dim4 — Owner binding (A-level, sole string xref)

- `"fetch_data_store_identifiers"` @ `0x14129f610` (len 28) has **exactly 1 xref**: `0x1408f2b8c`, inside `0x1408f2ad0` — loaded at LABEL_4 / case 0 dispatch.
- IPC namespace `"app"` (`aApp_3` @ `0x14129c7cd`, len 3) loaded alongside: `v38=name/v39=28`, `v40=app/v41=3`.
- IPC path: `app::fetch_data_store_identifiers` (Tauri invoke namespace::command).
- Wrong-VA excluded by sole xref.

---

## dim1-substitute — Caller disambiguation

`xrefs_to 0x1408f2ad0` — 4 total:

| xref addr | kind | enclosing fn | meaning |
|---|---|---|---|
| 0x1409cd073 | code | sub_1409CD000 (0x200) | tokio task poll harness A |
| 0x1409e7203 | code | sub_1409E7190 (0x200) | tokio task poll harness B |
| 0x1416c49ec | data | — | async Future `poll` vtable slot |
| 0x1418f94bc | data | — | async Future `poll` vtable slot |

Both harnesses are **identical tokio JoinHandle poll drivers** (differ only in tail cleanup: `sub_140A0FD50` vs `sub_140A154A0` = JoinHandle monomorph pair). Each: dispatches on stage discriminant via `sub_140EB27B0`; calls `cmd_fetch_data_store_identifiers_coroutine((char*)(a1+56))` inside try/catch (coroutine state at task-struct offset +56); guards impossible stage with panic `"internal error: entered unreachable code: unexpected stage"` (`aInternalErrorE_4`).

`caller_disambiguation_tried=true`. This is the normal tokio vtable-dispatch pattern — **not ICF ambiguity**. `genuine_ceiling=false`. No static frontend invoke chain (backend-only async IPC).

---

## dim3 — Call tree to leaf (depth ≥ 5; terminated_reason = response_serialize)

```
cmd_fetch_data_store_identifiers_coroutine @0x1408f2ad0
├─ memcpy (0x1411ccb90)                        [frame snapshot at entry]
├─ get_usage_refresh_interval_core_read (0x1402dcbc0)    [data-source: repo snapshot]
│   ├─ get_usage_refresh_interval_repo_snapshot (0x1400f61a0)
│   │   [Arc-refcount Repository fields; clones data-store byte Vec a2+152]
│   │   ├─ sub_1402D3C90                         [window_manager_snapshot_clone_refcount_sys]
│   │   ├─ sub_14105D540                         [byte-vec clone]
│   │   └─ (other Arc/Vec helpers)
│   ├─ memcpy (0x1411ccb90)                    [snapshot copy]
│   ├─ sub_140DDB160                           [Arc dec / cleanup]
│   ├─ sub_140001370                           [dealloc]
│   ├─ sub_140061850                           [error path handler]
│   ├─ sub_14005C030                           [state cleanup]
│   ├─ sub_140DD9F00 / sub_140DDAFE0           [drop helpers]
├─ sub_140889870 (0x140889870)                 [context-cleanup / scope drop]
├─ sub_1400CA020 (0x1400ca020)                 [per-record drop: Arc dec + 2×56B sub-vec free]
│   └─ sub_140001370                           [dealloc]
│   └─ sub_140EF5750 / sub_1400F5530           [Arc strong-count release / sub-vec release]
├─ sub_141208950 / sub_141208970 (poll advance) [async state advance helpers]
├─ sub_1400550D0 (0x1400550d0)                 [Arc deref-drop]
├─ sub_1400BEEA0 (0x1400beea0)                 [alloc 128B + call serializer]
│   ├─ nullsub_1 (0x1400013a0)                 [noop]
│   ├─ sub_140001360 (0x140001360)             [alloc Vec backing]
│   ├─ sub_140415E30 (0x140415e30)             [JSON array-of-arrays writer — see dim4]
│   ├─ sub_140001370 (0x140001370)             [dealloc]
│   └─ sub_14120829B (0x14120829b)             [error handling]
├─ sub_140DE5140 (0x140de5140)                 [CoreError Display impl, 0x25 variants]
├─ sub_140882970 (0x140882970)                 [Result variant drop]
├─ sub_140001370 (0x140001370)                 [dealloc Vec: ptr, 96*count, align=8]
├─ sub_140861120 (0x140861120)                 [coroutine cleanup / state reset]
├─ sub_1412085B0 (0x1412085b0)                 [Display panic handler]
└─ tauri_ipc_resolve_sys (0x140062230)  ← terminated_reason=response_serialize (258 callers)
```

14 direct callees; all `type:internal`. **No http / no spawn / no fs / no sqlite write** in chain.

---

## dim4 — Interface / DTO / error / side-effect

### Request

Zero-arg IPC (`app::fetch_data_store_identifiers`). No argument deserialization callee; coroutine reads existing AppState Repository snapshot.

### Response DTO — JSON `[[b0,b1,…,b15],…]` (array-of-arrays of 16-byte raw identifier keys)

Proven by full decompile of `sub_140415E30 @ 0x140415e30` (hand-rolled serde writer):

1. Writes `0x5B` = `[` (open outer array)
2. Outer loop: `v2 += 16` per iteration (advances 16 bytes per entry); bound `v2 < &v2[16*count]`
3. Per entry:
   - Writes `[` (`0x5B`)
   - First byte: fast-divide digit extract `(5243*b)>>19` with `+48` ASCII
   - Inner loop `for i in 1..16`: per byte writes `,`+digit via same fast-divide
   - Writes `]` (`0x5D`)
   - Comma-separates entries (except last)
4. Writes `0x5D` = `]` (close outer array)

Wire shape: `[[b0,b1,…,b15],[…],…]` where each inner array is one identifier's 16 raw bytes (UUID/field). Empty list → `[]`.

### Data-store record layout (from drop-loop evidence)

- Each Vec element: **96-byte stride** in the data-store Vec
  - Offset +64: count field (checked `!__OFSUB__(0, count)` before drop)
  - Offset +72: sub-vec pointer (freed via `sub_140001370(ptr, count, 1)`)
  - Offset +88: Arc strong-count pointer (`_InterlockedDecrement64`; release via `sub_140EF5750` on zero)
  - Offsets +v1[2]*8 / v1[5]*8: two 56B sub-vectors freed on drop (`56 * v3`, `56 * result`)
- **Serialized field = first 16 bytes** of the 96-byte record; remainder = metadata (not exposed by this command)

### Ok path

- `sub_1400BEEA0` → `sub_140415E30` serialize → sets `Dst[0] = 0x8000000000000025` (Rust Result::Ok sentinel)
- On success: copies result bytes, calls `tauri_ipc_resolve_sys` with Ok envelope
- Ok-path Vec drop: `v22+12` stride loop calling `sub_1400CA020` (12-byte result buffer element, different Vec than 96B data-store Vec)

### Error path

- `sub_1400BEEA0` returns `Dst[0] == 0x8000000000000005` on serialize failure
- Owner builds CoreError variant (`&off_14129F1D0`, `v52..v54`); calls `sub_140DE5140` (shared CoreError Display impl, `switch(errtag^0x8000000000000000)` over 0x25 variants)
- If Display errors: panics via `sub_1412085B0(aADisplayImplem_10, 55, ...)` — `"a Display implementation returned an error unexpectedly"` at `0x14129f200`
- Error also resolves through `tauri_ipc_resolve_sys`

### Side-effects

In-memory only. No persistence, no network, no disk IO.

Drop sequence on ok-path:
1. Drop cloned data-store Vec (96-byte stride): `sub_1400CA020` per record (Arc dec + 2×56B sub-vecs), then `sub_140001370(ptr, 96*count, 8)` frees backing
2. Drop result buffer Vec (12-byte stride): separate `sub_1400CA020` loop
3. `sub_140861120` = coroutine cleanup / state reset before IPC resolve

---

## dim5 — Same-platform gate

All evidence from Win x64 IDA (`ida-pro-mcp-win`, `AiMaM 1.0.9 win64.exe.i64`), binary SHA `a5822387fa3f56dc03893111f4ffdd074daa882e8887ec4e7c394879c0e9fe0b` == raw/binary SOT. No macOS cross-port. **dim5 closed.**

---

## dim6 — Test / acceptance mapping

**Open.** No test fixture for `fetch_data_store_identifiers` in known suite. Not collected.

---

## recovery_attempts — anti-cheat gate (red-line 13), all 8 fake-wall taxonomy EXCLUDED

| taxonomy item | verdict | evidence |
|---|---|---|
| drop_in_place ≠ async body | EXCLUDED | owner contains full state-machine, IPC resolve, serializer call; `sub_1400CA020` is a callee (drop helper), not the owner |
| architecture_only / budget rule | EXCLUDED | single clean HexRays pass, 60 BB fully listed, no sensitive-field truncation |
| async decompile failed (HexRays bail) | EXCLUDED | decompile complete: 60 blocks, full pseudocode, all 3 switch levels recovered |
| wrong VA | EXCLUDED | sole string xref of `"fetch_data_store_identifiers"` → 0x1408f2ad0; `func_query` sole hit |
| vtable / dynamic dispatch | EXCLUDED | owner uses state-machine discriminant; caller vtable slots resolved to tokio harness bodies |
| HTTP-terminal / external-only | EXCLUDED | no http/transport callee; terminal = `tauri_ipc_resolve_sys` |
| library internals (reqwest/rustls/serde) | EXCLUDED | serializer `sub_140415E30` is in-binary hand-rolled; all 14 callees `type:internal` |
| body too large | EXCLUDED | 60 BB / 1968 B; fully decompiled in single pass |

`caller_disambiguation_tried = true` (tokio harnesses `sub_1409CD000` / `sub_1409E7190` confirmed).
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
- Intermediate (prior passes, retained): `intermediate/aimami/1.0.9/windows-x64/data-store-identifiers/evidence.md` + `DEEP-DISTILLED-109-wf-fullsurface-audit.md`
- Canonical: this file (`<source-location>/aimami/1.0.9/windows-x64/data-store-identifiers/DISTILLED.md`)
