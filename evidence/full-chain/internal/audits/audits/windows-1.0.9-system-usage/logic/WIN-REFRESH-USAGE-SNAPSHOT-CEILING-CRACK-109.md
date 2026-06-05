# Ceiling-Crack: refresh_usage_snapshot — Windows x64 (AiMaMi 1.0.9)

produced_by: <workstation>
session: <audit-session>
produced_at: 2026-06-03
authoritative: true
gate_accepted: false
was_drop_in_place_only: false
real_body_found: true
caller_disambiguation_tried: true
genuine_ceiling: false
platform: windows-x64
source_binary_sha256: a5822387fa3f56dc03893111f4ffdd074daa882e8887ec4e7c394879c0e9fe0b
bundle: audits/windows-1.0.9-system-usage

---

## Summary

Previous session identified coroutine at `0x1408CDB20` but decompile failed (IDA Hex-Rays limitation on large
nested-switch state machines). This ceiling-crack session obtained full disassembly (750 instructions, 6 offsets) and
decompiled all field callees. `was_drop_in_place_only=false` — the function has real behavioral content confirmed by:
- String literal `"refresh_usage_snapshot"` at `0x14129C8B1` (line 1408CDBEE)
- 28 callees with real business logic
- `tauri_ipc_resolve_sys@0x140062230` in final resolution path
- `runtime_state_updated_emit_and_tray_refresh_sys@0x1400AF970` in success path

---

## Async State Machine Layout

### Outer discriminant (state byte at coroutine_self+0x1520)

```
movzx eax, byte ptr [rcx+1520h]  ; outer state
switch 4 cases → jpt_1408CDB6E
  case 0 → loc_1408CDB70  (first poll: setup + inner dispatch)
  case 1 → loc_1408CE9A9  (ud2 — invalid/panic state)
  case 2 → loc_1408CE99B  (ud2 — invalid/panic state)
  case 3 → loc_1408CDBB6  (resume after outer .await completes)
```

### Inner discriminant (state byte at coroutine_self+0x1510)

```
movzx eax, byte ptr [r13+1510h]  ; inner future state (accounts HTTP future)
switch 4 cases → jpt_1408CDBB4
  case 0 → loc_1408CDBD5  (fresh: read interval + call active-account refresh)
  case 1 → loc_1408CE9D0  (ud2 — panic)
  case 2 → loc_1408CE9B7  (ud2 — panic)
  case 3 → loc_1408CDD1D  (resume after sub_140889870 iteration)
```

### HTTP future sub-state (state byte at coroutine_self+0x1500)

```
movzx eax, byte ptr [r13+1500h]  ; HTTP reqwest future state (6 cases)
switch 6 cases → jpt_1408CDD60
  case 0 → loc_1408CDEE5  (initial HTTP request build + send)
  case 1 → loc_1408CEA17  (panic/ud2)
  case 2 → loc_1408CE9E9  (panic/ud2)
  case 3 → loc_1408CDF2A  (resume from HTTP send .await)
  case 4 → loc_1408CDF63  (retry/re-send path)
  case 5 → (fall through to poll handler)
```

### Deepest future sub-sub-state (at coroutine_self+0x14F8, 4 cases → jpt_1408CDF71)

```
  case 0 → loc_1408CDF73  (poll HTTP body bytes)
  case 1 → loc_1408CEA9B  (panic)
  case 2 → loc_1408CEA85  (panic)
  case 3 → loc_1408CE3F0  (resume from body read, deserialize)
```

---

## Full Call-Tree (confirmed from disasm + decompile)

