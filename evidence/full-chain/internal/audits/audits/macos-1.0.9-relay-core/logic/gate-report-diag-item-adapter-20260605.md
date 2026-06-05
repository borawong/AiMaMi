# Gate Report — DIAG-ITEM-ADAPTER-109

Date: 2026-06-05
Session: <audit-session>
Binary: AiMaMi 1.0.9 (mac sha12=1db044e8efab / win sha12=a5822387fa3f)

---

## Gate Summary

### Mac DiagnosticItem 5-Label Closure

All 5 mac run_diagnostics DiagnosticItem categories accounted for:
- auth_integrity: CLOSED (byte-confirm)
- auth_token_expiry: CLOSED (5 label variants + 2 fixer labels, all byte-confirm)
- config_toml_syntax: CLOSED (2 variants, byte-confirm)
- config_profile_conflict: CLOSED (2 variants, byte-confirm)
- codex_home_writable: genuine_unclosed (runtime-assembled label; itemId confirmed; label content not single grounded string)

Minor count verdict: 4/5 byte-confirm full; 1 genuine_unclosed (non-gate-blocker for adapter pattern — the itemId and field layout are confirmed; only the runtime label text assembly path is unresolved)

### Win len=21 String Dispatch Arm

addr 0x141273880 confirmed as "catalog_path_valroviders" (len=24, not len=21)
The string is NOT "catalog_path_validity".
Dispatch arm measuring len=21 against this addr: measurement boundary discrepancy only; the actual string content is "catalog_path_valroviders".
Status: CLOSED as non-match; no further reverification needed.

### Win api_key_integrity fixable Field

status=error branch: fixable written as 0x00 (false) at 0x1403AB6E7.
Primary write confirmed by raw bytes C6 45 28 00.
genuine_unclosed: subsequent writes to item+0x60 in the 53KB function body not fully exhausted.
Status: CONDITIONALLY CLOSED — primary write confirmed false; full-exhaustion genuine_unclosed noted.

---

## Diag Item Adapter Chain Final Verdict

Is the diag item adapter chain byte-confirm full-closed on both platforms?

NO — one genuine blocking gap remains:

Win frontend CCF product gap: the frontend invoke chain for relay_diagnostic commands on Windows was not extractable (IDA MCP offline during win CCF session). This means the consumer cannot confirm that the win frontend calls relay_diagnostic_engine_core_sys via the same IPC adapter path as mac. This gap prevents win readyToImplement gate.

Mac side: consumerStartReady. Gate = pass. The diag adapter chain is closed on mac for consumer use.
Win side: strictImplementationUse. Gate = conditional pass with CCF gap noted. Win frontend CCF product gap is the only remaining true blocking gap.

---

## Residual Work

1. Win frontend CCF closure for relay_diagnostic: reconnect win IDA MCP endpoint, extract CCF from win frontend bundle, confirm invoke("run_diagnostics") or equivalent -> relay_diagnostic_engine_core_sys binding.
2. codex_home_writable label runtime assembly (mac): optional — document the join/format call chain if label content is needed for UI. Not required for adapter gate.
3. api_key fixable full-exhaustion (win): optional reverify — trace all writes to item+0x60 in relay_diagnostic_engine_core_sys after 0x1403AB6E7. Low priority given primary write is confirmed false.

---

## Deliverables Written This Session

1. DIAG-ITEM-ADAPTER-109-DISTILLED-v3.md (this audit dir)
2. gate-report-20260605.md (this file)
3. REVERSE-STATUS.md updated (relay_diagnostic section, diag-item-adapter-109 entry)
