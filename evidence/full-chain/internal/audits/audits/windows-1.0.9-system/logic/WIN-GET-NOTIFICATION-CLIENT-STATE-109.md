# get_notification_client_state — Windows x64 Distilled Evidence
## AiMaMi 1.0.9 | Session: <audit-session> | Machine: <workstation> | Date: 2026-06-03
## Gate: strictImplementationUse (dim1-5 closed; dim6 missing = ceiling)
## is_upstream: false (source archive-extra, not in upstream Codex CLI)
## authoritative: true (first write; owner-gate ALLOW write_mode=first)

---

## IPC Binding

**Command**: `"get_notification_client_state"`  
**String VA**: `0x141268f09` (len=29)  
**Dispatcher**: `auto_switch_multiplex_dispatcher_sys@0x1402663e0`, branch `0x140266619`–`0x140266718`  
**Mutex lock wrapper**: `get_notification_client_state_mutex_lock_sys@0x1400AB190`  
**Impl core**: `get_notification_client_state_repo_core_sys@0x140567E30`  

---

## Request

No parameters. Tauri state injection only (`"repo"` → `State<Repository>`).

---

## Response DTO

```typescript
interface NotificationClientStatePayload {
  deviceId: string;          // UUID v4, lowercase hex, persisted to settings
  notificationsSince: number; // Unix epoch seconds (u64); frontend multiplies by 1000 for ms
}
```

**Windows-specific**: 
otificationsSince` generated via `GetSystemTimePreciseAsFileTime@0x141036690` + `FILETIME→seconds@0x141036640` (constant `0x1B21DD213600000` = FILETIME→UNIX epoch delta). Functionally equivalent to macOS `SystemTime::now().duration_since(UNIX_EPOCH)`.

---

## Logic

```
1. settings_deserialize_usage_refresh(a2+584/592)  → reads CodexMateSettings JSON
2. if notificationsSince > 0 && non-empty (after trim):
     → return {deviceId, notificationsSince}  [read path, no disk write]
3. else (first call / zeroed field):
     a. GetSystemTimePreciseAsFileTime() → convert to Unix epoch seconds
     b. sub_140F164B0 / sub_140F16550 → generate UUID v4 for deviceId
     c. settings_serialize_remote_device_secret_and_save_sys(a2, &Dst)
        → writes CodexMateSettings JSON to ~/.codex/codex.json
        → fields serialized: hotspot(+144), usageRefreshInterval(+16), deviceId(+64),
          remoteDeviceSecret(+88), notificationsSince(+0), apiProxy, MysteryRouteGrant
     d. return {deviceId, notificationsSince}  [create path]
4. on error: sentinel 0x8000000000000000 with error string
```

---

## Settings Field Offsets (from serializer string literals)

| Field | Offset in settings struct | field in JSON |
|---|---|---|
| 
otificationsSince` | +0 | `"notificationsSince"` |
| `usageRefreshInterval` | +16 | `"usageRefreshInterval"` |
| `deviceId` | +64 | `"deviceId"` |
| `remoteDeviceSecret` | +88 | `"remoteDeviceSecret"` |
| `hotspot` | +144 | `"hotspot"` |

Confirmed from `settings_serialize_remote_device_secret_and_save_sys@0x140553a90` string literal: `"hotspotusageRefreshIntervaldeviceIdremoteDeviceSecretnotificationsSinceapiProxyMysteryRouteGrant..."`.

---

## Call Tree

