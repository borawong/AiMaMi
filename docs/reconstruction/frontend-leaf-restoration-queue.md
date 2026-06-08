# 前端 leaf 重建队列

本文说明 `docs/reconstruction/frontend-leaf-restoration-queue.json` 的用途。该 JSON 由 `npm run generate:frontend-leaf-queue` 生成，用来把 MAC/WIN 100% leaf 目标拆成可执行缺口队列。

## 队列原则

- 队列只使用仓库内 raw/internal 证据和当前源码，不读取本机私有状态。
- 队列不是验收通过声明；只要 strict gate 仍失败，`currentConclusion.fullLeaf100` 必须保持 `false`。
- 旧 internal frontend 文档里的缺口必须和当前源码对照；已经补入源码的 route、service、hooks 不能继续当作未开始，但没有 raw 可见 UI trigger 的 leaf 也不能编造。
- `source-only`、`boundary-only`、`contract-service-only`、`owner-closed` 只能表示重建进度，不能计入 100% leaf。
- 文案验收必须有逐条来源证明；仅 `zh/en` key 同步不能算全文案验收。

## 当前队列来源

- `evidence/full-chain/internal/data/data/full-leaf-100-gap-audit.json`
- `evidence/full-chain/internal/audits/audits/**/gate-report.json`
- `evidence/full-chain/internal/audits/audits/**/frontend/*.md`
- `src/restoration/frontend-manifest/index.ts`
- `src/locales/zh.json`
- `src/locales/en.json`
- MAC/WIN raw frontend control-flow JSONL

## 使用方式

```text
npm run generate:frontend-leaf-queue
```

生成后的 JSON 用于选择下一批实际重建工作。修改实现后应先重新生成队列，再运行 `npm run validate:frontend-leaf-copy` 确认失败项是否减少。

```text
npm run validate:frontend-leaf-queue
```

该校验确认已提交的队列和当前证据、源码一致。
