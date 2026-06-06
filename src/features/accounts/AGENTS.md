# accounts feature Agent 执行规则

## 渐进式覆盖

- 本目录是 accounts 复杂前端模块的唯一 feature owner。
- 下级目录规则只能收紧本文件，不能放宽入口、路由、Provider、StoreUpdater、Content、hooks、cache、dialogs、panels、components、types、tests 和 locale 的边界。
- 禁止写入共享盘地址、本机用户名、机器名、内部历史标识和外部参考仓库名称。
- 所有新增注释、文档和用户可见文案必须使用中文；用户可见文案必须进入 locale。

## owner 边界

- `Content.tsx` 只装配合同边界和 accounts 页面内容，不拥有数据请求、弹窗状态机或 IPC 编排。
- `Provider.tsx` 只建立模块上下文，`StoreUpdater.tsx` 只同步外部 cache/event/query 到模块状态。
- `hooks/` owning TanStack query、mutation、single-flight、mutation payload 写 cache、stale/delayed/replay 防护。
- `cache/` owning accounts query key、authoritative cache 和 mutation fence。
- `dialogs/`、`panels/`、`components/` 只渲染模块状态并发出用户意图，不直接拼 IPC transport。
- `types/` owning accounts 前端模块类型；改 IPC DTO 时必须同步 Rust DTO、TypeScript 类型、service wrapper、E2E mock 和 validator。
