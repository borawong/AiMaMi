# GET-IMAGE-COMPAT — Deep Re-Verification Distilled Evidence

session: <audit-session>
produced_at: 2026-06-04
machine: <workstation>
producer: claude-opus (deep re-verify, live IDB)
binary_sha256: 1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482
gate_tier: strictImplementationUse
genuine_ceiling: false
platform: macos-arm64

> This pass is an independent live-IDB re-verification (ida-pro-mcp-mac, server_health
> confirmed same SHA). It does NOT trust prior leaf summaries. It corrects two earlier
> documentation errors (see "Corrections" below) and aligns the gate tier to the canonical
> manifest/INDEX/REVERSE-STATUS record (strictImplementationUse; dim6 product-decision),
> superseding a stale readyToImplement over-claim in the prior revision of this file.

---

## Function Identity

| Field | Value |
|---|---|
| VA | 0x10025e7c0 |
| Size | 0x2cc (716 bytes) |
| Demangled name | `codexmate_lib::commands::system::get_image_compat::h592fbf822b1d10cc` |
| Mangled | `__ZN13codexmate_lib8commands6system16get_image_compat17h592fbf822b1d10ccE` |
| IDB | AiMaMi 1.0.9_ida.app/Contents/MacOS/AiMaMi.i64 |
| Evidence grade | A-level owner (demangled symbol, `func_query` single hit, `has_type=true`) |
| Call conv | `__usercall ...@<X0>(_OWORD *a1@<X8>)` — sret to X8 stack slot (synchronous Tauri command) |
| Real body? | YES — full synchronous body decompiled, no HexRays failure marker. NOT a shim/drop/async stub. |

Fresh decompile 2026-06-04: body identical to the stored pseudocode
(`0001_get_image_compat_owner_sys_592fbf82.c`). No binary change.

---

## dim1 — Frontend CCF / UI State (Accepted — DORMANT WRAPPER, pure-backend orphan)

IPC contract present in shipped frontend bundle:
```
api.getImageCompat()  →  invoke("get_image_compat")     [frontend/FRONTEND-FULL-CHAIN-109.md L17]
argKeys: []   response consumed as: .data.enabled (bool)
```
Live-UI consumer status: **NONE**. `FRONTEND-CURRENT-source archive-CONSUMER-CHAIN-109.md` L54 states
"no active `api.getImageCompat()`" in current source archive source — the `api.ts` wrapper exists but
no live page/component calls it. The command is reachable only via the Tauri IPC dispatch
table. This matches the task framing "pure backend orphan."

dim1 is satisfied at the IPC-contract level (terminal_call.command == get_image_compat,
argKeys=[]); there is no preflight guard because there is no live caller (confirmed-no-active-consumer).

---

## dim2 — Backend Owner / Pseudocode (Accepted)

Owner at `0x10025e7c0` confirmed by:
- `func_query(name_regex="get_image_compat")` → single hit, size 0x2cc, has_type=true.
- `decompile(0x10025e7c0)` → full pseudocode, SHA-bound, no failure marker.
- `xrefs_to(0x10025e7c0)` → exactly 1 caller: `0x10031c028` inside
  `codexmate_lib::run::{{closure}}::hf16e5a18dd1a67bb` @ `0x1003187fc` (Tauri IPC dispatch closure).

Body logic (synchronous):
1. `CodexPaths::resolve_codex_home(&v35)`  [0x100526914]
2. `CodexPaths::from_home(&v35, v34)`       [0x100526a40]  (builds 28+ path slots; config.toml slot)
3. `std::fs::read_to_string::inner(&v35, v34[slot56], v34[slot64])` [0x100d2c1f4]  reads config.toml
4. If Result == 0x8000000000000000 (Err niche) → cleanup → return false.
5. Line-scan (`CharSearcher::next_match`, split on `\n` = 0x0A) over file contents.
6. Per trimmed line: detect `[features]` header → set in-section flag → match `image_generation` field
   → after `=`, trim value → if value == "false" set bool=true.
7. `CoreEnvelope<T>::ok(bool, &v35)`        [0x1001d9148]  wraps response.
8. return `drop_in_place<CodexPaths>(v34)`  [0x100281aec]  RAII stack cleanup (NOT async poll).

### Byte-literal constants (verified, this pass)
| Literal | Hex | Meaning |
|---|---|---|
| section bytes 0-7 | `0x657275746165665B` | "[featur" (LE) |
| section bytes 8-9 (`23923`) | `0x5D73` | "s]" → full header `"[features]"`, len check == 10 |
| field bytes 0-7 | `0x65675F6567616D69` | "image_ge" (LE) |
| field bytes 8-15 | `0x6E6F69746172656E` | "neration" → field `"image_generation"`, 16 bytes |
| value dword (`1936482662`) | `0x736C6166` | "fals" (LE) |
| value byte +4 (`101`) | `0x65` | 'e' → value `"false"`, len check == 5 |
| split char | `0x0A` | newline; CRLF handled (`\r` trim at line end) |

