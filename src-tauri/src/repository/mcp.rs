// 这个文件只保留 MCP 仓储边界，服务列表解析必须回到有证据的 usecase 或 core 合同后再补。

pub(crate) struct McpRepository;

pub(crate) trait McpRepositoryBoundary {}

impl McpRepositoryBoundary for McpRepository {}
