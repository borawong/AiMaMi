# WIN-MAINTENANCE-CLUSTER-109: clean + rebuild_registry + load_snapshot

**Session**: <audit-session>
**Machine**: <workstation>
**Platform**: windows-x64  
**Binary SHA256**: a5822387fa3f56dc03893111f4ffdd074daa882e8887ec4e7c394879c0e9fe0b  
**SHA12**: a5822387fa3f  
**Produced**: 2026-06-03  
**Gate**: strictImplementationUse (dim6 missing = ceiling)  
**Is Upstream**: false (all 3 are source archive-extra, not in upstream codex-cli)  
**Owner Gate**: ALLOW (<workstation>, write_mode=owner, index_exact_path basis)

---

## Summary

Three maintenance/system IPC commands closed at dim1-5 on Windows x64:

| command | handler VA | impl VA | gate | notes |
|---|---|---|---|---|
| `clean` | `0x140280DE0` | `0x140568340` | strictImplementationUse | authBackupsRemoved+registryBackupsRemoved+staleEntriesRemoved response |
| `rebuild_registry` | `0x140275E60` | `0x140558780` | strictImplementationUse | registryUpdated response + full registry snapshot |
| `load_snapshot` | `0x1408C2E10` | `0x14084DF80` | strictImplementationUse | localOnly:bool param; progressive snapshot result |

All three: IDB renames + comments set; IDB saved 2026-06-03.

---

## clean

### IPC Interface
```typescript
invoke("clean")
// No parameters
```

### Response DTO
```typescript
{
  authBackupsRemoved: number,
  registryBackupsRemoved: number,
  staleEntriesRemoved: number
}
```
Confirmed from `sub_1404554E0` (CleanResult JSON serializer) string literals at `sub_1400689D0` call site.

### Call Chain
```
clean_handler_sys@0x140280DE0
  → sub_1400DA7C0 (repo Mutex)
  → sub_1411CE640 (async executor)
  → clean_impl_async_lock_sys@0x1400AE160
    → clean_impl_core_sys@0x140568340
      → sub_140553180 (read registry from disk)
      → [loop] sub_1401CE6E0 / sub_14103D900 (iterate accounts)
      → sub_14025A0C0 (drop iterator)
      → accounts_write_back_sys@0x140558110 (write cleaned registry)
    → WakeByAddressSingle
  → sub_1400689D0 → tauri_ipc_resolve_sys@0x140062230
```

### Side Effects
- Reads + rewrites auth.json / account registry
- Mutex-protected write (spinlock + WakeByAddressSingle)
- Serialization fields include: `updatedAt`, `activeAccountKey`, `items`, `autoSwitch`, `apiRegistryItems`, `snapshotPath`, `lastUsageAt`, `cachedPrimaryWindow`, `cachedSecondaryWindow`

---

## rebuild_registry

### IPC Interface
```typescript
invoke("rebuild_registry")
// No parameters
```

### Response DTO
```typescript
{
  registryUpdated: boolean,
  accountCount: number,
  activeAccountKey: string | null,
  lastScanAt: string | null,
  // full registry snapshot (same account fields as accounts module)
}
```
Confirmed from `sub_140448C20` (RebuildRegistryResult JSON serializer) string literals at `sub_140066E10` call site.

### Call Chain
```
rebuild_registry_handler_sys@0x140275E60
  → sub_1400DA7C0 (repo Mutex)
  → sub_1411CE640 (async executor)
  → rebuild_registry_impl_async_lock_sys@0x1400A5A30
    → rebuild_registry_impl_core_sys@0x140558780
      → sub_1404760A0 (guard/pre-check)
      → sub_140553180 (read current registry)
      → sub_140395F60 (canonical auth.json read)
      → sub_140396E30 (parse/scan registry entries)
      → sub_140550BD0 (process account entries)
      → sub_14056DA00 (build new entry, 360-byte stride)
      → accounts_write_back_sys@0x140558110 (write rebuilt registry)
    → WakeByAddressSingle
  → sub_140066E10 → tauri_ipc_resolve_sys@0x140062230
```

### Side Effects
- Reads canonical auth.json files
- Rebuilds in-memory + on-disk registry from canonical files
- Same write-back path as `clean` (accounts_write_back_sys@0x140558110)

---

## load_snapshot

### IPC Interface
```typescript
invoke("load_snapshot", { localOnly: boolean })
// Boot call: localOnly=false
// Local-only read: localOnly=true
```

### Response DTO
Progressive snapshot result — full app state object:
- Primary boot data: account state, model config, relay config
- `"progressive"` mode hint confirmed (`aProgressive` string at `0x14129e920`)
- Full response shape not isolated in Windows-only evidence (cross-platform shape from macOS evidence)

### Call Chain
```
load_snapshot_coroutine_sys@0x1408C2E10
  → get_usage_refresh_interval_core_read@0x1402dcbc0
  → sub_1404632D0 (localOnly param dispatch)
  → sub_1402D3C90 (Arc incref / managed state acquire)
  → sub_1406085E0 (tokio future spawner)
  → [async] sub_14084DF80
    → sub_1402D3C90 (Arc incref for async context)
    → sub_1406085E0 (submit snapshot load task)
    → sub_140387680 (poll/drive future)
    → sub_1400AF970 (progressive result build, "progressive")
    → tauri_ipc_resolve_sys@0x140062230
```

### Side Effects
- Acquires Arc refs to managed state (accounts, relay, config)
- `localOnly=false`: potentially triggers remote fetch
- `sub_140EB2790`/`sub_140EB3580` watcher state check (same pattern as relay_ws_handlers)
- `get_usage_refresh_interval_core_read@0x1402dcbc0` invoked at entry (reads usage refresh timer settings)

---

## Platform Divergence Notes

| aspect | Windows | macOS (prior session) |
|---|---|---|
| clean | `0x140280DE0` handler | TBD (not yet closed) |
| rebuild_registry | `0x140275E60` handler | TBD |
| load_snapshot | `0x1408C2E10` coroutine | TBD |
| is_upstream | false all | false all |
| localOnly param | confirmed bool | confirmed bool (from boot call) |

---

## Gate Determination

- **dim1** CLOSED: command strings confirmed via IDA find_regex + xref_query
- **dim2** CLOSED: owner pseudocode decompiled; core impl decompiled
- **dim3** CLOSED: call-tree depth ≥ 5 all three; load_snapshot terminates at tauri_ipc_resolve_sys
- **dim4** CLOSED: DTO fields confirmed from serializer string literals; side-effects confirmed
- **dim5** CLOSED: Windows x64 same-platform IDA evidence, binary SHA a5822387fa3f
- **dim6** MISSING: no test/acceptance mapping → ceiling = **strictImplementationUse**

**Final gate**: `strictImplementationUse` (dim6 missing; `impl_use=false` until dim6 assessed)

---

## Raw Evidence Paths
- `raw/aimami/1.0.9/windows/system/clean/evidence.md`
- `raw/aimami/1.0.9/windows/system/rebuild_registry/evidence.md`
- `raw/aimami/1.0.9/windows/system/load_snapshot/evidence.md`
