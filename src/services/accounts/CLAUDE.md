# accounts service Claude 执行规则

## accounts service 边界

- 本文件是 Claude 在 accounts service 目录工作的独立执行规则，不引用 AGENTS.md 作为替代。
- 本目录是 accounts 前端访问后端能力的模块 service wrapper。
- 只能通过 `src/contracts/ipc` 的 `invokeIpc` 调用后端命令，并返回 `CoreEnvelope<具体 DTO>`。
- 禁止导入或返回 `IpcEvidencePayload`。
- 禁止保存后端事实、页面状态、弹窗状态或 TanStack cache。
- 改 command 或 DTO 时必须同步 Rust DTO/command、TypeScript 类型、API wrapper、E2E mock 和 validator。
- 所有新增注释和文档必须使用中文；禁止写入共享盘地址、本机用户名、机器名、内部历史标识和外部参考仓库名称。
