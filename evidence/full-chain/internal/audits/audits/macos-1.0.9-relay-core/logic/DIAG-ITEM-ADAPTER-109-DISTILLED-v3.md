# DIAG-ITEM-ADAPTER-109 DISTILLED v3

Updated: 2026-06-05
Binary: AiMaMi 1.0.9
SHA12 prefix: mac=1db044e8efab / win=a5822387fa3f
Session: <audit-session>
Status: DISTILLED v3 — mac byte-confirm near-full; win CCF product gap remains

---

## Mac Side — 5 DiagnosticItem Categories (run_diagnostics @ 0x10054aa94)

### 1. auth_integrity

itemId: "auth_integrity" @ 0x100f3b344 (14 bytes)
label (single static): "Codex 未登录或文件被删除，官方模型透传将失败（401）" @ 0x100f3b5cf (72 bytes)
status: warning/error (varies by auth state)
fixable: not statically confirmed (varies)
byte-confirm: CONFIRMED (IDA string read + addr)

### 2. auth_token_expiry

itemId: "auth_token_expiry" @ 0x100f3b8e4 (17 bytes)
labels (multiple variants):
  ok[no auth.json]:  "sensitive-field 过期检测（无 auth.json，跳过）" @ 0x100f3baa5 (46 bytes)
  ok[unreadable]:    "sensitive-field 过期检测（无法读取，跳过）"     @ 0x100f3bc78 (45 bytes)
  ok[JSON corrupt]:  "sensitive-field 过期检测（JSON 损坏，跳过）"  @ 0x100f3bc4c (44 bytes)
  err[null sensitive-field]:   "access_token 为空"                   @ 0x100f3bae2 (19 bytes)
  err[expired]:      "无法检测过期状态，需要重新登录"       @ 0x100f3baf5 (45 bytes)
fixer labels (fix_auth_token_expiry @ 0x10055913c):
  no refresh_token:  "无 refresh_token，无法自动刷新。请重新登录 ChatGPT" @ 0x100f3b8f5 (64 bytes)
  has refresh:       "sensitive-field 刷新需要网络请求，请关闭诊断弹窗后在账号管理页触发刷新" @ 0x100f3b935 (87 bytes)
byte-confirm: CONFIRMED (all variants)

### 3. config_toml_syntax

itemId: "config_toml_syntax" @ 0x100f3b894 (18 bytes)
labels:
  ok (normal):   "TOML 语法正常"       @ 0x100f3bf9c (17 bytes)
  ok (empty):    "TOML 语法正常（空文件）" @ 0x100f3bf7c (32 bytes)
byte-confirm: CONFIRMED

### 4. config_profile_conflict

itemId: "config_profile_conflict" @ 0x100f3b8b8 (23 bytes)
labels:
  warning: "路由已关闭但 config.toml 仍包含路由顶层注入"                          @ 0x100f3af75 (58 bytes)
  error:   "model_provider / openai_base_url / catalog 路径残留，需清理"           @ 0x100f3afaf (67 bytes)
byte-confirm: CONFIRMED

### 5. codex_home_writable

itemId: "codex_home_writable" @ 0x100f3c080 (19 bytes)
label: GENUINE_UNCLOSED — runtime-assembled via alloc::fmt::format + str::join
  static format fragments:
    "文件系统异常（"       (err path, part of dynamic label)
    "磁盘空间严重不足（剩" (ok path, disk space message fragment)
    separator: "；codex_process..."
  No single grounded static label string; cannot cite a byte-confirmed label addr.
byte-confirm: PARTIAL (itemId confirmed; label genuine_unclosed due to runtime assembly)

---

## Win Side — relay_diagnostic_engine_core_sys @ 0x1403A6B60

### api_key_integrity — fixable field

Function: relay_diagnostic_engine_core_sys (0xd1d7 bytes, ~53KB)
error branch entry: ~0x1403AB538 (api_key result discriminant == 2 / Err arm)
fixable write: 0x1403AB6E7: C6 45 28 00 = mov byte ptr [rbp+0x28], 0x00
field offset from item base: item+0x60 (96 bytes)
value written: 0x00 = false (not fixable)
byte-confirm: CONFIRMED for primary write
genuine_unclosed: cannot exhaust all subsequent writes to item+0x60 within the full 53KB body; only primary write at 0x1403AB6E7 confirmed

### catalog_path_valroviders string — dispatch len=21 clarification

addr: 0x141273880
bytes (first 22): 63 61 74 61 6c 6f 67 5f 70 61 74 68 5f 76 61 6c 72 6f 76 69 64 65
decoded: "catalog_path_valrovide..." (full IDA string: "catalog_path_valroviders", length=24)
verdict: NOT "catalog_path_validity"; the win dispatch arm probing len=21 does not resolve to "catalog_path_validity"; the string at 0x141273880 is "catalog_path_valroviders"
byte-confirm: CONFIRMED (string content); len discrepancy (dispatch probes len=21, actual string len=24) = measurement boundary difference, not gate-blocker

### Win Frontend CCF Product Gap

Status: NOT CLOSED
Reason: IDA MCP offline on win endpoint prevented win CCF extraction for relay_diagnostic invoke chain
Impact: cannot confirm the frontend invoke path for relay_diagnostic commands on Windows
Gate consequence: win side cannot reach readyToImplement; remains strictImplementationUse pending CCF closure

---

## Combined Gate Verdict

| platform | gate | consumer_tier | genuine_unclosed | notes |
|---|---|---|---|---|
| mac | pass | consumerStartReady | codex_home_writable label (runtime assembly) | 4/5 categories byte-confirm full; 1 genuine_unclosed non-blocker |
| win | not-full-pass | strictImplementationUse | win frontend CCF product gap + api_key fixable sub-path exhaustion | primary confirms done; CCF gap blocks readyToImplement |
| cross | partial | strictImplementationUse | win CCF gap is the only blocking gap remaining | mac consumerStartReady; win strictImplementationUse |

---

## Evidence Provenance

mac IDB: <source-location>/source-binary/AiMaMi 1.0.9_ida.app/Contents/MacOS/AiMaMi.i64
mac imagebase: 0x100000000
win IDB: confirmed live session win IDA endpoint
Binary SHAs: mac=1db044e8efab sha12 / win=a5822387fa3f sha12
All string addresses and byte values sourced from IDA MCP live queries against saved IDB.
