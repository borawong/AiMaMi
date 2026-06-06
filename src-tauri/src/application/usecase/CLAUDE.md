# Rust usecase Claude 执行规则

## usecase 边界

- 本文件是 Claude 在 Rust usecase 目录工作的独立执行规则，不引用 AGENTS.md 作为替代。
- 本目录 owning 用户动作级事务：校验输入、组织 repository/platform/core、提交结果并返回 DTO。
- usecase 不直接承载 Tauri 参数反序列化，不读取 UI 文案，不直接调用窗口、托盘、shell、外部进程或真实系统副作用。
- 跨文件动作必须在本层表达事务边界，并通过 repository/platform/core 的窄接口完成。
- 未纳入当前还原范围的后端业务只能返回 typed pending/no-op/unsupported envelope，不得写成伪真实业务。
- 改 command 或 DTO 时必须同步 Rust DTO/command、TypeScript 类型、API wrapper、E2E mock 和 validator。
- 所有新增注释和文档必须使用中文；禁止写入共享盘地址、本机用户名、机器名、内部历史标识和外部参考仓库名称。