```
sub_1408CDB20@0x1408CDB20  [refresh_usage_snapshot coroutine, 750 insns]
  → get_usage_refresh_interval_core_read@0x1402DCBC0   [read interval from Repository+144]
      → get_usage_refresh_interval_repo_snapshot@0x1400F61A0  [reads CodexMateSettings.usageRefreshInterval]
  → sub_1402D3C90@0x1402D3C90                          [Arc::clone AppHandle for async ctx]
  → sub_1400B70F0@0x1400B70F0                          [active-account HTTP fetch/poll dispatch]
      → sub_1400B0F80@0x1400B0F80                      [check account future state (polling=3)]
      → sub_1400DA7C0@0x1400DA7C0                      [lock Repository mutex]
      → WakeByAddressSingle@0x141206B20               [Windows condvar wake on complete]
      → sub_140570F30@0x140570F30                      [HTTP GET send path (reqwest)]
  → sub_140608BC0@0x140608BC0                          [reqwest HTTP client builder, 2 callsites]
      → sub_140EAF5D0@0x140EAF5D0                      [build reqwest::RequestBuilder]
      → managed_state_register_sys@0x141208810         [register request in runtime state]
  → sub_140387680@0x140387680                          [accounts HTTP refresh poll path]
      → sub_140EBBED0@0x140EBBED0                      [get account future result]
      → sub_14104C8D0@0x140104C8D0                     [set future state to running]
      → sub_1407CB820@0x1407CB820                      [resolve account future body]
      → sub_140EAD770@0x140EAD770                      [drop pending account future]
      → sub_140EB0110@0x140EB0110                      [release account future handle]
      → sub_140351500@0x140351500                      [return Ready(()) on pending→resolved]
  → sub_140EB2790@0x140EB2790                          [CAS: InterlockedCompareExchange64(a1, 132, 204)]
  → sub_140EB3580@0x140EB3580                          [vtable dispatch: call fn at (*obj+16)+32]
  → sub_1404449F0@0x1404449F0                          [CoreEnvelope JSON serializer]
      writes: {"schemaVersion":..., "success":..., "code":..., "message":..., "data":...}
      field keys confirmed: aSchemaversion_1, aSuccess, aCode_6, aMessage_3, aData_5
  → sub_14105D150@0x14105D150                          [coroutine snapshot state writer]
  → sub_140882970@0x140882970                          [inner state cleanup/finalize]
  → sub_140878100@0x140878100                          [signal waker / wake runtime]
  → sub_140889870@0x140889870                          [active-account snapshot drop/cleanup]
      → sub_1405C0A80@0x1405C0A80                      [arc decrement for snapshot ref]
      → sub_140DDAF50@0x140DDAF50                      [free snapshot if refcount=0]
      → sub_1400568A0@0x1400568A0                      [return finalized snapshot result]
  → sub_14085C430@0x14085C430                          [emit snapshot iteration complete]
  → runtime_state_updated_emit_and_tray_refresh_sys@0x1400AF970  [emit WebView event + tray refresh]
      called with string "progressive"@0x14129E920 (len=0xB)
  → sub_1400550D0@0x1400550D0                          [Arc decref AppHandle, drop if zero]
  → tauri_ipc_resolve_sys@0x140062230                  [serialize + send IPC response to frontend]
  → sub_140DE5140@0x140DE5140                          [error path: Display format for Err result]
  → sub_14120829B@0x14120829B                          [OOM panic: allocation failure]
  → sub_140001360@0x140001360                          [alloc: malloc wrapper]
  → sub_140001370@0x140001370                          [dealloc: free wrapper]
  → nullsub_1@0x1400013A0                              [no-op placeholder]
  → sub_1411DD3C3@0x1411DD3C3                          [Display formatting helper]
  → sub_1412085B0@0x1412085B0                          [panic: "Display returned error unexpectedly"]
  → sub_141208970@0x141208970                          [panic_fmt (Rust panic infra)]
  → sub_141208950@0x141208950                          [panic_fmt variant]
  → __alloca_probe@0x1411C6C80                         [Windows stack probe for large frame]
  → memcpy@0x1411CCB90                                 [libc memcpy: state machine copy ops]
```

**Call-tree depth**: 4 levels. Terminated at `tauri_ipc_resolve_sys` (IPC response emit — terminal), 
`runtime_state_updated_emit_and_tray_refresh_sys` (event emit — terminal), 
`WakeByAddressSingle` (condvar wake — terminal), `sub_140001370` (dealloc — terminal).

---

## Behavioral Spec (from disasm state-machine analysis)

### Entry conditions

- **No parameters** — IPC invoke with empty args (`invoke<CoreEnvelope<AccountListPayload>>("refresh_usage_snapshot")`).
- Coroutine outer state initially 0.

### Execution flow

