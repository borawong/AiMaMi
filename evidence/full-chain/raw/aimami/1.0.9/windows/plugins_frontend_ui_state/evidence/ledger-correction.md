# Ledger Correction

leaf: plugins_frontend_ui_state
supersedes_index_row: 589
supersedes_key: aimami/1.0.9/windows/plugins_frontend_ui_state/frontend-ui-state-static-no-gate-promotion
replacement_key: aimami/1.0.9/windows/plugins_frontend_ui_state/frontend-ui-state-ledger-correction-no-gate-promotion
replacement_status: plugins_frontend_ui_state_ledger_correction_no_gate_promotion

This is a metadata-only superseding correction candidate. The previous row has already been appended to INDEX.jsonl, so this repair removes stale pending validator/indexer wording from the active candidate metadata.

No raw evidence conclusion, analysis finding, gate dimension, or implementation readiness claim is changed. All gate booleans remain false, append_to_index remains true for the superseding candidate, and this repair did not append INDEX.jsonl.
