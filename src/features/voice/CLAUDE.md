# voice feature Claude 执行规则

## 当前边界

- 本目录只保留 voice 前端空骨架、路由入口、合同边界和中文说明。
- 不得新增语音捕获、注入、ASR、LLM、快捷键、运行时状态、模板、词汇、历史或权限请求的真实前端实现。
- `Content.tsx` 只能挂载 `DumpedContractBoundary` 和空骨架说明。
- `hooks/`、`cache/`、`panels/`、`dialogs/`、`components/` 只能保留空 owner，不得发起 IPC、query、mutation 或可操作业务 UI。
- 后续如果要恢复 voice，必须先由明确证据和新的目标授权打开，不能在普通重构中顺手补齐。
