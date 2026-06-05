# Acceptance Mapping — macos-1.0.9-daemon-autoswitch

Bundle: macos-1.0.9-daemon-autoswitch
Version: 1.0.9
Platform: macOS arm64
Binary SHA: 1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482
IDA session: 2026-06-02 fresh decompile+callees+xrefs all 13 VAs
Produced: 2026-06-02
Gate: readyToImplement (all 13 commands)

All dim6 acceptance assertions are bound to IDA-confirmed DTO fields, discriminant bytes, and side-effect addresses.

---

## Harness Matrix

| Harness | Command | Description |
|---------|---------|-------------|
| cargo test | All 13 | Rust unit tests covering command logic, DTO fields, error discriminants |
| bun run test:e2e | IPC-invocable commands | jsdom + Tauri mock IPC roundtrip tests |
| manual | boot-spawn commands | Verify daemon lifecycle triggers correct call chain |

---

## Per-Command Acceptance Assertions

### run_daemon_once (VA 0x10025d600)

**Trigger**: boot-spawn chain (main → run_daemon_once_cli → daemon lifecycle); no IPC invoke

| # | Assertion | Harness | IDA Evidence |
|---|-----------|---------|--------------|
| A1 | CoreEnvelope discriminant=0x0 on ok (auto_switch_disabled: sync_local→sync_auto_switch→build_daemon_payload) | cargo test | pseudocode ok branch, output memcpy pattern |
| A2 | CoreEnvelope discriminant=0x8000000000000000 on poisoned-lock; string "poisoned lock: another task failed inside" | cargo test | refs: anon_52f215418ecd6e508bd9729c3c9f9192_609; LABEL_4/LABEL_37 |
| A3 | DaemonRunPayload memcpy 168 bytes to output buffer | cargo test | __dst[0..10] memcpy pattern |
| A4 | auto_switch_enabled: calls enrich_accounts_via_api → persist_progressive_state → select_rotation_candidate → build_daemon_payload | cargo test | pseudocode auto-switch branch |
| A5 | OnceBox<Mutex> re-entrance guard: second call returns early | cargo test | atomic_load_explicit + initialize pattern |
| A6 | launchctl daemon registration: macOS-only; Windows accepted_unknown | manual | macOS-specific; no cross-platform inference |

---

### load_bootstrap_state (VA 0x10025fe54)

**Trigger**: boot-spawn + IPC wrapper (ipc-contracts.jsonl L86 col 31901)

| # | Assertion | Harness | IDA Evidence |
|---|-----------|---------|--------------|
| A1 | bootstrap_cache::load(a1+480, a1+488) called | cargo test | refs: 0x1001beef8 |
| A2 | CoreEnvelope::ok wraps BootstrapState; memcpy 0x3E8 bytes to output | cargo test | CoreEnvelope::ok at 0x1001db260; memcpy call |
| A3 | poisoned-lock: *qword_a2=2; bytes a2+8..a2+32 from error payload | cargo test | LABEL_4; discriminant=2 |
| A4 | args=none; output_size=0x3E8 bytes | cargo test | function signature; __src[125] local |

---

### note_usage_refresh_activity (VA 0x100262428)

**Trigger**: boot-spawn (called from start_usage_refresh_watcher); no IPC invoke

| # | Assertion | Harness | IDA Evidence |
|---|-----------|---------|--------------|
| A1 | ts:u64 stored to qword_101390370 | cargo test | direct write in LABEL_6 |
| A2 | Condvar::notify_all(unk_101390378) | cargo test | refs: 0x100d39ec0 |
| A3 | poisoned watcher (byte_101390360=1) → silent exit without notify | cargo test | LABEL_7 branch |
| A4 | STATE not initialized → no-op path | cargo test | atomic_load=0 branch |

---

### schedule_full_runtime_refresh (VA 0x100262aec)

**Trigger**: boot-spawn daemon lifecycle + UI heartbeat

| # | Assertion | Harness | IDA Evidence |
|---|-----------|---------|--------------|
| A1 | FULL_RUNTIME_REFRESH_IN_FLIGHT atomic_exchange guard; re-entry returns immediately | cargo test | refs: 0x101396f08 |
| A2 | debounce: if last_request < 8s → reset IN_FLIGHT=0 and return | cargo test | duration_since < 8 branch |
| A3 | first call or >8s: store timestamp to LAST_FULL_RUNTIME_REFRESH_REQUEST_AT | cargo test | refs: 0x101396f00 |
| A4 | WryHandle cloned; arc refcounts incremented; tokio blocking task spawned via Spawner::spawn_blocking | cargo test | refs: 0x100353498 |
| A5 | arc refcount overflow → __break(1) | cargo test | v6/v7 overflow check |

