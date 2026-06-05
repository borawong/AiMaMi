# NOTIFICATION-CLIENT-STATE-DISTILLED-109.md
## get_notification_client_state — macOS arm64 AiMaMi 1.0.9 Distilled Evidence

**Bundle**: `<source-location>/audits/macos-1.0.9-system/`
**Produced**: 2026-06-03
**Last verified**: 2026-06-04 (session <audit-session>, deep RE-VERIFY pass #3 — independent live-IDB re-decompile)
**Sessions**: <audit-session> (initial) → <audit-session> (deep reconfirm 2026-06-03 → deep re-verify 2026-06-04)
**Machine**: <workstation>
**Binary SHA256**: `1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482` (macOS arm64)
**IDB**: `<source-location>/source-binary/AiMaMi 1.0.9_ida.app/Contents/MacOS/AiMaMi.i64`
**IDA status**: hexrays_ready=true, auto_analysis_ready=true, strings_cache_ready=true (14756 strings)
**Authoritative**: true (canonical bundle owner = <workstation> / <workstation>)
**Gate**: strictImplementationUse (macOS arm64; Windows = separate bundle)
**is_upstream**: false (source archive-extra command, not in upstream Codex CLI)

---

## Anti-cheat gate (red line 13) — false-wall taxonomy exhausted

Per `references/ida-deep-recovery.md` §1, all false-wall scenarios evaluated before accepting any ceiling:

| False-wall type | Assessment |
|---|---|
| `drop_in_place` / async body confusion | NOT async. Decompile confirms synchronous body — no state-machine discriminant, no Future::poll. `InvokeResolver::respond` (not `respond_async_serialized`) confirmed in closure decompile. **RE-VERIFY pass #3 (2026-06-04) decisive proof**: `func_query(name_regex=respond_async_serialized)` enumerates every `respond_async_serialized_inner` drop in the binary — ALL belong to other closures (tauri plugin init / tokio Stage drops); NONE is our IPC closure `h9f5e2f4a9691174e`. Our closure body calls sync `InvokeResolver::respond::h6aa3e2ce952source archive32c`. The `drop_in_place` symbols seen are unrelated-closure destructors, not this command's body. |
| `architecture_only` / budget self-limit | Full decompile obtained for all three VAs (impl 632B, core, closure). No budget constraint applied. |
| `async decompile failed` HexRays limit | Not applicable — no async state machine. All bodies decompiled cleanly with HexRays. |
| VA mis-identification / wrong address | Verified: `func_query(name_regex=get_notification_client_state)` returns exactly `0x100262804`, size=`0x278`=632B. xrefs_to confirms 1 caller only at `0x100324020`. |
| vtable / dynamic dispatch | No trait objects or fat pointers in this call path. All callees are direct calls with resolved IDA demangled symbols. |
| HTTP-terminal / external transport | No HTTP. Fully synchronous local in-process command. No reqwest/network stack touched. |
| Library internal unverifiable | `Repository::load_settings` and `save_settings` are `codexmate_lib` internal calls, fully decompilable — not external library internals. |
| Oversized body bail | impl=632B, core and closure well within IDA HexRays budget. No basic_blocks partitioning required. All three decompiled in single call. |

**genuine_ceiling**: false — no genuine ceiling found. All dims verified.
**accepted_unknown**: false
**recovery_attempts**: N/A — no false wall encountered; no ceiling declared. Taxonomy exhausted with zero hits.

---

## dim1 — Frontend CCF / UI Trigger

**Entry point**: `src/main-app.tsx` line ~344
```
const notifications = useNotifications(notificationsReady);
```

otificationsReady` = `useDeferredReady(400)` — hook activates 400 ms after mount.

**Hook**: `src/hooks/use-notifications.ts`
- `useEffect` on mount → calls `refresh()` → calls `getClientState()`
- `getClientState()`: if `deviceIdRef.current || sinceRef.current` is empty → calls `api.getNotificationClientState()`
- Poll interval: `NOTIFICATION_POLL_INTERVAL_MS` = 30 000 ms
- Return value: `{ deviceId, since }` → passed to `desktopClient.getNotifications(deviceId, since)`
- **Lazy / once-per-session**: only called if refs are empty (first poll or post-reset). Refs cached in-memory; not called on every poll.

**API binding** (`src/lib/api.ts`):
```ts
getNotificationClientState: () =>
  invoke<NotificationClientStatePayload>("get_notification_client_state"),
```

**DTO** (`src/types/index.ts`):
```ts
export interface NotificationClientStatePayload {
  deviceId: string;
  notificationsSince: number;  // epoch seconds; frontend converts: * 1000 for Date()
}
```

**IPC dispatch closure** (live IDA deep-reconfirmed 2026-06-03, session <audit-session>):
- Closure VA: `0x100323f54` (`codexmate_lib::run::{{closure}}::{{closure}}::h9f5e2f4a9691174e`)
- Command name at position 0 in inline dispatch blob `v19[0]`: starts with `"get_notification_client_state"` (length 29 declared at `v19[1]`)
- Command string also confirmed in full command registry blob at `0x100f2ecf6`
- `StateManager::try_get` → `get_notification_client_state::h8a97e3aad2778a63`
- **Synchronous**: uses `InvokeResolver::respond::h6aa3e2ce952source archive32c` (NOT `respond_async_serialized`) — confirmed in fresh decompile

---

## dim2 — Owner Decompile (live IDA deep-reconfirm, 2026-06-03, session <audit-session>)

### IPC Closure (dispatch wrapper)
- **VA**: `0x100323f54`
- **Symbol**: `codexmate_lib::run::{{closure}}::{{closure}}::h9f5e2f4a9691174e`
- **Size**: `0x284` (644 bytes)
- **Decompile status**: `decompiled`, `source=ida`, SHA `1db044e8efab` matches
- **Logic**: memcpy InvokeMessage context → call `StateManager::try_get` → call impl → call `InvokeResolver::respond` on result (sync)

### Command Implementation (owner)
- **VA**: `0x100262804`
- **Symbol**: `codexmate_lib::commands::system::get_notification_client_state::h8a97e3aad2778a63`
- **Size**: `0x278` = 632 bytes (confirmed by func_query, matches task spec [632B])
- **Decompile status**: `decompiled`, `source=ida`, SHA `1db044e8efab` matches
- **Signature** (reconstructed): `fn get_notification_client_state(state: State<Repository>) -> CoreEnvelope`

**Pseudocode** (live deep-reconfirm 2026-06-03):
```rust
fn get_notification_client_state(state: State<Repository>) -> CoreEnvelope {
    // 1. atomic_load_explicit on Repository OnceBox pointer (acquire ordering)
    // 2a. if already initialized: Mutex::lock
    // 2b. if not initialized: OnceBox::initialize, then Mutex::lock
    // 3. Poison check via GLOBAL_PANIC_COUNT
    //    - if poisoned: format "poisoned lock: another task failed inside"
    //      → CoreEnvelope sentinel 0x8000000000000000
    // 4. Repository::get_or_create_notification_client_state(&mut out, state_ptr)
    // 5. if result.tag == 10 (Ok):
    //      copy out.device_id + out.notifications_since into response
    // 6. if result.tag != 10 (Err):
    //      CoreError::fmt → format error string
    //      drop CoreError
    //      → CoreEnvelope sentinel 0x8000000000000000
    // 7. Mutex::unlock
}
```

### Repository Core
- **VA**: `0x1005f0e34`
- **Symbol**: `codexmate_lib::core::repository::Repository::get_or_create_notification_client_state::h08726423a915csource archive3`
- **Decompile status**: `decompiled`, `source=ida`, SHA `1db044e8efab` matches

**Logic** (live deep-reconfirm 2026-06-03):
```
1. load_settings(repository)           → CodexMateSettings
2. if load_settings Err (tag=0x8000000000000000):
       → skip to CREATE PATH
3. clone device_id string
4. trim_matches on stored device_id value
5. if trim result non-empty AND settings.notifications_since (i64/u64) > 0:
       → READ PATH: return {device_id: settings.device_id,
                            notifications_since: settings.notifications_since}
                    tag=10; drop settings; return
6. CREATE PATH:
   a. uuid::Uuid::new_v4()                    → new device_id UUID
   b. uuid::fmt::LowerHex::fmt                → format UUID string
   c. clone formatted UUID string
   d. if existing device_id allocation non-empty: __rust_dealloc old
   e. SystemTime::now() + duration_since(UNIX_EPOCH)  → epoch_secs (u64)
   f. settings.notifications_since = epoch_secs
      settings.device_id = new_uuid_string
   g. save_settings(repository, settings)
   h. if save_settings tag == 10 (Ok):
          → return {device_id, notifications_since}   tag=10
      else:
          → propagate Err (CoreEnvelope sentinel)
   i. drop CodexMateSettings
```

---

## dim3 — Callees / xrefs to leaf

### xrefs to impl `0x100262804`
- **1 reference**: from IPC closure `0x100323f54` at call site `0x100324020`
- No other callers (singleton IPC dispatch) — confirmed via xrefs_to, `more=false`

### Call tree from impl `0x100262804` (live deep-reconfirm, depth ≥ 5)
| Callee | VA | Role |
|---|---|---|
| `OnceBox::initialize` | `0x100d7fec8` | lazy mutex init (cold path) |
| `Mutex::lock` | `0x100d3499c` | acquire lock |
| `GLOBAL_PANIC_COUNT` | `0x101399888` | poison check |
| `is_zero_slow_path` | `0x100db0a84` | poison slow-path |
| `get_or_create_notification_client_state` | `0x1005f0e34` | core logic |
| `Mutex::unlock` | `0x100d349b8` | release lock |
| `CoreError::fmt` | `0x10020c20c` | error formatting |
| `drop_in_place<CoreError>` | `0x1002809d0` | cleanup |
| `core::result::unwrap_failed` | `0x100db45b0` | panic on poison |

### Call tree from core `0x1005f0e34` (live deep-reconfirm)
| Callee | VA | Role |
|---|---|---|
| `Repository::load_settings` | `0x1005e2f68` | read CodexMateSettings |
| `String::clone` | `0x100d62688` | clone device_id |
| `str::trim_matches` | `0x10058b240` | strip whitespace |
| `drop_in_place<CodexMateSettings>` | `0x1006044f0` | cleanup settings |
| `uuid::Uuid::new_v4` | `0x100source archive1a50` | generate UUID (create path) |
| `uuid::fmt::LowerHex::fmt` | `0x100source archive1b18` | format UUID to hex |
| `__rust_dealloc` | `0x1000013dc` | dealloc old device_id string |
| `SystemTime::now` | `0x100d3a030` | epoch seed (create path) |
| `SystemTime::duration_since` | `0x100d39fe0` | compute epoch secs |
| `Repository::save_settings` | `0x1005e3328` | persist settings (create path) |
| `core::result::unwrap_failed` | `0x100db45b0` | panic if UUID fmt fails |

---

## dim4 — Interface / DTO / Error / Side-Effect

### Request
- **No parameters**. Command takes only `State<Repository>` (Tauri state injection).

### Response DTO
```
CoreEnvelope {
  tag: u64,          // 10 = Ok; 0x8000000000000000 = Err
  device_id: String, // UUID v4 lowercase hex "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
  notifications_since: u64,  // Unix epoch seconds
}
```
Frontend field names (camelCase via serde): `deviceId`, 
otificationsSince`.
**Frontend conversion**: 
otificationsSince * 1000` for JS `Date` constructor (ms expected).

### Error paths
1. **Mutex poison** (`GLOBAL_PANIC_COUNT` non-zero): formats "poisoned lock: another task failed inside" → CoreEnvelope Err sentinel. Another task panicked inside the lock.
2. **UUID fmt failure**: `unwrap_failed` panic (unexpected path; `uuid::fmt::LowerHex::fmt` should not fail).
3. **save_settings failure** (create path): CoreEnvelope Err propagated; device_id not persisted.
4. **load_settings failure**: skips read path, falls through to create path.

### Side effects
- **Read path** (existing `device_id` + 
otifications_since > 0`):
  - **No disk write**. Pure read of `CodexMateSettings`. Idempotent.
