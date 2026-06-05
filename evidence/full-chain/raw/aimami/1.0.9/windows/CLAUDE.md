# CLAUDE.md

Raw tier evidence documentation. See parent AGENTS.md for 8-condition ruleset. Raw organized by platform/process, no date/machine suffix. Conclusions in internal.



## PREWRITE_PRODUCER_COLLISION_GATE_V1

本层继承上层 `PREWRITE_PRODUCER_COLLISION_GATE_V1`。写入前必须重读本层 `AGENTS.md` + `CLAUDE.md` 与上层完整规则；缺任一项即禁止写。`README.md`/`AI.md` 不是协作双入口，不能替代 `AGENTS.md`/`CLAUDE.md`。除 IDA MCP 与规定前端解包器外，任何其他逆向或二进制检查路线都禁止使用，不得作为输入、fallback、路线或验收依据。
