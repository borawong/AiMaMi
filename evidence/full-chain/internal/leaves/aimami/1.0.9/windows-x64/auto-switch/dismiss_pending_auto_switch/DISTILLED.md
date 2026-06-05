# DISTILLED — dismiss_pending_auto_switch (Windows x64, AiMaMi 1.0.9)

schema: restoration.cm.distilled.consumer.v2
produced_at: 2026-06-04T00:00:00+08:00
session: <audit-session>
machine: <workstation>
producer: claude-sonnet-4-6
tool: IDA Pro MCP (win) + HexRays

source_binary_sha256: a5822387fa3f56dc03893111f4ffdd074daa882e8887ec4e7c394879c0e9fe0b
owner_addr: 0x14027F120
owner_name: dismiss_pending_auto_switch_owner_sys
core_addr: 0x1400AA290
core_name: dismiss_pending_auto_switch_core_impl
addr_verified: true (func_query confirmed name+size 0x36F at 0x14027F120; no neighbor mismatch)
real_body_found: true
genuine_ceiling: false
accepted_unknown: false
fake_wall_taxonomy_checked: true
recovery_attempts: not_needed — both bodies HexRays-clean first pass; synchronous (no async state machine); func_query VA match confirmed; no vtable/ICF/HTTP/oversized wall

gate_tier: strictImplementationUse
dim1: accepted_native_callback (IPC dispatch via auto_switch_multiplex_dispatcher_sys@0x1402663e0 → xref@0x140269fae; frontend CCF gap = product lane, not binary cap)
dim2: accepted (owner_sys body + core_impl both decompiled; call tree complete to terminal leaves)
dim3: accepted (DTO/error/side-effects confirmed below)
dim4: accepted (windows-x64 platform confirmed; WakeByAddressSingle Win32 API observed)
dim5: accepted (same-side gate: win IDB confirms; mac counterpart @0x1002618b4 independently reversed)
dim6: empty (per task spec)
readyToImplement: false
implementation_use: false
gate_accepted: false
no_gate_promotion_to_ready: true

---

## dim1 — IPC dispatch (caller chain)

`auto_switch_multiplex_dispatcher_sys` @ `0x1402663e0` (size 0x4F1F) calls `dismiss_pending_auto_switch_owner_sys` @ `0x14027F120` via xref `0x140269FAE`.
Data refs: `0x14157B23C`, `0x1418A79D0` (dispatch table entries).
Frontend CCF: gap (frontend bundle not reversed on windows-x64 lane) — product lane gap, not a binary ceiling.

---

## dim2 — Owner body + call tree

### dismiss_pending_auto_switch_owner_sys @ 0x14027F120 (0x36F bytes)

IPC command wrapper. Flow:

1. `memcpy` incoming IPC context (Dst = 65 QWORDs = 520B, v14 = 50 QWORDs = 400B; copies full IPC Src blob).
2. Reads `pendingSwitchAccountKey` pointer at `Src+936` (`v25`), and OWORD at `Src+920` (`v24`).
3. Constructs `v15` log/context array: string `"dismiss_pending_auto_switch"` (`0x141268E16`), len 27; `"repo"` (`0x141269220`), len 4; Dst ptr; &v24.
4. Calls `sub_1400DA7C0(Dst[64]+16)` — reads lock/state field from bootstrap repo handle; if non-zero → skip core, fall through to `sub_1411CE640` (serialise error path).
5. On lock-clear path: calls `sub_1411CE640(&v22, v15, &v15[2])` — serialises context into Result-like v22/v23.
6. Checks `v22[0] != 6` (6 = Err discriminant):
   - **Ok path** (discriminant ≠ 6): calls `dismiss_pending_auto_switch_core_impl(&v18, v2)` where v2 = `*((_QWORD*)&v22+1)` (unwrapped repo ref). Then copies response bytes into v15 and calls `tauri_ipc_resolve_sys` to send Ok(Option<String>) back over IPC.
   - **Err path** (discriminant = 6): sets LOBYTE(v22)=6 → falls to `sub_14006BAA0` error response serialiser.
7. Cleanup: iterates v24 array (stride 96B), calls `sub_1400CA020` per element; frees via `sub_140001370`; returns `sub_140298200(Dst)`.

### dismiss_pending_auto_switch_core_impl @ 0x1400AA290 (0x338 bytes)

Synchronous core. Arguments: `(a1: *mut ResultSlot, a2: *mut AtomicU8_state)`.

