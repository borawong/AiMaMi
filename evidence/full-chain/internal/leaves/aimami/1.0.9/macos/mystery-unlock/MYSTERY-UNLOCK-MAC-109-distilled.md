# mystery-unlock macOS 1.0.9 — Distilled Consumer Evidence

session: <audit-session>
machine: <workstation>
produced: 2026-06-03
platform: macOS (AiMaMi 1.0.9 universal)
idb: <source-location>/source-binary/AiMaMi 1.0.9_ida.app/Contents/MacOS/AiMaMi.i64
is_upstream: false
gate_tier: strictImplementationUse (dim1-5 closed; dim6 missing = ceiling)
raw_evidence: raw/aimami/1.0.9/macos/mystery-unlock/MYSTERY-UNLOCK-MAC-109.md

---

## Owner Matrix

| item | get_mystery_unlock_grants | merge_mystery_unlock_grants |
|---|---|---|
| cmd layer VA | `0x10026091c` | `0x1002620d4` |
| cmd size | 0x284 | 0x2d4 |
| repo Mutex offset | a1+0 (OnceBox), a1+8 (poison), a1+16 (repo) | same |
| repo core VA | `0x1005ec3e0` (size 0x1c4) | `0x1005ef594` (size 0x444) |
| helper | `mystery_route_allowed@0x1005e9e08` (size 0x1b0) | same (xref from repo core) |
| dispatcher | Tauri invoke-handler string table `0x100f2ecf6` | same |
| IDA renamed | `cmd_get_mystery_unlock_grants`, `Repository_get_mystery_unlock_grants` | `cmd_merge_mystery_unlock_grants`, `Repository_merge_mystery_unlock_grants` |
| is_upstream | false | false |
| achieved tier | **strictImplementationUse** | **strictImplementationUse** |
| dim6 | missing | missing |
| ceiling | strictImplementationUse | strictImplementationUse |

---

## IPC Signatures (macOS, confirmed by IDA decompile)

```typescript
// get — no input
invoke("get_mystery_unlock_grants"): Promise<MysteryRouteGrant[]>

// merge — grants array input
invoke("merge_mystery_unlock_grants", { grants: MysteryRouteGrant[] }): Promise<MysteryRouteGrant[]>
```

Param field for merge: `"grants"` (len=6), confirmed from `from_command` deserialization path in closure.

---

## MysteryRouteGrant DTO (macOS, stride 40B, confirmed)

```typescript
interface MysteryRouteGrant {
  // offset 0: discriminant/tag (u64; value 2 = sentinel break in merge loop)
  route: string;    // String: ptr@8, len@16, cap@24
  epoch_ms: number; // u64 at offset 32
  // total stride: 40 bytes (confirmed: v14+=5 in cmd drop loop, v23[3]=v48+40*v47 in merge stride)
}
```

epoch_ms formula: `1000 * secs + nanos / 1_000_000` (divisor `0xF4240` = 1,000,000 confirmed in repo layer)

Settings persistence fields observed:
- Vec stored under field `"mysteryUnlockGrants"` in `CodexMateSettings`
- Type name: `"MysteryRouteGrant"` (serde)

---

## Route Allowlist (macOS mystery_route_allowed @ 0x1005e9e08)

Hard-coded length-switch after `str::trim_matches`. Decompile confirmed:

```
len 3:  "mcp"               (0x70636D)
len 6:  "skills"            (0x736C6C696B73)
len 8:  "overview"          (0x776569767265766F)
len 8:  "accounts"          (0x73746E756F636361)
len 8:  "sessions"          (0x736E6F6973736573)
len 8:  "settings"          (0x73676E6974746573)
len 11: "maintenance"       (0x616E65746E69616D + 0x65636E616E65746E suffix)
len 12: "subscription"      (0x7069726373627573 + 0x6E6F697069726373 suffix DWORD)
len 18: "customInstructions" (0x6E496D6F74737563 + 0x6F69746375727473 + 0x6E65 suffix)
```

Returns `1` (allowed) or `0` (blocked). Called from `Repository_merge_mystery_unlock_grants` at two xref sites:
- existing-grant loop (filtering current settings grants)
- input-grant loop (filtering incoming IPC grants)

