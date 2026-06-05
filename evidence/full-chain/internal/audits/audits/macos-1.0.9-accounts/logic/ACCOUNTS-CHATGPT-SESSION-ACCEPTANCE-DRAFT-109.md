# Accounts ChatGPT Session Acceptance Draft - AiMaMi 1.0.9

Scope: accounts-only acceptance draft for `import_chatgpt_session_account`.

Raw bundle:
`<source-location>/intermediate/aimami/1.0.9/macos/accounts/import-chatgpt-session-account-acceptance-draft/manifest.json`.

Canonical `INDEX.jsonl` row: `514`.

This reducer turns the previous missing acceptance draft into a non-executed
draft matrix. It does not execute runtime IPC, does not create real credentials,
does not mutate account state, and does not promote any consumer gate.

## Fixture Draft Matrix

The raw bundle defines `14` fixture rows:

- `valid_new_dummy_session_overwrite_false`
- `invalid_json`
- `missing_accessToken`
- `missing_account_id`
- `id_token_build_failure`
- `overwrite_false_existing_conflict`
- `overwrite_true_non_active_success`
- `overwrite_active_rejection`
- `invalid_account_key`
- `write_path_failure`
- `sessionJson_omitted`
- `sessionJson_null`
- `overwriteExisting_omitted`
- `overwriteExisting_null`

Each row requires future evidence for exact command/body, exact success or
error envelope, auth snapshot and registry before-after bytes where relevant,
atomic temp residuals, frontend toast/dialog/refresh consumption, and a source archive
acceptance id.

Every row is explicitly non-executed:

```text
PASS_FAIL = FAIL until executed trace is reduced and accepted
reducer_acceptance = false
no_gate_promotion = true
```

## Gate Impact

This draft reduces the `acceptanceDraftReady` gap for
`import_chatgpt_session_account` to `PARTIAL draft only`.

It still does not close:

- runtime Tauri IPC invocation;
- exact DTO null/omitted/default behavior;
- exact success/error envelopes;
- auth snapshot / registry before-after bytes;
- rollback and no-write fixtures;
- frontend runtime consumption;
- executed source archive acceptance;
- Windows independent closure.

Gate state after the later static closure reducer:

- `consumerStartReady=true` for Gate 1 static context only
- `consumerStartBlocked=false` for Gate 1 static context only
- `strictImplementationUse=false`
- `readyToImplement=false`
- `implementation_use=false`
- `gate_accepted=false`
- `full_leaf_100=false`
- `moduleExitAllowed=false`
