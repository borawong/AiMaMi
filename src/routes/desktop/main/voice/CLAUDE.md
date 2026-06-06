# voice route Claude 执行规则

## 当前边界

- 本目录只保留 voice 路由 shell。
- `page.tsx` 只能挂载 `src/features/voice` 的空骨架入口，不得拥有业务状态、查询、弹窗、IPC 编排或运行时副作用。
- 不得新增 voice 页面级表单、按钮动作、权限请求或语音运行时流程。
