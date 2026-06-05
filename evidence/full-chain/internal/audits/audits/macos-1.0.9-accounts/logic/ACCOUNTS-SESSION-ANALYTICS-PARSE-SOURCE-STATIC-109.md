# Accounts Session Analytics Parse Source Static Reducer - AiMaMi 1.0.9

Scope: accounts-only same-version macOS AiMaMi 1.0.9 static reducer for the
shared session analytics source discovery and JSONL parse leaf used by
`load_session_analytics`, `load_token_analytics`, `load_tool_analytics`, and
`load_change_analytics`.

This reducer consumes IDA Pro MCP HTTP decompilation against the SOT binary
under `<source-location>/source-binary/`. It writes
no raw/intermediate artifact, appends no `INDEX.jsonl` row, edits no product
code or rule/spec file, runs no product test, and does not promote any gate.

## Evidence

- SOT binary root:
  `<source-location>/source-binary/`
- IDA active endpoint:
  `<local-tool-endpoint>`
- SOT executable:
  `<source-location>/source-binary/AiMaMi 1.0.9.app/Contents/MacOS/AiMaMi`
- SOT executable SHA-256:
  `1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482`
- IDA database:
  `<source-location>/source-binary/AiMaMi 1.0.9_ida.app/Contents/MacOS/AiMaMi.i64`
- Parser owner:
  `codexmate_lib::core::session_analytics::parse_all_sessions::h6a095e92c7badce0`
  at `0x100547988`
- Recursive directory visitor:
  `codexmate_lib::core::session_analytics::visit_dir::h40153832f0bff4e0`
  at `0x10054a6b4`
- Time/date helpers:
  `SystemTime::now` at `0x100d3a030`,
  `SystemTime::duration_since` at `0x100d39fe0`,
  `timestamp_to_date` at `0x100547710`
- JSON helpers:
  `serde_json::de::from_trait` at `0x1003104bc`,
  `serde_json::Value::pointer` at `0x100cf051c`,
  `Index::index_into` at `0x100cfa118`

## Source Discovery Boundary

`parse_all_sessions` at `0x100547988` statically checks two `CodexPaths`
directory members:

- `a2[16]` / `a2[17]`;
- `a2[19]` / `a2[20]`.

For each existing directory, it calls `visit_dir` at `0x10054a6b4`.
Non-existing or metadata-failing roots are skipped at this static layer rather
than converted into a returned `CoreError`.

`visit_dir` statically proves:

- it calls `std::sys::fs::read_dir` at `0x100d32404`;
- a read-dir error drops the `Result<ReadDir, Error>` and returns without
  adding rows;
- it flattens directory entries and recursively descends into subdirectories
  when `Path::is_dir` at `0x100d38e48` is true;
- for files, it resolves `DirEntry::path`, `Path::file_name`, and UTF-8 file
  name text;
- accepted filenames must start with `rollout-` and end with `.jsonl`;
- it calls `DirEntry::metadata` and `Metadata::modified`; when modified time
  cannot be converted to duration, the collected timestamp falls back to `0`;
- accepted rows store path pointer/length plus modified timestamp in the
  caller vector.

## Parse Boundary

For each collected file row whose modified timestamp is inside the requested
window, `parse_all_sessions`:

- opens the file with `std::fs::OpenOptions::_open` at `0x100d2c0f8`;
- reads the file line-by-line through `std::io::read_until` at `0x10038f4b0`;
- converts each line through `core::str::from_utf8` at `0x100d6f7d4`;
- trims CR/LF line endings before JSON parsing;
- parses JSON values with `serde_json::de::from_trait` at `0x1003104bc`;
- ignores non-JSON/failed parse rows at this static layer;
- recognizes top-level `type` values including `response_item`, `turn_context`,
  and `event_msg`;
- for `response_item`, follows `payload.type == "function_call"` and reads a
  fallback 
ame` value, defaulting to `unknown` if absent/non-string;
- increments an execute-command counter when function name matches the static
  `exec_command` string;
- for command payloads, follows `arguments/payload/type`, then extracts a
  lowercased command string from `command`-like fields for read/write command
  classification;
- for `event_msg`, follows `/payload/type` and sensitive-field-count payload paths such
  as `/payload/info/...total_token_usage...`;
- reads `input_tokens`, `output_tokens`, `reasoning_output_tokens`, and
  `total_tokens` numeric fields, defaulting non-numeric/missing fields to `0`.

## Reducer Conclusion

`accountsSessionAnalyticsParseSourceStatic` /
`sessionAnalyticsParseSourceStatic` is accepted as a same-version static source
discovery and parse-leaf reducer only. It proves source roots, recursive
`rollout-*.jsonl` discovery, timestamp-window filtering, line-oriented JSONL
read, major session event/function/sensitive-field parse paths, and non-fatal static
handling for many absent or malformed rows.

## Still Missing Before Strict

- exact runtime `load_session_analytics`, `load_token_analytics`,
  `load_tool_analytics`, and `load_change_analytics` IPC envelopes;
- exact source directory paths and byte fixtures under real AiMaMi runtime
  state;
- before-after/no-write proof for analytics commands;
- exact JSONL line bytes for corrupt UTF-8, malformed JSON, missing fields,
  permission-denied, open failure, and metadata failure cases;
- exact read/write command classifier table contents and edge behavior;
- frontend chart/query/loading/error consumption state;
- executed source archive acceptance mapping;
- independent Windows 1.0.9 closure.

## Gate Effect

- `consumerStartReady`: unchanged.
- `consumerStartBlocked`: unchanged.
- `strictImplementationUse`: false / `0`.
- `readyToImplement`: false / `0`.
- `implementation_use`: false.
- `gate_accepted`: false.
- `full_leaf_100`: false.
- `moduleExitAllowed`: false.

Accounts remains the active locked module. This reducer does not permit
switching to plugins, relay, system, or tray.
