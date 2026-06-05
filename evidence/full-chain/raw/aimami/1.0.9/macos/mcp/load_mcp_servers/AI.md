# AI handoff - load_mcp_servers (macos)

Canonical raw leaf for `load_mcp_servers`. Owner `0x10015be84` is IDA-confirmed and IDB comments are saved. Thread model: sync mutex/TOML parse; no async/spawn. DTO: returns McpServerSummary list with name/transport/command/args/url/headers/environment/enabled fields.
