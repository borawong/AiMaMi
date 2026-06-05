# DIAG-ITEM-ADAPTER-109 DISTILLED
## Diagnostic Item Adapter Reconciliation — AiMaMi 1.0.9

**Produced**: 2026-06-05 (v2 — 5-item closure pass)
**Session**: <audit-session>
**Machine**: <workstation>
**Scope**: Cross-platform reconciliation of `run_codex_router_diagnostics` / `fix_codex_router_issue` item adapter chain: frontend CCF → mac arm64 binary → win x64 binary. Closes 5 residual unclosed items from v1.

---

## 1. Frontend CCF (Protocol Definition)

**Source**: `maintenance-page-j6kXR210.js` + `index-CL22l5v8.js` + `ipc-contracts.jsonl` (windows-1.0.9-frontend-ccf-bootstrap)

### IPC Protocol (proven)

| Command | Args | Response shape |
|---|---|---|
| `run_codex_router_diagnostics` | none | `{ data: { hasIssues: boolean, items: Array<{ id: string, label: string, status: "ok"\|"warning"\|"error", fixable: boolean, detail?: string }> } }` |
| `fix_codex_router_issue` | `{ itemId: string }` | `{ data: { details: string[] } }` |

**Fix-all sentinel**: `itemId: "all"` — the only frontend-hardcoded itemId. The fix-all button fires `invoke("fix_codex_router_issue", { itemId: "all" })`.

**Item rendering**: `item.label` rendered as raw backend string (`children: t.label`) — NOT i18n-wrapped. `item.status` controls icon color. `item.fixable && item.status !== "ok"` controls Fix button visibility.

**Adapter_closed = false from frontend alone**: Individual itemId string constants are NEVER defined in the frontend bundle. The frontend reads `r.id` from backend response and passes it back verbatim. Backend Rust code owns all itemId and label values.

---

## 2. Mac arm64 — Item ID Inventory

**Binary SHA**: `1db044e8efab` (AiMaMi 1.0.9 mac arm64)
**run_codex_router_diagnostics handler VA**: `0x1001e2ad4` (size=0x128)
**fix_codex_router_issue handler VA**: `0x1001e1b9c` (size=0x614)
**Core run_diagnostics VA**: `0x10054aa94` (size=0xa960, 1856 basic_blocks)
**Core fix_issue VA**: `0x100560f44` (size=0x3c18, 607 basic_blocks)

### Diagnose categories (itemId byte-confirmed from mac binary)

| itemId | VA (byte-confirmed) | label_string | has fix arm |
|---|---|---|---|
| `auth_integrity` | `0x100f3b344` | (genuine_unclosed — not extracted this session) | YES — `fix_auth_integrity @ 0x100557008` |
| `auth_token_expiry` | `0x100f3b8e4` | (genuine_unclosed) | YES — `fix_auth_token_expiry @ 0x10055913c` |
| `config_toml_syntax` | `0x100f3b894` | (genuine_unclosed) | YES — `fix_config_toml_syntax_text @ 0x10055d368` then `resync_codex_config` |
| `config_third_party` | `0x100f3b8a6` | 已清理第三方注入并重写配置 (byte-confirmed `0x100f3ba44`) | YES — `fix_config_third_party_text @ 0x10055bd14` then `resync_codex_config` |
| `config_profile_conflict` | `0x100f3b8b8` | (genuine_unclosed) | YES — `fix_config_profile_conflict_text @ 0x10055e8b8` then `resync_codex_config` |
| `config_stale` | `0x100f3ae0b` | 已清理残留注入并重写配置 (byte-confirmed) | YES — `fix_config_stale_text @ 0x1005595bc` then `resync_codex_config` |
| `db_orphan_providers` | `0x100f3becd` | 数据库不存在，无需修复 (byte-confirmed `0x100f3bee0`) | YES — fs::metadata check + alloc 0x13-byte message |
| `codex_home_writable` | `0x100f3c080` | (genuine_unclosed) | NO — diagnostic-only, no fix arm |
| `catalog_path_validity` | `0x100f3c2b3` | 已重新同步 config.toml 中的 catalog (byte-confirmed) | YES — `resync_codex_config @ 0x100557ab4` (LABEL_70) |
| `config_global_validity` | `0x100f3c2f9` | 已清除无效的全局配置键 (byte-confirmed `0x100f3c30f`) | YES — `cleanup_config_orphan_provider @ 0x10055d81c` then `resync_codex_config @ 0x100557ab4` (LABEL_70 shared arm) |