rodata anchor: `0x100ee466f` = `"image_generation = false"` (24 bytes, exact).

---

## dim3 — Call-Tree to Implementation Leaves (Accepted)

```
depth0  commands::system::get_image_compat            [0x10025e7c0]
depth1  CodexPaths::resolve_codex_home                [0x100526914]
   depth2  std::env::var("CODEX_HOME")                [rodata 0x100F3933A]   TERM external_call_recorded
   depth2  dirs::home_dir                             [0x100b9f628]          TERM external_call_recorded
           fallback chain: $CODEX_HOME | dirs::home_dir()/".codex" | "." (0x2E single byte)
depth1  CodexPaths::from_home                         [0x100526a40]
   depth2  std::path::Path::_join (×28+ slots)        [0x100d38cc4]          TERM external_call_recorded
   depth2  std::sys::fs::metadata                     [0x100d322dc]          TERM external_call_recorded (migration probe)
   depth2  std::sys::fs::rename                       [0x100d31eac]          TERM external_call_recorded (codexmate-old→codexmate migration)
depth1  std::fs::read_to_string::inner                [0x100d2c1f4]          TERM external_call_recorded (config.toml read)
depth1  CharSearcher::next_match                      [0x1002a1044]          parse leaf (newline split)
depth1  str::trim_matches                             [0x10058b240]          parse leaf
depth1  str::trim_start_matches                       [0x10058b7ec]          parse leaf (after field)
depth1  CoreEnvelope<T>::ok                           [0x1001d9148]          TERM response_serialize
depth1  drop_in_place<CodexPaths>                     [0x100281aec]          TERM error_return (RAII cleanup)
```
Edges ≥ 5 (13 edges); multiple terminated_reasons. Threshold met.

Note: IDA `callees(0x10025e7c0)` returns empty because all call targets are direct BL whose
resolved symbols appear in the decompile `refs` list (inline) rather than the callee index —
verified by reading the decompile `refs`, not a coverage gap.

---

## dim4 — Interface / DTO / Error / Side-Effect (Accepted)

```
IPC command:  get_image_compat
argKeys:      []   (no arguments)
response:     CoreEnvelope<bool>
              DTO bytes (from CoreEnvelope::ok @0x1001d9148):
                status  = "ok"      (2B, 0x6B6F)
                message = "success" (7B, 0x63637573...="succ"+"ess")
                data    = bool @ struct offset +77
              .data = true   ↔  config.toml has [features] AND image_generation = false
              .data = false  ↔  file missing | IO error | [features] absent | field absent | value != "false"
error:        NONE surfaced — all IO/parse failures degrade to CoreEnvelope<bool>(false).
              No CoreError raised on this path. No unwrap/expect/panic in business path.
side-effects: READ  <codex_home>/config.toml         (no write by this command)
              POSSIBLE rename: CodexPaths::from_home migrates codexmate-old → codexmate
                               (fs::metadata probe + fs::rename) — incidental to path resolution,
                               not specific to image-compat read.
config path:  <codex_home>/config.toml
              codex_home = $CODEX_HOME | dirs::home_dir()/".codex" | "."  (home-root, not codexmate subdir)
```

**Semantic inversion (load-bearing):** TOML `image_generation = false` → returns `enabled = true`.
"image compat enabled" means image *generation* is OFF. Returns false in every other case.

---

## dim5 — Same-Platform Gate (Accepted)

- Platform: macOS arm64 (Mach-O universal; arm64 slice).
- binary_sha256: `1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482`
  (== IDB server_health == raw/binary SOT).
- thin arm64 sha256: `985dae00be620b21164b4a8d35cc0379b750d5a6257b25897b0e813441e4d706`.
- Windows: separate scope (`windows-1.0.9-system` / `windows-1.0.9-relay-core`), not this pass.
  Win owner = `relay_image_compat_get_handler_sys@0x1402779B0` → `read_config_toml_sys@0x1400A55F0`
  (independent implementation; Win uses SSE 16-byte prefix compare; do NOT extrapolate mac↔win).

---

## dim6 — Test / Acceptance Mapping (product-decision; tier-limiting)

`ACCEPTANCE-MAPPING-109.md` carries candidate cargo/vitest assertions for this leaf
(true/false/missing-section/value-true/case-sensitive). However the canonical
`macos-1.0.9-system` bundle records dim6 as **false / product-decision** at bundle level
(INDEX line 490: `status=...dim6_false...`; manifest gate readyToImplement=false). Because
there is no live source archive UI consumer (dim1 dormant), E2E acceptance cannot be mapped to a shipping
surface; dim6 closure is a source archive-side product decision, not a binary-evidence gap.

=> dim6 remains OPEN → tier capped at **strictImplementationUse** (NOT readyToImplement).

---

## Assumed-Unknown / Accepted-Unknown Audit (Red-Line 13 anti-cheat)

