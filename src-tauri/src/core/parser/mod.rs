use crate::contracts::McpTransport;

pub(crate) fn parse_mcp_transport(value: &str) -> McpTransport {
    match value {
        "stdio" => McpTransport::Stdio,
        "http" => McpTransport::Http,
        "sse" => McpTransport::Sse,
        _ => McpTransport::Unknown,
    }
}