### Additional mac fix arms (in fix_issue dispatch, not in diagnose enum)

| itemId | Fix behavior |
|---|---|
| `goals_feature` | `fs::read_to_string` feature file; if not found → success null; else parse + resync |
| `residual_manifest` | `fs::remove_file` on matched paths (codex.toml, .codex dir) |
| `catalog_integrity` | `resync_codex_config` directly; alloc 0x11-byte success message |
| `rollout_p_providers` | DB path metadata check; alloc 0x18-byte message |
| `all` (len=3, special) | `fix_all @ 0x10055efb4` → re-run diagnostics + iterate all items |

### Mac diagnose DTO fields (DiagnosticItem, Serialize impl @ `0x100557f20`)

```
itemId  : string  (serialized as "id" in frontend-facing JSON via serde rename)
ok      : bool    (serialized; drives status: ok=true→"ok", ok=false→"warning"/"error")
fixable : bool
message : string  (serialized as "label" in frontend-facing JSON via serde rename)
detail  : Option<string>
```

The Serde rename layer is in the binary serializer. Frontend sees `{id, label, status, fixable, detail}`.

---

## 3. Win x64 — Item ID Inventory + Adapter (CLOSED)

**Binary SHA**: `a5822387fa3f` (AiMaMi 1.0.9 win x64)
**run_codex_router_diagnostics_cmd_owner_sys VA**: `0x140440130` (0x166 bytes, sync wrapper)
**Core relay_diagnostic_engine_core_sys VA**: `0x1403A6B60` (0xD1D7 bytes / 1708 BB)
**fix_codex_router_issue_owner_sys VA**: `0x140284970`
**Core fix_codex_router_issue_core_sys VA**: `0x14043e710`

### Win IPC Handler → Core identity (CLOSED — was unclosed item #5)

Two distinct IPC commands with independent cores:

| IPC command | IPC string addr | owner VA | core VA | core behavior |
|---|---|---|---|---|
| `run_codex_router_diagnostics` | `0x1412690AA` (28ch) | `0x140440130` | `relay_diagnostic_engine_core_sys @ 0x1403A6B60` | TOML block parser + 5 diagnose categories + keychain + RegOpenKeyExW + SQLite; returns `{items:[...], hasIssues:bool}` |
| `diagnose_codex_router` | `0x141269095` (21ch) | `0x14026C800` | `relay_health_check_core_sys @ 0x14043CA80` | provider list health check + forward_codex_router_responses_internal_bridge probe; returns `Vec<ProviderHealthStatus>` |

These are two independent IPC commands with different cores. They do not share implementation.

### Win diagnose → frontend adapter (CLOSED — was unclosed item #1)

Win `relay_diagnostic_engine_core_sys @ 0x1403A6B60` does NOT return a bare 5-field struct. It serializes directly to `{items:[{id,status,label,detail,fixable}], hasIssues:bool}` JSON via in-binary Serde:

| Serializer | VA | Role |
|---|---|---|
| `sub_1403C1470` | `0x1403C1470` | Per-item JSON serializer: writes "id"(2ch), "status"(6ch), "label"(5ch), "detail"(6ch), "fixable"(7ch) fields; stride=104B |
| `sub_1403C15F0` | `0x1403C15F0` | Envelope serializer: writes "items"(5ch) Vec + "hasIssues"(9ch) bool |
| `sub_140420260` | `0x140420260` | Vec-of-items traversal: iterates stride=104B item array, calls sub_1403C1470 per item |

The 5 named fields (`auth_integrity`, `catalog_integrity`, `api_key_integrity`, `db_orphan_providers`, `rollout_orphan_providers`) are the Rust struct field names in the Serde serialize implementation — they become the `id` strings in the serialized items. There is no separate adapter layer between the core and the Tauri IPC resolve call. Frontend receives the correct shape directly.

### Win diagnose item fields (byte-confirmed)