NOT called in `Repository_get_mystery_unlock_grants` (get only filters by epoch_ms).

---

## Behaviour Summary

### get_mystery_unlock_grants

1. `OnceBox::initialize` if needed (lazy Mutex setup)
2. `Mutex::lock` on `a1` (ProxyContext StateManager pointer)
3. Check poison flag at `a1+8` → emit `CoreError("poisoned lock")` if set
4. `Repository_get_mystery_unlock_grants(sret, a1+16)`:
   - `Repository::load_settings` → read `CodexMateSettings`
   - `SystemTime::now()` → `duration_since(UNIX_EPOCH)` → 
ow_ms`
   - `alloc::vec::in_place_collect::from_iter_in_place`: filter grants in-place by closure (captures 
ow_ms`; exact predicate = `epoch_ms` condition — accepted_unknown for precise comparison direction)
   - Count check: **conditional** `save_settings` only if filtered count changed
   - Return `Vec<MysteryRouteGrant>`
5. Write `Ok(Vec)` discriminant=10 to `a2+{0,8,24}` or `Err(CoreError)` discriminant=1
6. `Mutex::unlock`

### merge_mystery_unlock_grants

1. `OnceBox::initialize` + `Mutex::lock`
2. Read input `a2` = `Vec<MysteryRouteGrant>` (ptr=a2[0], cap=a2[1]·8, len=a2[2]; stride 40B)
3. `Repository_merge_mystery_unlock_grants(sret, a1+16, &input_vec)`:
   - `Repository::load_settings`
   - `RandomState::new` + `hashmap_random_keys` → `HashMap<String, …>` init
   - Loop existing grants: `mystery_route_allowed` → if allowed: `String::clone(route)` + `HashMap::insert`
   - Loop input grants: if `discriminant==2` → break sentinel; `mystery_route_allowed` → if allowed: `HashMap::insert`; if not allowed and `cap>0`: `dealloc(route_ptr)`
   - Drain remaining input (free non-inserted heap)
   - `SystemTime::now()` → 
ow_ms`
   - Collect+sort: `insertion_sort_shift_left` (<21 elems) or `driftsort_main` (≥21)
   - `Vec::clone` for return
   - **Always** `save_settings`
   - Return `Vec<MysteryRouteGrant>`
4. Write `Ok(Vec)` or `Err(CoreError)` to `a3`
5. Drop input Vec: iterate `len` items, `dealloc(item[24])` if `item[16]!=0`, then `dealloc(base)` if `cap>0`
6. `Mutex::unlock`

---

## Side-Effects

| command | file write | network | sidecar |
|---|---|---|---|
| get | conditional (only if filtered count changed) | none | none |
| merge | always (unconditional after merge) | none | none |

Both ops: Mutex-guarded via `OnceBox + pthread_mutex_t` pattern (same Mutex wrapping all Repository ops).

---

## Error Paths

- `save_settings` failure → `CoreError` → `Result::Err` returned via IPC (discriminant=1)
- Mutex poison → `unwrap_failed` panic: `"poisoned lock: another task failed inside"`
- No silent swallowing of errors

---

## Call Tree Summary

### get_mystery_unlock_grants (depth ≥ 5 from cmd layer)

```
cmd_get_mystery_unlock_grants@0x10026091c
  └─ OnceBox::initialize@0x100d7fec8              [lazy init]
  └─ Mutex::lock@0x100d3499c                       [acquire]
  └─ panic_count::is_zero_slow_path@0x100db0a84   [poison check]
  └─ Repository_get_mystery_unlock_grants@0x1005ec3e0  [business]
       └─ Repository::load_settings@0x1005e2f68        [read settings]
       └─ SystemTime::now@0x100d3a030                   [timestamp]
       └─ SystemTime::duration_since@0x100d39fe0        [epoch delta]
       └─ in_place_collect::from_iter_in_place@0x1004cab8c  [filter]
       └─ Repository::save_settings@0x1005e3328           [conditional write]
       └─ drop_in_place<CodexMateSettings>@0x1006044f0    [cleanup]
  └─ CoreError::fmt@0x10020c20c                    [error path]
  └─ core::result::unwrap_failed@0x100db45b0       [panic path]
  └─ Mutex::unlock@0x100d349b8                     [release]
