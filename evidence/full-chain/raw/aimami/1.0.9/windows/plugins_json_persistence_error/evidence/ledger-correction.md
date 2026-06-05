# Ledger Correction

leaf: plugins_json_persistence_error
supersedes_index_row: 588
supersedes_key: aimami/1.0.9/windows/plugins_json_persistence_error/ida-plugins-json-persistence-error-static-no-gate-promotion
replacement_key: aimami/1.0.9/windows/plugins_json_persistence_error/ida-plugins-json-persistence-error-ledger-correction-no-gate-promotion
replacement_status: plugins_json_persistence_error_ledger_correction_no_gate_promotion

This is a metadata-only superseding correction candidate. The previous row has already been appended to INDEX.jsonl, so this repair removes stale pending validator/indexer wording from the active candidate metadata.

No raw evidence conclusion, analysis finding, gate dimension, or implementation readiness claim is changed. All gate booleans remain false, append_to_index remains true for the superseding candidate, and this repair did not append INDEX.jsonl.
