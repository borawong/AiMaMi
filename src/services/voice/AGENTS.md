# voice service Agent 执行规则

## 当前边界

- 本目录只保留 voice service 占位导出，用于说明该模块当前未启用。
- 不得新增 `invokeIpc` wrapper，不得把 voice 命令重新暴露到 `src/lib/api.ts`。
- 不得在本目录实现语音捕获、注入、ASR、LLM、快捷键、权限或运行时业务流程。
- 如需恢复 voice service，必须先有新的目标授权，并同步 Rust command、DTO、API wrapper、E2E mock 和模块 owner。