```

### merge_mystery_unlock_grants (depth ≥ 5 from cmd layer)

```
cmd_merge_mystery_unlock_grants@0x1002620d4
  └─ OnceBox::initialize@0x100d7fec8
  └─ Mutex::lock@0x100d3499c
  └─ Repository_merge_mystery_unlock_grants@0x1005ef594   [business]
       └─ Repository::load_settings@0x1005e2f68
       └─ RandomState::new / hashmap_random_keys@0x100d352c4  [HashMap seed]
       └─ mystery_route_allowed@0x1005e9e08                   [allowlist]
            └─ str::trim_matches@0x10058b240
       └─ String::clone@0x100d62688
       └─ HashMap::insert@0x1004de020
       └─ SystemTime::now + duration_since
       └─ insertion_sort_shift_left@0x100534468 / driftsort_main@0x1004c8008
       └─ Vec::clone@0x1004ce940
       └─ Repository::save_settings@0x1005e3328           [always write]
       └─ drop_in_place<CodexMateSettings>@0x1006044f0
  └─ Mutex::unlock@0x100d349b8
  └─ [input Vec drop loop: dealloc per element + base]
```

---

## Platform Comparison (macOS vs Windows)

| aspect | macOS | Windows |
|---|---|---|
| cmd VAs | `0x10026091c` / `0x1002620d4` | `0x14027e640` / `0x1402719b0` |
| repo core VAs | `0x1005ec3e0` / `0x1005ef594` | `0x140560640` / `0x140564c90` |
| allowlist impl | separate named fn `mystery_route_allowed@0x1005e9e08` | inlined in merge core |
| allowlist routes | identical 9-route set | identical 9-route set |
| DTO stride | 40B | 40B |
| sentinel value | discriminant=2 | discriminant=2 |
| epoch_ms | `1000×secs + nanos/1_000_000` | identical formula |
| save-on-get | conditional (count change) | conditional (count change) |
| save-on-merge | always | always |
| Mutex pattern | `OnceBox + pthread_mutex_t` | `InterlockedCompareExchange8 + WakeByAddressSingle` |
| dispatcher | Tauri invoke-handler string table | `auto_switch_multiplex_dispatcher_sys@0x1402663e0` |

Behaviour is **functionally identical** across platforms.

---

## Gate Dimensions

| dim | status | evidence |
|---|---|---|
| dim1 — frontend CCF/trigger | closed | IDA invoke-handler string table `0x100f2ecf6`; run::closure xrefs; is_upstream=false |
| dim2 — owner decompile | closed | Both cmd+repo layers fully decompiled (IDA); no ICF blocking (drop_in_place at `0x1004be160` confirmed = filter IntoIter destructor, not poll body) |
| dim3 — callees/xrefs | closed | Full callee trees to leaf (depth ≥5, with terminated_reason=persistence_commit via `save_settings`) |
| dim4 — DTO/interface/error | closed | MysteryRouteGrant 40B stride; epoch_ms formula; allowlist 9 routes; side-effects; error paths |
| dim5 — same-end gate | closed | Both in macOS Tauri invoke-handler; same Mutex (ProxyContext StateManager pattern) |
| dim6 — test/acceptance | **missing** | ceiling = strictImplementationUse (source archive impl-side activity) |

**achieved: strictImplementationUse**
implementation_use: false (dim6 missing)
gate_accepted: false (dim6 missing)

---

## ICF / Ceiling Notes

- `drop_in_place<Filter<Filter<IntoIter<MysteryRouteGrant>, closure>, closure>>@0x1004be160`: destructor for `in_place_collect` filter chain in `get_mystery_unlock_grants`; NOT a poll body. Accepted as destructor — does not affect dim2.
- Filter closure predicate in `get_mystery_unlock_grants`: ICF-merged into iterator machinery. Exact comparison direction (`epoch_ms > 0` vs `epoch_ms <= now_ms`) not separately decompiled. Marked `accepted_unknown` for filter predicate detail. Does not affect dim2-5 closure.
- `merge_mystery_unlock_grants` HashMap init uses `off_1012D5260 + xmmword_1012D5270` as capacity/buckets seed — not separately resolved; accepted (stdlib HashMap internals).