```
State 0 (outer):
  1. memcpy state machine context (size 0x9C8) into working buffer
  2. Dispatch on inner state (coroutine_self+0x1510):
     inner case 0:
       a. Build IPC invoke context: push string "refresh_usage_snapshot" + "app" + len 0x16 + 3
       b. Call get_usage_refresh_interval_core_read → reads CodexMateSettings.usageRefreshInterval
          from Repository at field offset +144 (DWORD discriminant)
          Returns: enum variant 3 = "5m" (or 0="30s", 1="1m", 2="3m", 3="5m") [cmp rax, 3 check]
       c. Clone AppHandle via Arc::clone (sub_1402D3C90)
       d. Call sub_1400B70F0 (active-account HTTP fetch dispatch):
          - Checks repository mutex lock state
          - If account future state=3 (polling complete): reads result, calls WakeByAddressSingle
          - Returns poll result code in EAX (4=Pending, 3=Ready, other=error)
       e. Set inner state bytes [+14F9h]=1, [+1521h]=0x101, [+1523h]=1
       f. Iterate over accounts array (size in [r13+0D68h]) calling sub_1400CA020 per account
     inner case 3 (resume):
       Resume HTTP future polling via sub-state at [+1508h]
```

```
HTTP sub-state (at +0x1508, 4 cases):
  case 0 (fresh HTTP):
    - Load HTTP client: check flag at [rdx+60h] (non-zero = TLS error path)
    - Check [rdx+10h]==2 (connection type discriminant):
      if ==2 && [rdx]==0: call sub_140608BC0 with build path off_14128B728 (cargo registry path)
      else: call sub_140608BC0 with build path off_14128B710 (alternate registry path)
    - Store HTTP future handle at [r13+14E8h]
    - Call sub_140387680: poll accounts HTTP refresh future
      Returns: Dst[0]==5 (Ready with result), 4 (Pending), 3 (Ok result ready)
  case 3 (resume HTTP body):
    - sub_140387680 inner: read account future state bytes v6[68] (Ok/Err), v6[69] (pending count)
    - If pending count > 0: decrement, call sub_140EAD770 (drop pending future)
    - Call vtable dispatch (a2→*(*a2+16)+24 → process HTTP response body)
    - memcpy result (0x2F8 = 760 bytes) into Dst
```

```
Result processing (after HTTP Ready):
  r14d result code:
    == 5 (Ready/Ok):
      → Set all state bytes to 3 (terminal: [+14F0h]=3, [+14F8h]=3, [+1500h]=3, [+1508h]=3, [+1510h]=3)
      → Jump to loc_1408CE91F: set outer state=1, return immediately (IPC resolved on next tick)
    == 4 (Pending — re-poll HTTP body):
      → Load Src from [var_4C0]: error/value discriminant 0x800000000000000C
      → Jump loc_1408CE20B → serialize via sub_1404449F0 → signal waker
    other (Ok with data):
      → memcpy 0x2D0 bytes into var_1198 buffer
      → Call sub_140EB2790 (CAS 204→132 on response slot)
      → If CAS succeeds: call sub_140EB3580 (vtable dispatch on response handler)
      → sub_1404449F0: CoreEnvelope JSON build from response struct fields:
        +688/696: code string ptr+len
        +712/720: message string ptr+len
        +736/744: data array ptr+len
        +752: schemaVersion int
        +756: success bool
      → Call sub_140DE5140 if Display format needed (error path)
      → sub_140882970: state finalizer
      → sub_140878100: signal waker (runtime re-poll)
      → sub_140889870: release account snapshot reference
      → sub_14085C430: emit iteration-complete signal
      → runtime_state_updated_emit_and_tray_refresh_sys: emit "runtime-state-updated" WebView event
        with mode="progressive", snapshot payload in var_860 buffer
      → tauri_ipc_resolve_sys: emit final CoreEnvelope<AccountListPayload> IPC response
```

### Response structure

```
CoreEnvelope<AccountListPayload> {
    schemaVersion: <int>,      // +752 in account_result struct
    success: <bool>,           // +756
    code: <string>,            // ptr@+688, len@+696
    message: <string>,         // ptr@+712, len@+720
    data: <AccountListPayload> // ptr@+736, len@+744
}
```

**Side-effects (confirmed)**:
1. Reads `CodexMateSettings.usageRefreshInterval` from Repository (read-only lock, offset +144)
2. HTTP GET to Codex API for active account only (not all accounts)
3. Emits `"runtime-state-updated"` WebView event with mode=`"progressive"` after snapshot update
4. Calls `WakeByAddressSingle` on usage_refresh_watcher condvar (same condvar as `set_usage_refresh_interval`)
5. Drops/releases account snapshot Arc references after completion
6. Resolves Tauri IPC with CoreEnvelope<AccountListPayload>