---

### start_usage_refresh_watcher (VA 0x10026254c)

**Trigger**: boot-spawn daemon lifecycle; no IPC invoke

| # | Assertion | Harness | IDA Evidence |
|---|-----------|---------|--------------|
| A1 | USAGE_REFRESH_WATCHER_STARTED atomic_exchange guard; second call returns immediately | cargo test | refs: 0x101395700 |
| A2 | StateManager::try_get panic if Repository unregistered | cargo test | refs: 0x10034b0fc; panic_fmt |
| A3 | Repository::get_usage_refresh_interval error → default 60s | cargo test | LABEL_6: v8=60 |
| A4 | calls update_usage_refresh_schedule(interval) → note_usage_refresh_activity(now_secs) | cargo test | call sequence in LABEL_13 |
| A5 | std::thread::spawn_unchecked (h38776a0343dbf77f): JoinHandle dropped immediately | cargo test | refs: 0x100178274 |
| A6 | spawn failure → unwrap_failed("failed to spawn thread") | cargo test | refs: anon_52f215418ecd6e508bd9729c3c9f9192_625 |

---

### update_usage_refresh_schedule (VA 0x100262c90)

**Trigger**: called from start_usage_refresh_watcher; no IPC invoke

| # | Assertion | Harness | IDA Evidence |
|---|-----------|---------|--------------|
| A1 | interval:u64 stored to qword_101390368 | cargo test | direct write in LABEL_6 |
| A2 | Condvar::notify_all(unk_101390378) — same condvar as note_usage_refresh_activity | cargo test | refs: 0x100d39ec0; same symbol |
| A3 | poisoned watcher → silent exit | cargo test | byte_101390360 guard |

---

### start_auto_switch_pending_watcher (VA 0x100263444)

**Trigger**: run_daemon_once_cli boot chain; no IPC invoke

| # | Assertion | Harness | IDA Evidence |
|---|-----------|---------|--------------|
| A1 | WryHandle::clone; arc refcounts incremented | cargo test | atomic_fetch_add pattern |
| A2 | std::thread::spawn_unchecked (hf4fd4161627ff43c): fire-and-forget OS thread | cargo test | refs: 0x10017cb08 |
| A3 | JoinHandle dropped immediately | cargo test | drop_in_place JoinHandle |
| A4 | arc refcount overflow → __break(1) | cargo test | overflow check |
| A5 | spawn failure → unwrap_failed("failed to spawn thread") | cargo test | unwrap_failed ref |

---

### load_pending_auto_switch (VA 0x1002606fc)

**Trigger**: IPC invoke; frontend useEffect L284

| # | Assertion | Harness | IDA Evidence |
|---|-----------|---------|--------------|
| A1 | Repository::load_pending_auto_switch(a1+16) called | cargo test | refs: 0x1005ea840 |
| A2 | ok path: memcpy 0x2B0 bytes to output buffer (a2) | cargo test | memcpy 0x2B0 |
| A3 | poisoned-lock: *qword_a2=3; error payload bytes a2+8..a2+32 | cargo test | LABEL_4; discriminant=3 |
| A4 | args=none; output_size=0x2B0 | cargo test | function signature |
| A5 | xref: invoke handler in codexmate_lib::run closure 0x100324dac | e2e | xrefs_to result |

---

### confirm_pending_auto_switch (VA 0x1002613d8)

**Trigger**: IPC invoke; frontend FunctionDeclaration pf@L82 + useEffect L284

| # | Assertion | Harness | IDA Evidence |
|---|-----------|---------|--------------|
| A1 | Repository::confirm_pending_auto_switch(a2+16) called | cargo test | refs: 0x1005eeb54 |
| A2 | no pending request → CoreError discriminant=2 in output | cargo test | v28==2 branch |
| A3 | pending found → refresh_full_runtime_snapshot(AppHandle a1) called | cargo test | refs: 0x1001e6a1c |
| A4 | refresh error → CoreEnvelope error discriminant=2; SwitchPayload freed | cargo test | discriminant=3 from snapshot→err path; drop at 0x10026aa98 |
| A5 | refresh ok → memcpy 0x1D8 bytes (CoreEnvelope<SwitchPayload>) to a3 | cargo test | memcpy 0x1D8 |
| A6 | AppHandle drop_in_place unconditional | cargo test | refs: 0x10027d088 |
| A7 | poisoned-lock → *qword_a3=2 | cargo test | LABEL_5 branch |

---

### dismiss_pending_auto_switch (VA 0x1002618b4)

**Trigger**: IPC invoke; frontend if-guard handler L284

