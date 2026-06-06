# Rust commands Agent 执行规则

## 渐进式覆盖

- 本文件是当前目录的直接执行合同；更深层同名规则可以收紧本目录规则，不能放宽证据门、匿名化、中文文档、前端 owner 边界和后端六边形边界。
- 本目录写入前必须确认两类硬门禁已经满足：前端 owner 只在入口、全局 Provider、路由表、route meta、runtime initializer、页面 shell、复杂模块、服务门面、TanStack cache、E2E mock 和 locale 指定层处理；后端 owner 只在 commands、application/usecase/service、core、platform、repository/adapter 和 contracts 指定层处理。
- 发生冲突时按“用户原始要求不可改写、raw/internal 证据优先于推测、同一主题最深层目录规则优先、更严格规则优先”的顺序处理。
- 本目录和下级目录禁止写入共享盘地址、本机用户名、机器名、内部历史标识和外部参考仓库名称。


## commands 边界

- 本目录只做 Tauri IPC adapter：参数反序列化、获取/克隆 app state、调度 blocking task、调用 application/core、返回 CoreEnvelope<T>。
- 命令层不写业务规则、文件 IO 事务、HTTP、平台 API 或 UI 文案。
- 命令覆盖必须与前端 IPC 契约和 invoke handler 一致；缺口只能通过骨架 command 暴露，不得伪造业务实现。