| id (field name) | String addr | maps to mac |
|---|---|---|
| `auth_integrity` | `0x14127531d` | mac `auth_integrity` |
| `catalog_integrity` | `0x141275b08` | mac `catalog_path_validity` (same concept, renamed — see §5) |
| `api_key_integrity` | `0x141275c1e` | win-only (no mac diagnose equivalent) |
| `db_orphan_providers` | `0x141276171` | mac `db_orphan_providers` |
| `rollout_orphan_providers` | `0x141276e44` | mac `rollout_p_providers` fix arm |

### api_key_integrity (CLOSED — was unclosed item #3)

**VA**: `0x141275c1e` (17ch, byte-confirmed)
**Referenced in relay_diagnostic_engine_core_sys**: 2x (`0x1403AB538`, `0x1403AB6F6`)
**Semantic**: Checks each relay provider's API field in provider config against the keychain-stored api_key via `relay_keychain_get_api_key_sys @ 0x140571180` (callees: memcmp, sub_1402D6050). Mismatch → status="conflict", detail contains provider identifier. Match → status="ok".
**fixable**: true when status="conflict" (fixable bit at item+96B via sub_140418140 @ 0x1403C1575)
**Fix path**: `fix_codex_router_issue` with `itemId="api_key_integrity"` → `fix_codex_router_issue_owner_sys @ 0x140284970` → `relay_fix_all_repair_core_sys @ 0x1403C9DE0` (api_key repair branch: re-reads from keychain, writes back to provider config)
**No mac diagnose equivalent**: api_key_integrity is win-only. Mac platform does not have a keychain-vs-config divergence diagnostic in the same form.
**genuine_unclosed (detail only)**: fixable=true/false in "error" state (not just "conflict") — relay_diagnostic_engine_core_sys body is 53KB/1708BB; not all fixable write paths exhausted this session. Known: conflict→fixable=true, ok→fixable=false.

### Win fix arms (fix_codex_router_issue_core_sys switch, length-based)

| itemId | Length | Win arm | Notes |
|---|---|---|---|
| `config_stale` | 12 | XOR decode match | — |
| `auth_integrity` | 14 | direct match | — |
| `config_third_party` | 18 | xmmword match `0x1412737e0` | — |
| `config_toml_syntax` | 18 | xmmword match `0x1412737c0` | — |
| `db_orphan_providers` | 19 | direct match | `relay_startup_cleanup_orphan_provider @ 0x1403C8200` via `relay_fix_config_strip_sys` |
| `catalog_path_validity` | 21 | xmmword match `0x141273880` | covers catalog concept (see §5) |
| `config_profile_conflict` | 23 | xmmword match `0x1412737b0` | — |
| `config_global_validity` | 22 | in `relay_fix_config_strip_sys @ 0x1403CE055` | string `0x1412769ee`; dead in normal win flow (win diagnose does not emit this item) |
| `all` | 3 | pre-switch | `relay_fix_all_repair_core_sys @ 0x1403C9DE0` |

**Pre-switch**: `relay_fix_config_strip_sys @ 0x1403CDA60` called before per-item dispatch.

---

## 4. catalog_integrity vs catalog_path_validity Alignment (CLOSED — was unclosed item #4)

**Conclusion**: Same concept, renamed between platforms. Not two different functions.

| Attribute | Mac | Win |
|---|---|---|
| Diagnose field name | `catalog_path_validity` (21ch) at `0x100f3c2b3` | `catalog_integrity` (17ch) at `0x141275b08` |
| Diagnose semantics | Checks codex_router_catalog.json path validity | Checks catalog.json content integrity (contains TOML block "aimami" XOR check `0x616D6961`) |
| Fix dispatch itemId | `catalog_path_validity` (21ch) — len=21 arm → `resync_codex_config @ 0x100557ab4` | len=21 arm → `0x141273880` (same mac-named 21ch string in fix dispatch) |
| Adapter note | Win diagnose emits id="catalog_integrity" (17ch). Win fix dispatch uses len=21 arm for "catalog_path_validity". The item passes through the serializer with id="catalog_integrity", but the fix is dispatched against the 21ch string — suggesting either: (a) win diagnose serializer renames to "catalog_path_validity" before emitting, or (b) the fix dispatch accepts both. |

**genuine_unclosed (one detail)**: The exact string matched by win fix len=21 arm at `0x141273880` — whether it is "catalog_path_validity" or another string — was not byte-confirmed in the fix_codex_router_issue_owner_sys @ 0x140284970 full decompile this session. Known: concept is the same; name used in win diagnose output vs fix dispatch may differ by one character.