- **Create path** (first call, or 
otifications_since == 0`, or empty device_id):
  - Generates `uuid::Uuid::new_v4()` as `device_id`.
  - Sets 
otifications_since` = current Unix epoch seconds via `SystemTime::now`.
  - Calls `Repository::save_settings` → writes `CodexMateSettings` to `~/.codex/codex.json` (or platform settings path).
  - **Effect**: subsequent calls hit read path (idempotent after first create).
- **No HTTP**, **no IPC emit**, **no tokio spawn**. Fully synchronous.

### Upstream indicator
`device_id` and 
otifications_since` correspond to fields confirmed in settings string blob at `0x100ee8a36`: 
otificationsSince`. Maps 1:1 to JSON schema fields 
otificationsSince` / `device_id` in `CodexMateSettings`.

---

## dim5 — Same-Platform Gate (macOS arm64)

| Check | Result |
|---|---|
| Binary | AiMaMi 1.0.9 macOS arm64, SHA `1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482` |
| IDB | `<source-location>/source-binary/AiMaMi 1.0.9_ida.app/Contents/MacOS/AiMaMi.i64` |
| hexrays_ready | true (session <audit-session>) |
| auto_analysis_ready | true |
| strings_cache_ready | true (14756 strings) |
| Dispatch closure VA `0x100323f54` | live deep-reconfirm decompile successful |
| Impl VA `0x100262804` | live deep-reconfirm decompile successful; func_query size=0x278=632B confirmed |
| Core VA `0x1005f0e34` | live deep-reconfirm decompile successful |
| xref count to impl | 1 (only IPC closure at 0x100324020); xrefs_to more=false |
| func_query name_regex | returns exactly `0x100262804`, no ICF ambiguity |
| IDB inline comments | A-level appended at all three VAs; idb_save confirmed ok |

**Windows x64 platform**: see INDEX entry `aimami/1.0.9/windows-x64/system/get_notification_client_state/distilled` (session <audit-session>, gate=strictImplementationUse).

---

## dim6 — Test / Acceptance Mapping

dim6 is source archive implementation-side work, out of scope for reversal. Ceiling = `strictImplementationUse`.

---

## Gate Summary

| Dimension | Status | Notes |
|---|---|---|
| dim1 (CCF/UI trigger) | closed | `useNotifications` → `getClientState()` → `api.getNotificationClientState()` → `invoke("get_notification_client_state")` |
| dim2 (owner+pseudocode) | closed | IPC closure `0x100323f54`, impl `0x100262804`, core `0x1005f0e34` — all live-decompiled |
| dim3 (callees/xrefs) | closed | Full call trees documented; all leaf callees identified |
| dim4 (interface/DTO/error/side-effect) | closed | req=none; resp={deviceId, notificationsSince}; create side-effect=save_settings; 3 error paths |
| dim5 (same-platform gate) | closed (macOS) | All VAs verified in macOS arm64 IDB; Windows=Unknown |
| dim6 (test/acceptance) | not assessed | source archive impl side; ceiling = strictImplementationUse |

**Gate tier**: `strictImplementationUse` (macOS arm64)
**implementation_use**: false (dim6 not assessed)
**gate_accepted**: false (dim6 not assessed)
**is_upstream**: false
**genuine_ceiling**: false (all false-wall types exhausted; no genuine ceiling found)
**accepted_unknown**: false
**recovery_attempts**: N/A — no ceiling declared; taxonomy exhausted with zero hits

### Consumer notes
1. Command is **synchronous** — no async/await, no tokio spawn. `InvokeResolver::respond` confirmed (not respond_async_serialized).
2. **Create-path disk side-effect**: first call (or when 
otifications_since == 0`) writes `CodexMateSettings` via `save_settings`. Consumer must handle potential `CoreError` on first call.
3. **
otificationsSince` is epoch seconds (u64)** — multiply by 1000 for JS `Date` constructor.
4. **`deviceId` is UUID v4**, lowercase hex, stable across restarts once created.
5. **Lazy initialization**: only called when refs are empty; cached for session lifetime in frontend.
6. **load_settings failure** is silent — falls through to create path; no error returned to caller unless save_settings also fails.
7. Not in canonical `macos-1.0.9-system` primary_commands list — gap leaf added 2026-06-03, deep-reconfirmed 2026-06-03.

---

## Evidence chain
- Session 1 (<audit-session>, 2026-06-03, M3-Max): initial decompile of all three VAs, local-outtake review
- Session 2 (<audit-session>, 2026-06-03, M3-Max): deep reconfirm pass
  - Fresh decompile of impl `0x100262804`, core `0x1005f0e34`, closure `0x100323f54`
  - xrefs_to `0x100262804` → 1 caller confirmed, `more=false`
  - func_query name_regex confirmed VA and size=0x278=632B, no ICF ambiguity
  - anti-cheat taxonomy exhausted per ida-deep-recovery.md §1 (8 false-wall types, zero hits)
  - A-level IDB comments appended at all three VAs; idb_save returned ok
  - owner-gate ALLOW (owner=<workstation>, basis=bundle_manifest, decision=ALLOW, write_mode=owner)
  - Binary SHA `1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482` confirmed
- Session 2 / pass #3 (<audit-session>, 2026-06-04, M3-Max): independent deep RE-VERIFY (no trust of prior summaries — every claim re-derived from live IDB)
  - server_health: IDB `AiMaMi 1.0.9_ida.app/.../AiMaMi.i64`, hexrays_ready=true, auto_analysis_ready=true, strings_cache 14756; SHA of SOT `.app` and `_ida.app` binary both `1db044e8efab...` (parity verified via shasum)
  - func_query(get_notification_client_state) → exactly `0x100262804`, size `0x278`=632B, has_type=true (matches task spec [632B]); no ICF ambiguity
  - Fresh decompile owner `0x100262804` (sync body, poison-string `0x100f305e9`), core `0x1005f0e34` (read/create paths, save_settings side-effect), closure `0x100323f54` (sync respond, cmd-name binding blob)
  - xrefs_to `0x100262804` → 1 (closure `0x100323f54` @ `0x100324020`), `more=false`
  - xrefs_to `0x1005f0e34` → 1 (owner `0x100262804` @ `0x100262920`), `more=false` — clean singleton chain owner→core
  - **Async ruling decisive**: func_query(respond_async_serialized) enumerated → no entry is our closure `h9f5e2f4a9691174e`; all are unrelated-closure drops → command is synchronous (rules out drop_in_place/async false wall with positive evidence, not just absence)
  - Cmd-name binding re-confirmed: closure inline blob `v19[0]` begins `"get_notification_client_state"` (len `v19[1]`=29); full registry blob `0x100f2ecf6` (adjacent `get_system_info`)
  - anti-cheat taxonomy re-exhausted per ida-deep-recovery.md §1 (8 false-wall types, zero hits); genuine_ceiling=false, accepted_unknown=false
  - A-level IDB comments appended (RE-VERIFY 2026-06-04 marker) at all three VAs; idb_save returned ok (`<source-location>/reference-artifact`)
  - owner-gate ALLOW (owner=<workstation>, basis=bundle_manifest, write_mode=owner, exit 0)
