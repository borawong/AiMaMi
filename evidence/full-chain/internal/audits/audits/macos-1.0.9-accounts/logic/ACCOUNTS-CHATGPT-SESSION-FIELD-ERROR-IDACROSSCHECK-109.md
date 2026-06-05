# Accounts ChatGPT Session Field/Error IDA Crosscheck - AiMaMi 1.0.9

Scope: accounts-only static IDA crosscheck for
`import_chatgpt_session_account` and
`codexmate_lib::core::auth::convert_chatgpt_session_to_axonhub_auth`.

This reducer consumes the current IDA Pro MCP HTTP database only as a static
crosscheck:

`<source-location>/source-binary/AiMaMi 1.0.9_ida.app/Contents/MacOS/AiMaMi.i64`.

It writes no raw evidence, appends no `INDEX.jsonl` row, moves no bundle, edits
no regulation, edits no product code, runs no product test, and promotes no
gate.

## IDA Static Facts Confirmed

IDA health for this pass reported the current AiMaMi 1.0.9 IDB with
`auto_analysis_ready=true`, `hexrays_ready=true`, and `strings_cache_ready=true`.

The conversion helper root is:

- `0x100625bc4`
- `codexmate_lib::core::auth::convert_chatgpt_session_to_axonhub_auth`

Accepted IDA string/xref facts:

| Fact | String address | Accepted xrefs |
|---|---:|---|
| parse failure prefix contains `ChatGPT session JSON parse failed` | `0x100eaf57a` | `0x100625c34` in `0x100625bc4` |
| missing access-sensitive-field error cluster contains `ChatGPT session JSON missing accessToken` | `0x100f4092a` | `0x100627664`, `0x100628404` in `0x100625bc4` |
| id-sensitive-field synthesis error cluster contains `Failed to build Codex-compatible id_token` | `0x100f4092a` | `0x100627664`, `0x100628404` in `0x100625bc4` |
| missing account-id error cluster contains `ChatGPT session JSON missing account id` | `0x100f4092a` | `0x100627664`, `0x100628404` in `0x100625bc4` |
| output filename cluster contains `chatgpt-session.json` | `0x100f4092a` | `0x100627664`, `0x100628404` in `0x100625bc4` |
| camel-case sensitive-field/account field cluster contains `idToken` and `accountId` | `0x100f40731` | `0x1006276cc`, `0x1006278a8` in `0x100625bc4` |

The `0x100f4092a` cluster also contains the static field/metadata strings
`expires`, `expiresAt`, `expired`, `expires_at`, `providerSpecificData`,
`chatgptPlanType`, `chatgptUserId`, `label`, `__missing_refresh_token__`, and
the placeholder refresh-sensitive-field warning text. This reducer accepts them only as
same-cluster strings with conversion-helper xrefs, not as independent runtime
branch proof.

## Not Accepted As IDA-Direct Conversion Proof

The following strings remain useful in the existing Ghidra pseudocode reducers,
but this IDA pass does not accept them as direct conversion-helper proof:

- `Unknown Account`: no matching IDA string hit in this query.
- `OPENAI_API_KEY`: hits auth-file deserializer and diagnostics clusters, not
  direct conversion-helper xrefs.
- `access_token`: exact hits are no-xref or auth-file deserializer clusters.
- `refresh_token`: exact hits are no-xref, auth-file deserializer, diagnostics,
  or the broad `0x100f4092a` cluster; this pass does not isolate a direct
  conversion branch beyond the placeholder-warning cluster.
- `tokens`: first hits are relay/health/proxy sensitive-field-count clusters, not accounts
  conversion-helper proof.
- `last_refresh`: hits auth-file serializer/deserializer clusters, not accepted
  as direct conversion-helper proof in this pass.

## Gate Effect

This crosscheck narrows the field/error static evidence for the 1.0.9
`import_chatgpt_session_account` leaf. It does not execute Tauri IPC, does not
observe WebView runtime behavior, does not prove exact request/response
envelopes, does not prove bytes-on-disk, and does not close rollback/no-write
fixtures.

Current controlling state remains:

- `consumerStartReady=9/9` Gate 1 static only.
- `consumerStartBlocked=0/9` Gate 1 static only.
- `strictImplementationUse=0/9`.
- `readyToImplement=0/9`.
- `implementation_use=false`.
- `gate_accepted=false`.
- `full_leaf_100=false`.
- `moduleExitAllowed=false`.

The selected next strict lane remains
`accounts.preview_account_import.missing_path.v1`.