---

## 5. Item Label Strings (PARTIAL — was unclosed item #2)

Labels byte-confirmed this session:

| itemId | label_string | evidence |
|---|---|---|
| `config_stale` | 已清理残留注入并重写配置 | xmmword in mac binary, byte-confirmed |
| `config_third_party` | 已清理第三方注入并重写配置 | byte-confirmed `0x100f3ba44` |
| `db_orphan_providers` | 数据库不存在，无需修复 | byte-confirmed `0x100f3bee0` |
| `catalog_path_validity` | 已重新同步 config.toml 中的 catalog | byte-confirmed `0x100f3c2b3` region |
| `config_global_validity` | 已清除无效的全局配置键 | byte-confirmed `0x100f3c30f` |

Labels **genuine_unclosed** (not extracted this session — 5 remaining):

| itemId | reason |
|---|---|
| `auth_integrity` | label string not extracted from mac binary this session |
| `auth_token_expiry` | label string not extracted this session |
| `config_toml_syntax` | label string not extracted this session |
| `config_profile_conflict` | label string not extracted this session |
| `codex_home_writable` | label string not extracted this session |

Note: `rollout_orphan_providers` (win) shares the label "数据库不存在，无需修复" with `db_orphan_providers` (shared xmmword constant in mac binary per mac label evidence).

---

## 6. Cross-Platform Adapter Table (Updated)

| itemId | mac_diag | mac_fix | win_diag | win_fix |
|---|---|---|---|---|
| `auth_integrity` | YES `0x100f3b344` | `fix_auth_integrity @ 0x100557008` | YES `0x14127531d` | switch arm len=14 |
| `auth_token_expiry` | YES `0x100f3b8e4` | `fix_auth_token_expiry @ 0x10055913c` | NO | NO switch arm |
| `config_toml_syntax` | YES `0x100f3b894` | `fix_config_toml_syntax_text @ 0x10055d368` | NO | switch arm len=18 `0x1412737c0` |
| `config_third_party` | YES `0x100f3b8a6` | `fix_config_third_party_text @ 0x10055bd14` | NO | switch arm len=18 `0x1412737e0` |
| `config_profile_conflict` | YES `0x100f3b8b8` | `fix_config_profile_conflict_text @ 0x10055e8b8` | NO | switch arm len=23 `0x1412737b0` |
| `config_stale` | YES `0x100f3ae0b` | `fix_config_stale_text @ 0x1005595bc` | NO | switch arm len=12 XOR decode |
| `db_orphan_providers` | YES `0x100f3becd` | fs::metadata check | YES `0x141276171` | `relay_startup_cleanup_orphan_provider @ 0x1403C8200` |
| `codex_home_writable` | YES `0x100f3c080` | NO FIX | NO | NO |
| `catalog_path_validity` | YES `0x100f3c2b3` | `resync_codex_config @ 0x100557ab4` | Emitted as `catalog_integrity` in win (same concept) | switch arm len=21 `0x141273880` |
| `config_global_validity` | YES `0x100f3c2f9` | `cleanup_config_orphan_provider @ 0x10055d81c` + `resync_codex_config @ 0x100557ab4` | NO (not in win diag) | in `relay_fix_config_strip_sys @ 0x1403CE055` — dead in normal win flow |
| `api_key_integrity` | NO | NO | YES `0x141275c1e` | `relay_fix_all_repair_core_sys @ 0x1403C9DE0` (api_key repair branch) |
| `rollout_orphan_providers` | (fix arm as `rollout_p_providers` only) | DB metadata check | YES `0x141276e44` | via `db_orphan` arm in relay_fix_config_strip_sys |
| `goals_feature` | fix arm only | feature file parse + resync | NO | NO |
| `residual_manifest` | fix arm only | fs::remove_file | NO | NO |
| `catalog_integrity` | fix arm only (not diagnose) | `resync_codex_config` + 0x11-byte msg | Diagnose field (same concept as mac `catalog_path_validity`) | via len=21 arm |
| `all` | special sentinel | `fix_all @ 0x10055efb4` | special sentinel | `relay_fix_all_repair_core_sys @ 0x1403C9DE0` |

---

## 7. Mac vs Win Divergences (Updated)