```
auto_switch_multiplex_dispatcher_sys@0x1402663e0  [dispatcher]
  └── sub_1400FA5F0@0x140266680  [managed-state extractor: repo]
  └── get_notification_client_state_mutex_lock_sys@0x1400AB190  [Mutex::lock wrapper]
        └── get_notification_client_state_repo_core_sys@0x140567E30  [impl core]
              ├── settings_deserialize_usage_refresh@0x1405532d0  [read settings]
              │     └── sub_14104DEE0  [CodexPaths file reader, a2+584/592]
              │     └── sub_140262F50  [JSON deserializer entry]
              ├── sub_14105D540  [Option<String> helper]
              ├── sub_140183010  [UTF-8 trim_matches]
              ├── sub_141036690  [GetSystemTimePreciseAsFileTime wrapper]
              ├── sub_141036640  [FILETIME→epoch seconds, div by 10,000,000]
              ├── sub_140F164B0 / sub_140F16550  [UUID v4 builder init/finalize]
              └── settings_serialize_remote_device_secret_and_save_sys@0x140553a90  [write settings]
                    └── sub_140336350  [atomic file write to settings store]
```

Depth ≥ 5 confirmed (dispatcher → mutex → core → deserialize → file reader).

---

## Error Paths

1. **Mutex poison**: `aPoisonedLockAn` = "poisoned lock: another task failed inside" → 0x8000000000000000
2. **settings_deserialize failure**: tag≠10 → propagated as 0x8000000000000000
3. **save_settings failure** (create path): tag≠10 from serializer → 0x8000000000000000

---

## Cross-Platform Comparison

| Dimension | macOS (arm64) | Windows x64 |
|---|---|---|
| Dispatcher VA | `0x100318958` (length-indexed switch) | `0x1402663e0` (jumptable, case 29) |
| Branch / case | closure `0x100323f54` | `0x140266619`–`0x140266718` |
| Mutex lock | `std::sync::Mutex::lock@0x1000262804` | `get_notification_client_state_mutex_lock_sys@0x1400AB190` |
| Impl core | `codexmate_lib::core::repository::Repository::get_or_create_notification_client_state@0x1005f0e34` | `get_notification_client_state_repo_core_sys@0x140567E30` |
| Settings read | `Repository::load_settings@0x1005e2f68` | `settings_deserialize_usage_refresh@0x1405532d0` |
| Settings write | `Repository::save_settings@0x1005e3328` | `settings_serialize_remote_device_secret_and_save_sys@0x140553a90` |
| Epoch generation | `SystemTime::now()` | `GetSystemTimePreciseAsFileTime@0x141036690` + FILETIME→s `@0x141036640` |
| UUID generation | `uuid::Uuid::new_v4@0x100source archive1a50` | `sub_140F164B0`/`sub_140F16550` (inferred UUID builder) |
| Response DTO | `{deviceId: String, notificationsSince: u64}` | Same (confirmed from serializer field names) |
| Side-effect | write to `~/.codex/codex.json` on create path | Same |
| is_upstream | false | false |

**Behavior is functionally identical across platforms.** Field names, DTO shape, and persistence path all confirmed independent of macOS evidence.

---

## Dim Assessment

| dim | status | evidence |
|---|---|---|
| dim1 (CCF) | **closed** | Windows string `0x141268f09` xref in dispatcher; macOS CCF `useNotifications→getClientState→invoke("get_notification_client_state")` confirmed in local-outtake |
| dim2 (owner+pseudocode) | **closed** | dispatcher branch `0x140266619-0x140266718`; mutex_lock `0x1400AB190`; impl_core `0x140567E30` all decompiled |
| dim3 (callees/xrefs) | **closed** | full call tree ≥5 depth; `settings_deserialize_usage_refresh`→`settings_serialize...`→`sub_140336350` atomic write terminal |
| dim4 (interface/DTO/error/side-effect) | **closed** | request=none; response `{deviceId,notificationsSince}`; field offsets +0/+64 confirmed from serializer; error paths documented; side-effect: create path writes settings |
| dim5 (same-platform gate) | **closed** | all VAs verified in Win x64 IDB sha a5822387fa3f; IDB saved; renames+comments set |
| dim6 (test/acceptance) | **not assessed** | source archive implementation side; out of scope for reversal |

**Gate**: `strictImplementationUse` (dim1-5 closed; dim6 missing = ceiling)

---

## Raw Evidence Pointer

`<source-location>/raw/aimami/1.0.9/windows-x64/system/get_notification_client_state/`