No `accepted_unknown` and no `genuine_ceiling` claimed. All behavior visible in pseudocode.

False-wall taxonomy — each checked and cleared:
- **drop_in_place ≠ async body**: final `drop_in_place<CodexPaths>@0x100281aec` is the RAII
  destructor for the stack-built CodexPaths struct on the normal return path. Function is
  synchronous (`__usercall` sret, no `{async_fn_env}`, no `Future::poll`, no generator resume).
  Single caller is the synchronous Tauri dispatch closure (not a spawn/poll). No async body exists to find.
- **architecture_only / budget**: 716B body fully decompiled in one pass; both callees
  (from_home 0x100526a40, CoreEnvelope::ok 0x1001d9148) decompiled in full. No budget bail.
- **async decompile failed**: N/A — synchronous command.
- **wrong VA**: `func_query` → single hit @0x10025e7c0; `xrefs_to` → single caller. No adjacent-function
  misID. Cross-checked against relay-core sibling `read_image_compat_enabled@0x1001bfdd4` which shows
  byte-identical TOML scan logic, confirming this is the real image-compat reader.
- **vtable / dynamic dispatch**: none in body; all callees statically resolved via decompile refs.
- **HTTP-terminal**: none; pure local fs read. No reqwest/rustls/client builder on this path.
- **library internals**: `CharSearcher::next_match`, `trim_matches`, `trim_start_matches` are parse
  primitives; AiMaMi's config-reading + field-matching logic is the visible callsite.
- **超大体 / oversized**: N/A (716B).

**recovery_attempts**: none required — no unknown/ceiling reached; all six dims resolved from
the live body and its decompiled callees.

---

## Corrections to prior documentation (flagged for downstream consumers)

1. **Prior revision of THIS file over-claimed `gate_tier: readyToImplement`** with a live
   `MaintenancePage useQuery(["imageCompat"])` chain as dim1. That live-UI chain is NOT supported
   by the bundle's own `FRONTEND-CURRENT-source archive-CONSUMER-CHAIN-109.md` (no active getImageCompat consumer).
   Canonical tier per manifest/INDEX/REVERSE-STATUS is **strictImplementationUse** (dim6 open). This
   revision corrects the tier and the dim1 description (dormant wrapper, pure-backend orphan).
2. **`raw/.../relay-core/relay_image_compat/INTERFACE-MAP.md` Leaf 2 + DTO section mislabel the TOML
   contract**: it states section `[feature]` (9 chars) and value `"true"` (with `1936482662="true"`).
   Live bytes prove section `"[features]"` (10 chars, len check==10) and value `"false"`
   (`1936482662 = 0x736C6166 = "fals"`+`e`). The semantics are: value `false` ⇒ returns enabled=true.
   That file is corrected in this pass (see its 2026-06-04 note).

---

## Gate Summary

| dim | status | basis |
|---|---|---|
| dim1 frontend CCF/UI | Accepted (dormant wrapper) | api.getImageCompat→invoke present; no live UI consumer |
| dim2 backend owner/pseudocode | Accepted | IDA A-level, 0x10025e7c0, real sync body |
| dim3 call-tree to leaves | Accepted | 13 edges, terminated_reasons confirmed |
| dim4 interface/DTO/error/side-effect | Accepted | argKeys=[], CoreEnvelope<bool> data@+77, READ-only, error-degrade |
| dim5 macOS platform gate | Accepted | arm64 SHA == IDB == SOT |
| dim6 test/acceptance mapping | OPEN (product-decision) | no live consumer; source archive-side decision |

**gate_tier: strictImplementationUse** (dims1-5 closed; dim6 open/product-decision)
**genuine_ceiling: false**
**was_false_wall: N/A (no ceiling claimed; full body visible)**

---

## Evidence Paths

Raw pseudocode: `<source-location>/raw/aimami/1.0.9/macos/system/get_image_compat/ida/pseudocode/0001_get_image_compat_owner_sys_592fbf82.c`
Call-tree: `<source-location>/raw/aimami/1.0.9/macos/system/get_image_compat/call-trees/codexmate_lib__commands__system__get_image_compat.jsonl`
Raw manifest: `<source-location>/raw/aimami/1.0.9/macos/system/get_image_compat/manifest.json`
Relay-core sibling (cache path): `<source-location>/raw/aimami/1.0.9/macos/relay-core/relay_image_compat/` (read_image_compat_enabled@0x1001bfdd4, image_compat_enabled@0x1001bf94c)
Consumer bundle: `<source-location>/audits/macos-1.0.9-system/`
Dim6 candidate mapping: `<source-location>/audits/macos-1.0.9-system/logic/ACCEPTANCE-MAPPING-109.md`
IDB: `<source-location>/source-binary/AiMaMi 1.0.9_ida.app/Contents/MacOS/AiMaMi.i64` (comment appended @0x10025e7c0; idb saved 2026-06-04)