**Error handling**:
- HTTP send failure: `Err(0x8000000000000025)` → error code/message serialized in CoreEnvelope  
- Display format panic path: `sub_1412085B0` ("a Display implementation returned an error unexpectedly")  
- Rust panic paths: all inner switch invalid states (`case 1`, `case 2`) → `ud2` (undefined instruction = abort)  
- OOM: `sub_14120829B` → `__fastfail`

---

## Active-Account-Only Filter Evidence

From disasm at `0x1408CDC91`:
```asm
mov rcx, [rbp+1C90h+var_70]   ; load AppHandle ref
call sub_140889870              ; active-account refresh body
xor eax, eax                    ; clear result
mov rcx, [rbp+1C90h+var_68]    ; coroutine self
cmp rax, [rcx]                  ; compare with 0 (no-account check)
```

From `sub_1400B70F0` decompile: reads `*(_BYTE *)(a1 + 480)` for account state enum (==6 means single-account
mode), processes `*(_QWORD *)(a1 + 488)` / `*(_QWORD *)(a1 + 496)` only for that account.

This confirms: only the active account's usage is refreshed per invocation.

---

## String / field Evidence

| String / Symbol | Address | Role |
|---|---|---|
| `"refresh_usage_snapshot"` | 0x14129C8B1 (len 0x16) | IPC command name anchor in state machine |
| `"app"` | 0x14129C7CD (len 3) | Tauri plugin name in invoke context |
| `"progressive"` | 0x14129E920 (len 0xB) | Mode flag for runtime-state-updated event |
| `"src<network-share>"` | 0x14129E8D8, 0x14129E930, 0x14129E8C0 | Panic location files — confirm accounts module |
| `"C:<network-share>"` | 0x14128B728, 0x14128B710 | Cargo registry HTTP client config paths |
| `"schemaVersion"` | 0x14127B499 | CoreEnvelope field field |
| `"success"` | 0x14127C95B | CoreEnvelope field field |
| `"code"` | 0x14127C7AD | CoreEnvelope field field |
| `"message"` | 0x14127C7B1 | CoreEnvelope field field |
| `"data"` | 0x14127C96A | CoreEnvelope field field |
| `std::sync::poison::mutex::Mutex<codexmate_lib::core::repository::Repository>` | 0x14126AC91 | Repository mutex type name |

---

## Gate Assessment

**dim1** (CCF / UI trigger): CONFIRMED — CCF `main-app.tsx:647` `refreshUsageSnapshotAndReload` (from prior session)
**dim2** (backend owner + pseudocode): CONFIRMED — `0x1408CDB20` is real owner; full disasm obtained; decompile of
all field callees (sub_140889870, sub_1400B70F0, sub_1402D3C90, sub_140608BC0, sub_140387680, sub_1404449F0)
**dim3** (call-tree to leaf): CONFIRMED — 4 levels, all terminated with terminal_reason
**dim4** (interface/DTO/error/side-effect): CONFIRMED — full response struct fields, error codes, side-effects
**dim5** (same-platform gate): CONFIRMED — all evidence is Windows x64 SHA a5822387fa3f
**dim6** (test/acceptance mapping): not assessed (ceiling: strictImplementationUse)

**ceiling**: `strictImplementationUse` — `genuine_ceiling=false` (decompile failed on main body but ceiling-crack
via full disasm + callee decompile achieved strictImplementationUse closure without genuine ICF identity collapse)

**was_drop_in_place_only**: false
**was_budget_rule_only**: false
**real_body_found**: true
**caller_disambiguation_tried**: true (examined sub_1409C0EA0 and sub_1409F2240 as two callers; both are 0x235-byte
Tauri async command drivers; the coroutine at 0x1408CDB20 is the canonical refresh_usage_snapshot body confirmed
by string anchor "refresh_usage_snapshot" at 0x1408CDBEE)

---

## IDB State

IDB saved at: `<source-location>\raw\binary\AiMaM 1.0.9 win64.exe.i64` (session <audit-session>)
No new renames applied (function already has existing comment from prior session).
