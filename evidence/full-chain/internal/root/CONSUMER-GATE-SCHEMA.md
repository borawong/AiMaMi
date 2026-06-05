# Consumer Gate Schema

本文件定义 reverse task-plan 和 leaf result 的消费 gate 字段。它是 `GATE-SPEC.md` 的机器可读结构约定。

## task-plan schema

```json
{
  "schema": "restoration.cm.reverse.task_plan.consumer_gate.v1",
  "readyToImplement": [],
  "strictImplementationUse": [],
  "consumerStartReady": [],
  "reverseRequiredQueues": {
    "forbiddenUntilReady": [],
    "forbiddenUntilStrictImplementationUse": [],
    "consumerStartBlocked": []
  },
  "platformPolicy": {
    "windowsIndependent": true,
    "doNotInferWindowsFromMacOS": true
  }
}
```

### 字段语义

| 字段 | 含义 |
|---|---|
| `readyToImplement[]` | 最高放行 leaf；必须同时满足 `strictImplementationUse=true` 与 `full_leaf_100_definition_v2` 六维门（dim1-dim6 canonical 定义见 `GATE-SPEC.md §DIM1-6 正式定义`）或 strict accepted substitute。 |
| `strictImplementationUse[]` | 可严格按 upstream 行为实现的 leaf；不一定达到最高 ready。 |
| `consumerStartReady[]` | 消费侧可开始实现但不得宣称 upstream 100% 等价的 leaf。 |
| `reverseRequiredQueues.forbiddenUntilReady[]` | 未达到最高 ready 前不得进入 ready 队列。 |
| `reverseRequiredQueues.forbiddenUntilStrictImplementationUse[]` | 未达到 strict 行为合同前不得按 upstream strict parity 实现。 |
| `reverseRequiredQueues.consumerStartBlocked[]` | 仍缺 start 必需证据，不得开始实现。 |
| `platformPolicy` | 平台独立闭合约束；Windows 不得由 macOS 外推。 |

## leaf result schema

```json
{
  "leaf": "",
  "platform": "",
  "renderSurfaceReady": false,
  "uiCallEntryReady": false,
  "dtoBoundaryReady": false,
  "happyPathReady": false,
  "boundaryPathReady": false,
  "sideEffectReady": false,
  "frontendConsumptionReady": false,
  "acceptanceDraftReady": false,
  "platformScopeDeclared": false,

  "consumerStartReady": false,
  "consumerUse": false,
  "startMode": "blocked | reverse_guided | product_decision",
  "strictParityReady": false,
  "strictImplementationUse": false,
  "readyToImplement": false,

  "full_leaf_100": false,
  "gate_accepted": false,
  "implementation_use": false,

  "unknownsBlockingStart": [],
  "unknownsAcceptedForStart": [],
  "productDecisionsRequired": [],
  "sourceSurfaceDelta": [],
  "allowedImplementationMode": "",
  "forbiddenAssumptions": []
}
```

### leaf 字段规则

- `consumerStartReady=true` 时，必须同时给出 `allowedImplementationMode` 和 `forbiddenAssumptions`。
- `startMode="product_decision"` 时，必须填写 `productDecisionsRequired` 与 `sourceSurfaceDelta`，并保持 `strictImplementationUse=false`，除非后续证据另行闭合 strict gate。
- `strictImplementationUse=true` 时，`consumerStartReady` 也必须为 true。
- `readyToImplement=true` 时，`strictImplementationUse`、`gate_accepted`、`implementation_use` 必须同时为 true。
- `implementation_use=true` 只能出现在 `readyToImplement=true` 的 leaf 上；旧包中已有正向字段必须由生产者按新 schema 复核后迁移，不自动继承。
- `strictParityReady` 只是证据字段，不进入 task-plan 队列。

## Unknown 分类字段

| 字段 | 对应分类 | 要求 |
|---|---|---|
| `unknownsBlockingStart[]` | `blocks_start` | 每项写 block 类型、缺失证据、解除条件。 |
| `unknownsAcceptedForStart[]` | `accepted_unknown` | 每项说明为何不影响开始实现。 |
| `productDecisionsRequired[]` | `product_decision` | 每项说明产品决策、影响范围和不得伪装为 upstream proof。 |

## 迁移要求

- 旧 `task-plan.json` 不能只因为存在 `readyToImplement` 字段就迁移为新 schema。
- 旧 `implementation_use=false` / `gate_accepted=false` / `full_leaf_100=false` 保持 false。
- 旧 functional-parity、frontend-only、diagnostic、candidate-only 包只能作为输入证据；生产者必须补齐对应 gate 字段后才能写入三档队列。
- 生产者迁移业务 bundle 时必须在 bundle `AI.md` 或 `task-plan.json` 标明使用本 schema 的版本：`restoration.cm.reverse.task_plan.consumer_gate.v1`。

## NO_VERSION_SPAN_PATH_COMPONENTS_V1

raw/intermediate/source archive 新产物路径的任何目录组件都禁止包含双版本跨度，例如 `1.0.8-to-1.0.9`、`108-to-109`、`1.0.8_1.0.9` 或 `from-1.0.8-to-1.0.9`。diff / migration / reducer 产物必须归入唯一 target version 目录，例如 `.../aimami/1.0.9/...`；语义用稳定 bundle/file 名表达。发现违规路径时，必须先清理或改名到 target version 目录后再继续。
