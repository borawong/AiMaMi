# mystery-unlock Windows 1.0.9 — Distilled Consumer Evidence

session: <audit-session>
machine: <workstation>
produced: 2026-06-03
platform: Windows x64 (AiMaM 1.0.9 win64.exe)
sha12: a5822387fa3f
is_upstream: false
gate_tier: strictImplementationUse (dim1-5 closed; dim6 missing = ceiling)
raw_evidence: raw/aimami/1.0.9/windows/mystery-unlock/MYSTERY-UNLOCK-WIN-109.md

---

## Owner Matrix

| item | get_mystery_unlock_grants | merge_mystery_unlock_grants |
|---|---|---|
| cmd layer VA | `0x14027e640` | `0x1402719b0` |
| repo Mutex wrapper VA | `0x1400a8b70` | `0x1400aa720` |
| repo core VA | `0x140560640` | `0x140564c90` |
| dispatcher | `auto_switch_multiplex_dispatcher_sys@0x1402663e0` | same |
| cmd name string | `"get_mystery_unlock_grants"@0x141268ed5` | `"merge_mystery_unlock_grants"@0x141268eee` |
| is_upstream | false | false |
| achieved tier | **strictImplementationUse** | **strictImplementationUse** |
| dim6 | missing | missing |
| ceiling | strictImplementationUse | strictImplementationUse |

---

## IPC Signatures (Windows, matching macOS)

```typescript
// get — no input
invoke("get_mystery_unlock_grants"): Promise<MysteryRouteGrant[]>

// merge — grants array input
invoke("merge_mystery_unlock_grants", { grants: MysteryRouteGrant[] }): Promise<MysteryRouteGrant[]>
```

---

## MysteryRouteGrant DTO (Windows, stride 40B, confirmed)

```typescript
interface MysteryRouteGrant {
  // offset 0: discriminant/tag (u64; value 2 = sentinel)
  route: string;    // String: ptr@8, len@16, cap@24
  epoch_ms: number; // u64 at offset 32
  // total stride: 40 bytes (confirmed from merge drain loop stride 0x28)
}
```

Serialized field names (from `settings_deserialize_usage_refresh` strings):
- field: `"mysteryUnlockGrants"` (settings field for the Vec)
- field: `"mysteryUnlockedRoutes"` (alternate/legacy field name observed)
- type: `"MysteryRouteGrant"` (serde type name)

epoch_ms formula: `1000 * secs + nanos / 1_000_000` (confirmed via `0xF4240` divisor)

---

## Route Allowlist (Windows, identical to macOS)

Hard-coded in merge core (`0x140564c90`) via inlined length-switch:

```
mcp (3)  ·  skills (6)  ·  overview (8)  ·  accounts (8)
sessions (8)  ·  settings (8)  ·  maintenance (11)
subscription (12)  ·  customInstructions (18)
```

Applied to: existing grants (loop 1) + incoming grants (loop 2) in merge.
NOT applied in get (get only filters by epoch_ms).

---

## Behaviour Summary

### get_mystery_unlock_grants
1. Read `CodexMateSettings` (via `settings_deserialize_usage_refresh`)
2. Compute 
ow_ms = SystemTime::now()`
3. Filter grants in-place by epoch_ms predicate (closure captures 
ow_ms`)
4. Conditional write: save only if filtered count changed
5. Return filtered `Vec<MysteryRouteGrant>`

### merge_mystery_unlock_grants
1. Read `CodexMateSettings`
2. Build merge map from existing allowed grants
3. Insert/overwrite from incoming `grants` param (allowlist + sentinel=2 check)
4. Drain and dealloc non-allowed incoming grants
5. Compute 
ow_ms`; sort output (insertion_sort <21, driftsort ≥21)
6. Clone Vec; **always** write `settings_serialize_with_usage_refresh`
7. Return sorted+merged `Vec<MysteryRouteGrant>`

---

## Side-Effects

| command | file write | network | sidecar |
|---|---|---|---|
| get | conditional (only if filter changed count) | none | none |
| merge | always | none | none |

Both ops: Mutex-guarded (`_InterlockedCompareExchange8` + `WakeByAddressSingle`), same pattern as all other repo ops.

---

## Error Paths

- Settings serialize failure → `CoreError` → IPC `Result::Err`
- Mutex poison → panic ("`poisoned lock: another task failed inside`")
- No silent swallowing

---

## Platform Comparison (macOS vs Windows)

| aspect | macOS | Windows |
|---|---|---|
| cmd layer | `0x10026091c` / `0x1002620d4` | `0x14027e640` / `0x1402719b0` |
| repo core | `0x1005ec3e0` / `0x1005ef594` | `0x140560640` / `0x140564c90` |
| allowlist | separate named fn `mystery_route_allowed@0x1005e9e08` | inlined in merge core |
| allowlist routes | identical 9-route set | identical 9-route set |
| DTO stride | 40B | 40B |
| sentinel value | discriminant=2 | discriminant=2 |
| epoch_ms | 1000×secs + nanos/1_000_000 | identical formula |
| save-on-get | conditional (count change) | conditional (count change) |
| save-on-merge | always | always |
| Mutex pattern | OnceBox + pthread Mutex | InterlockedCompareExchange8 + WakeByAddressSingle |
| dispatcher | Tauri invoke-handler string table | `auto_switch_multiplex_dispatcher_sys` |

Behaviour is **functionally identical** across platforms.

---

## Gate Dimensions

| dim | status | evidence |
|---|---|---|
| dim1 — frontend CCF/trigger | closed | dispatcher xrefs + cmd name strings; is_upstream=false |
| dim2 — owner decompile | closed | both cmd+repo layers fully decompiled, no ICF blocking |
| dim3 — callees/xrefs | closed | full callee trees; dispatcher xref to both cmd VAs confirmed |
| dim4 — DTO/interface/error | closed | MysteryRouteGrant 40B, epoch_ms, allowlist, side-effects, errors |
| dim5 — same-end gate | closed | both in Windows `auto_switch_multiplex_dispatcher_sys`; Mutex confirmed |
| dim6 — test/acceptance | **missing** | ceiling = strictImplementationUse (source archive impl-side activity) |

**achieved: strictImplementationUse**
implementation_use: false (dim6 missing)
gate_accepted: false (dim6 missing)
