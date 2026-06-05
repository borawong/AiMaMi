# fix_config_preflight — Evidence

## Confirmed

- **Owner**: `codexmate_lib::core::relay::codex_diagnostic::fix_config_preflight::h24a65ec4c01a330f`
- **VA**: `0x1005581d8`
- **Size**: 3,740 bytes (0xe9c)
- **Binary SHA**: `1db044e8efab`
- **Called from**: `RelayManager::set_codex_router_enabled` at `0x1001ca74c` (not a Tauri command — internal pre-enable gate)
- **Inputs**: (a1: CodexPaths, a2: RelayState)
- **Logic**:
  1. `codex_writer::backup_user_router_top_level_overrides(CodexPaths, &mut result)` — backup before modification
  2. If backup fails: log error; continue (non-fatal)
  3. `run_diagnostics(CodexPaths, RelayState)` → get Vec<DiagnosticsItem>
  4. Collect non-ok items: `from_iter` filtering by status != "ok"
  5. For each failing item dispatch by issue_kind (string equality):
     - `config_stale` (12 chars, 0x735F6769666E6F63 + 1701601652) → `fix_config_stale_text(config_toml_path, ...)`
     - `config_toml_syntax` (18 chars) → `fix_config_toml_syntax_text(config_toml_path, ...)`
     - `config_third_party` (18 chars, 0x745F6769666E6F63 + 7237742675....) → `fix_config_third_party_text(CodexPaths, providers, ...)`
     - `config_profile_conflict` (23 chars) → `fix_config_profile_conflict_text(config_toml_path, ...)`
  6. Read config.toml line-by-line (CharSearcher '\n'):
     - Track managed blocks via marker strings:
       - `# <<< aimami-relay managed end` (30 chars)
       - `# <<< aimami-relay managed end, DO NOT EDIT MANUALLY` (36 chars)  
       - `# <<< aimami-relay codex-router top end` (39 chars)
       - `# >>> aimami-relay codex-router top start, DO NOT EDIT MANUALLY` (60 chars, 64 chars variants)
       - `# >>> aimami-relay managed start, DO NOT EDIT MANUALLY` (55 chars)
     - Within managed blocks (v39 flag): copy lines verbatim
     - Outside managed blocks: strip these keys:
       - `profile` / `profile=` (6-8 chars)
       - `openai_base_url` (15 chars)
       - `model_catalog_json` (18 chars)
       - `model_provider` (14 chars, len=14 or len=6 with `=`)
       - `model_reasoning_effort` (22 chars)
       - `disabled_response_storage` (25 chars)
     - Strip `[model_providers.*]` and `[profiles.*]` sections (including all lines under them)
  7. If output differs from original: `atomic_write(config_toml_path, new_content)`
  8. Log result
- **Source file**: `src/core/relay/codex_diagnostic.rs` (confirmed from LABEL log calls)
- **Error handling**: `CoreError` propagated from sub-fixers; non-fatal errors logged, fatal return

## Inferred

- Called only as part of enabling the relay router (not exposed directly as Tauri command)
- Acts as a combined pre-flight sanitizer before relay goes live

## Unknown

- Whether all sub-fixers must succeed before config line-strip proceeds, or they run independently