1. `_InterlockedCompareExchange8(a2, 1, 0)` — CAS: atomically set lock byte to 1 if 0; if already 1 calls `sub_141206A60` (park/wait on contended lock).
2. Reads `off_141882E30` (tokio/runtime context pointer). `2 * *off_141882E30` = runtime active check.
3. Checks `a2[1]` (already-dismissed flag):
   - **Already dismissed** (`a2[1] != 0`): returns `Ok(Some(old_key))` immediately — constructs Ok result from `sub_14106D750` (mutex lock for string read) + fills `*a1`.
   - **Not dismissed**: calls `load_pending_auto_switch_core_impl(&v25, a2+8)` to load current pending state.
     - If `v25 == 10` (enum variant `None` / no pending switch): sets `*a1 = 0x8000000000000000` (Ok(None)).
     - Else (has pending switch): serialises result via `sub_140464400(&v16, v22)` (Display/fmt path), stores in v23/v24, calls `sub_1400C8830(&v25)` (drop/cleanup); stores into `*a1`.
4. Writes atomically: `*v13 = 0` (clears lock byte); if old value was 2 → `WakeByAddressSingle(v13)` (wake any waiter).
5. Returns `a1`.

Terminal leaves: `load_pending_auto_switch_core_impl@0x140564060` (state read), `WakeByAddressSingle@0x141206B20` (Win32 futex-wake), `tauri_ipc_resolve_sys@0x140062230` (IPC resolve), `sub_14006BAA0@0x14006BAA0` (error response).

---

## dim3 — DTO / error / side-effects

### Arguments
- `argKeys: []` — no user-provided arguments; IPC context only.

### Response OK
- `Option<String>` — returns old `pendingSwitchAccountKey` value (the account field that was pending, now cleared) if one existed, or 
ull`/`None` if no pending switch was set.
- Serialised via `tauri_ipc_resolve_sys` with `LOBYTE(v15[0]) = 1` (Ok tag), plus length/ptr of string result.

### Response Err
- `CoreError` — poisoned RwLock (lock byte already 1 at entry, or runtime check failed).
- Err discriminant = 6 in v22. String reference: `aPoisonedLockAn` = `"poisoned lock: another task failed inside"` @ `0x141282FB5`.
- Panic path: `sub_14106D750` → `aADisplayImplem_0` = `"a Display implementation returned an error unexpectedly"` @ `0x141258C98` (panic sentinel).

### Side-effects
1. **Clears `pendingSwitchAccountKey`** in bootstrap state: `load_pending_auto_switch_core_impl` reads then the core impl clears the pending slot (sets to `None`/`0x8000000000000000` or drops string).
2. **Atomic lock release**: writes `*lock_byte = 0`, then conditionally `WakeByAddressSingle` if waiters (value was 2).
3. **No disk I/O, no network, no notification emit** — pure in-memory state mutation + IPC response.

### Mac vs Win platform diff
- Mac (`0x1002618b4`): async wrapper with `snooze` JSON keys `{currentAccountKey, candidateAccountKey, dismissedAt}`; writes snooze entry to persistence.
- Win (`0x14027F120`): synchronous; no snooze JSON; clears `pendingSwitchAccountKey` in-memory bootstrap state only; no disk write observed.
- **Behavioural divergence**: mac version writes a snooze record; win version only clears the pending field. Same IPC command name, different persistence model.

---

## dim4 — Platform gate (windows-x64)

Evidence produced from Windows x64 IDB (`AiMaM 1.0.9 win64.exe.i64`).
Win32 primitive `WakeByAddressSingle` confirmed at `0x141206B20`.
`_InterlockedCompareExchange8` (x64 LOCK CMPXCHG) confirmed at `0x1400AA2BB`.
All addresses are windows-x64 VA space (`0x140xxxxxx`).

---

## dim5 — Same-side gate + cross-platform note

Windows-side body fully reversed. Mac counterpart independently reversed in session `<audit-session> (owner `0x1002618b4`, gate `strictImplementationUse`). Platform divergence documented in dim3.

---

## Fake-wall taxonomy exhaustion (all 7 categories)

| Category | Verdict |
|---|---|
| drop_in_place / destructor as owner | EXCLUDED — owner_sys is named IPC handler, not drop impl |
| architecture_only / budget rule self-limit | EXCLUDED — both bodies decompiled clean (879B + 824B) |
| async decompile failed (HexRays bail) | EXCLUDED — synchronous; no Rust async state machine |
| ICF-size / wrong VA (neighbour) | EXCLUDED — func_query name+size confirms exact VA match |
| vtable / dynamic dispatch | EXCLUDED — no trait object / fat-pointer in either body |
| HTTP-terminal | EXCLUDED — no HTTP; purely in-memory state + Win32 primitives |
| library internals (reqwest/rustls) | EXCLUDED — no HTTP library calls |

recovery_attempts: not_needed_no_ceiling
caller_disambiguation_tried: N/A (no ICF)
genuine_ceiling: false