| # | Assertion | Harness | IDA Evidence |
|---|-----------|---------|--------------|
| A1 | Repository::dismiss_pending_auto_switch(a1+16) called | cargo test | refs: 0x1005eec9c |
| A2 | ok path → Result<()>; success envelope not 0x8000000000000000 | cargo test | LABEL_10 ok branch |
| A3 | CoreError discriminant=10 (NoRequest) → *qword_a2=0x8000000000000000; BYTE8(v13) at a2+8 | cargo test | discriminant=10 check |
| A4 | poisoned-lock → *qword_a2=0x8000000000000000 via standard path | cargo test | LABEL_4 |
| A5 | args=none | cargo test | function signature |

---

### confirm_pending_auto_switch_and_restart_codex (VA 0x10011207c)

**Trigger**: IPC invoke; frontend async closure + guard chain L284
**Note**: VA is Tauri InvokeResolver::respond_async_serialized_inner::closure (async command body). Command name in rodata at 0x100edc37e.

| # | Assertion | Harness | IDA Evidence |
|---|-----------|---------|--------------|
| A1 | async command resolved via tauri::async_runtime::spawn_blocking (0x10028620c) | cargo test | spawn_blocking ref |
| A2 | AppHandle extracted from InvokeMessage via CommandArg::from_command | cargo test | refs: 0x10035c80c |
| A3 | JoinHandle Poll::Ready ok → body bytes serialized via IpcResponse::body; returned to frontend | e2e | refs: 0x1001f1e5c |
| A4 | JoinHandle Poll::Ready Err(discriminant=3) → format "Blocking command task failed: " + inner error string | cargo test | error format at 0x100ea55d2 |
| A5 | Poll::Pending → task handle stored at a1+3400; resumes on next poll | cargo test | LABEL_25 |
| A6 | AppHandle drop_in_place at a1+3248 after spawn | cargo test | refs: 0x1000cb720 |
| A7 | e2e: UI confirm triggers restart; verify SwitchPayload JSON received | e2e | frontend CCF confirmed |

---

### configure_auto_switch (VA 0x1002603c8)

**Trigger**: IPC invoke; frontend useMutation settings-page

| # | Assertion | Harness | IDA Evidence |
|---|-----------|---------|--------------|
| A1 | args: X1=enabled:bool, X2=threshold_pct:u64, X3=has_schedule:bool, X4=schedule_min:u64; validate_lt101 on pct fields | cargo test | function signature X1-X4; Repository::configure_auto_switch call |
| A2 | threshold_pct or schedule_min >= 101 → validation error returned | cargo test | Repository impl validates |
| A3 | ok → CoreEnvelope<AutoSwitchConfig> 0x78 bytes to a6 | cargo test | output memcpy 0x78 pattern |
| A4 | error → CoreError formatted; *qword_a6=0x8000000000000000 | cargo test | error branch |
| A5 | frontend argKeys (threshold5hPercent, thresholdWeeklyPercent) differ from backend param names — impl MUST use backend names | manual/e2e | AI.md note; product_decision |
| A6 | xref: invoke handler in codexmate_lib::run closure 0x10031ee50 | e2e | xrefs_to result |

---

### set_auto_switch (VA 0x10025e340)

**Trigger**: IPC invoke; frontend useMutation settings-page L7

| # | Assertion | Harness | IDA Evidence |
|---|-----------|---------|--------------|
| A1 | arg=enabled:bool (X1=a2); Repository::set_auto_switch(a1+16, a2) called | cargo test | refs: 0x1005e54e0 |
| A2 | ok → CoreEnvelope<AutoSwitchState> 0x78 bytes to a3 | cargo test | output memcpy 0x78 |
| A3 | error (*qword_v18=0x8000000000000000) → CoreError formatted; *qword_a3=0x8000000000000000 | cargo test | error branch |
| A4 | poisoned-lock → *qword_a3=0x8000000000000000 | cargo test | LABEL_4 |
| A5 | guard s.enable in frontend before calling | e2e | frontend CCF accepted |
| A6 | xref: invoke handler in codexmate_lib::run closure 0x1003265b4 | e2e | xrefs_to result |

---

## Windows Platform Delta

All 13 commands: `platformScopeDeclared = "macOS confirmed; Windows Unknown"`

Specifically:
- Daemon trigger mechanism (launchctl, CFRunLoop, pthread): entirely macOS-specific. Windows trigger unknown.
- start_auto_switch_pending_watcher thread body: CFRunLoop* OS leaves confirmed macOS-only.
- Do not infer Windows behavior from any of these proofs.

Windows evidence must be produced independently from the Windows binary.
