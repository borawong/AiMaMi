# overview 模块测试边界

- 测试用户可见文案时读取 locale JSON 或 locale helper。
- 状态架构验收必须覆盖 stale、delayed、failure、concurrency、cancel 和 event replay。
- 无证据业务不得通过 mock 编造成真实实现。
