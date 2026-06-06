# 前端 features Claude 执行规则

## 渐进式覆盖

- 本文件是 Claude 在当前目录工作的独立执行合同；执行时以本文件文字为直接约束，不把 AGENTS.md 当作替代规则。
- 更深层 CLAUDE.md 可以收紧本目录规则，不能放宽证据门、匿名化、中文文档、前端 owner 边界和后端六边形边界。
- 本目录写入前必须确认两类硬门禁已经满足：前端 owner 只在入口、全局 Provider、路由表、route meta、runtime initializer、页面 shell、复杂模块、服务门面、TanStack cache、E2E mock 和 locale 指定层处理；后端 owner 只在 commands、application/usecase/service、core、platform、repository/adapter 和 contracts 指定层处理。
- 发生冲突时按“用户原始要求不可改写、raw/internal 证据优先于推测、同一主题最深层目录规则优先、更严格规则优先”的顺序处理。
- 本目录和下级目录禁止写入共享盘地址、本机用户名、机器名、内部历史标识和外部参考仓库名称。


## feature owner 边界

- 复杂模块必须拆出 Provider / StoreUpdater / Content、hooks、cache、dialogs、panels、components、types 和贴近模块的 tests。
- Provider 建立模块上下文，StoreUpdater 只同步外部 props/event/query cache 到模块状态，Content 只渲染和发出用户意图。
- 深模块必须只有一个 owner，不得另起第二套 UI primitive 或跨模块隐式共享业务状态。
- full refresh、active-only refresh、runtime event reload、mutation payload、single-flight、stale/delayed response、abort 和 replay 防护由模块 query hook/cache helper owning。