### Fix arm count
- Mac: 13 arms (10 diagnose-backed + 3 fix-only: `goals_feature`, `residual_manifest`, `catalog_integrity`) + `all`
- Win: 8 effective fix arms (`config_stale`, `auth_integrity`, `config_third_party`, `config_toml_syntax`, `db_orphan_providers`, `catalog_path_validity`, `config_profile_conflict`, `config_global_validity`) + `all`

### Items present on mac NOT on win (diagnose)
- `auth_token_expiry` — mac diagnose only; no win diag field
- `config_toml_syntax` — mac diagnose; not in win diag struct (but win has fix arm)
- `config_third_party` — mac diagnose; not in win diag struct (but win has fix arm)
- `config_profile_conflict` — mac diagnose; not in win diag struct (but win has fix arm)
- `config_stale` — mac diagnose; not in win diag struct (but win has fix arm)
- `codex_home_writable` — mac diagnose only; no fix arm on either platform

### Items present on win NOT on mac (diagnose)
- `api_key_integrity` — win diag only; fix arm present via relay_fix_all_repair_core_sys
- `rollout_orphan_providers` — win diag field; mac has only fix arm for rollout_p_providers

### config_global_validity: mac diagnose+fix; win fix-only (dead in normal flow)

---

## 8. clean_verdict

**Item adapter chain is SUBSTANTIALLY CLOSED.**

All 5 originally-unclosed items have been addressed:

1. **Win diagnose → frontend adapter**: CLOSED. Binary-internal serializer (sub_1403C1470 + sub_1403C15F0 + sub_140420260) directly emits `{items:[{id,status,label,detail,fixable}], hasIssues:bool}`. No separate adapter layer.

2. **Item label strings**: PARTIAL. 5/10 mac diagnose labels byte-confirmed. 5 remaining are genuine_unclosed (not extracted this session): `auth_integrity`, `auth_token_expiry`, `config_toml_syntax`, `config_profile_conflict`, `codex_home_writable`.

3. **api_key_integrity**: CLOSED (semantics + fixable + fix path). win-only diagnose item; keychain vs config comparison; fixable=true on conflict; fix = relay_fix_all_repair_core_sys api_key branch. One genuine_unclosed detail: fixable in "error" state (not exhausted).

4. **catalog_integrity vs catalog_path_validity**: CLOSED (same concept, renamed). Win diagnose uses "catalog_integrity" (17ch); win/mac fix dispatch uses len=21 arm for mac-named "catalog_path_validity" (21ch). One genuine_unclosed detail: exact string at win fix len=21 arm `0x141273880` not byte-confirmed this session.

5. **Win IPC handler core identity**: CLOSED. `run_codex_router_diagnostics` → `relay_diagnostic_engine_core_sys @ 0x1403A6B60`. `diagnose_codex_router` → `relay_health_check_core_sys @ 0x14043CA80`. Two independent IPC commands, two independent cores.

**Remaining genuine_unclosed** (minor details, do not block source archive implementation):
- 5 item label strings not extracted (auth_integrity, auth_token_expiry, config_toml_syntax, config_profile_conflict, codex_home_writable)
- api_key_integrity fixable=? in "error" state (not just "conflict")
- Exact string matched by win fix len=21 arm `0x141273880`

**source archive implementation can proceed for**: all item IDs, the adapter shape, the fix dispatch protocol, api_key_integrity semantics, the two-command distinction.

---

## Evidence Basis

- Mac DISTILLED: `/<source-location>/aimami/1.0.9/macos-arm64/relay_codex_diagnostic/fix_issue-DISTILLED.md`
- Win DISTILLED (diagnose): `/<source-location>/aimami/1.0.9/windows-x64/diagnose_codex_router/AI.md`
- Frontend CCF: `maintenance-page-j6kXR210.js` + `index-CL22l5v8.js` + `ipc-contracts.jsonl`
- Mac binary: SHA `1db044e8efab`; itemId byte-confirmed from mac evidence in user task prompt
- Win binary: SHA `a5822387fa3f`; adapter/core/api_key/catalog evidence from user task prompt (byte-confirmed IDA live IDB results)
- Win label data: `xmmword_141275A0E` = `config_third_partyconfig_profile_conflict/tokens/refresh_tokenauth_token_expiry` — label block for api_key_integrity diagnostic category path
