# Accounts ChatGPT Session Helper Leaf Pseudocode - AiMaMi 1.0.9

Scope: accounts-only static helper-leaf proof for
`import_chatgpt_session_account`.

Raw bundle:
`<source-location>/intermediate/aimami/1.0.9/macos/accounts/import-chatgpt-session-helper-leaf-pseudocode/manifest.json`.

Canonical `INDEX.jsonl` row: `513`.

This reducer consumes the current backend owner/body proof and closes the
largest remaining static conversion helper gap for
`auth::convert_chatgpt_session_to_axonhub_auth`. It does not execute runtime
IPC, does not create credentials, does not write product code, does not run
product tests, and does not promote any consumer gate.

## Evidence Summary

Ghidra decompiled `3/3` requested rows with `0` misses:

| Address | Matched function | Evidence |
|---|---|---|
| `0x100625bc4` | `codexmate_lib::core::auth::convert_chatgpt_session_to_axonhub_auth` | raw pseudocode row 1 in the manifest referenced above |
| `0x10062a540` | `codexmate_lib::core::auth::convert_chatgpt_session_to_axonhub_auth::{{closure}}` | raw pseudocode row 2 in the manifest referenced above |
| `0x10062a5a0` | `codexmate_lib::core::auth::convert_chatgpt_session_to_axonhub_auth::{{closure}}` | raw pseudocode row 3 in the manifest referenced above |

Call-tree:
`call-trees/codexmate_lib::core::auth::convert_chatgpt_session_to_axonhub_auth.jsonl`.

The call-tree is accepted for the conversion helper root. A later subhelper
package reduces the previously listed static subhelper gaps for
`find_session_like_object::visit`, `core::hash::BuildHasher::hash_one`, and
chrono formatting/parsing helpers. Those are tracked separately in
`logic/ACCOUNTS-CHATGPT-SESSION-SUBHELPER-LEAF-PSEUDOCODE-109.md` and
canonical `INDEX.jsonl` row `515`.

## Conversion Behavior

The helper parses `sessionJson` through `serde_json::de::from_trait`.
On JSON parse failure it formats:

```text
ChatGPT session JSON parse failed
```

The helper searches session-like fields and aliases including:

- `accessToken`
- `sensitive-field`
- `refreshToken`
- `idToken`
- `accountId`
- `access_token`
- `refresh_token`
- `account_id`
- `tokens`
- `last_refresh`
- `expires`
- `expiresAt`
- `expired`
- `expires_at`
- `plan_type`
- `providerSpecificData`
- `chatgptPlanType`
- `chatgptUserId`
- `label`

Static error branches recovered:

- `ChatGPT session JSON missing accessToken`
- `Failed to build Codex-compatible id_token`
- `ChatGPT session JSON missing account id`

Static output / synthesized fields recovered:

- `chatgpt-session.json`
- `chatgpt_account_id`
- `user_id`
- `Unknown Account`
- `auth_mode`
- `OPENAI_API_KEY`
- `tokens`
- `last_refresh`
- `providerSpecificData`
- `chatgptPlanType`
- `__missing_refresh_token__`
- `refresh_token is a placeholder; access_token works only until it expires.`

## Gate Impact

This reduces the `import_chatgpt_session_account` static helper-leaf gap:
the conversion parser and its high-risk error strings are now same-version
macOS pseudocode-backed.

Follow-up static subhelper proof now also covers JSON traversal, hash lookup,
and timestamp helper leaves. That correction does not change the gate result.

It does not close:

- runtime Tauri IPC invocation;
- exact request/response/error envelope;
- `sessionJson` null/omitted/default runtime DTO behavior;
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

This helper proof is consumed by the Gate 1 static closure reducer, but it is
not enough by itself to promote strict/highest.
