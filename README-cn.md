<h1 align="center">AiMaMi</h1>

<p align="center">
  <a href="./README.md">English</a> · 简体中文
</p>

---

## 为什么公开

AiMaMi 经历过很多个人迭代。项目的一部分资料过去没有放在公开源码树里，
这会让使用者和贡献者更难判断它如何处理本地 Codex 数据。

现在把这些资料放到公开仓库里，是为了让项目可以被审阅、还原和继续改进。

核心原因很简单：

- 方便个人继续迭代，也方便日常本地工作流使用；
- 继续沿用 **Apache License 2.0**；
- 让代码和还原资料可以被直接检查，用起来更放心；
- 减少隐私顾虑，避免依赖不透明的本地包或机器状态。

如果你能还原出更完整的代码，欢迎直接提交 PR。

---

## 仓库内容

- `src/` 和 `src-tauri/`：公开的 Tauri 2 + React + Rust 源码。
- `docs/reconstruction/`：根据公开文件还原项目的映射和说明。
- `evidence/full-chain/internal/`：经过整理的链条摘要、审阅映射、前端映射、
  叶级归纳和数据汇总。
- `evidence/full-chain/raw/`：raw 链条文本、命令索引、manifest 和验证摘要。
- `evidence/binary-manifests/`：发布在本仓库之外的大文件参考资产大小和哈希清单。
- 外部 IDB 归档：
  [MapleEve/OpenAiMami-IDB](https://github.com/MapleEve/OpenAiMami-IDB) 的
  `1.0.9/AiMaMi-1.0.9-i64-databases.zip`，包含 macOS 和 Windows 的 `.i64`
  文件。
- `LICENSE`：Apache License 2.0。

理解公开还原流程不需要依赖本机专属路径或未发布状态。

---

## 给 AI 的还原 Prompt

可以把下面这段直接交给 AI 编程 Agent：

```text
请只使用这个公开仓库，把 AiMaMi 还原为完整的 Tauri 2 + React + Rust
桌面应用。

优先读取这些仓库相对路径：README.md、README-cn.md、
docs/reconstruction/、evidence/full-chain/internal/、evidence/full-chain/raw/、
evidence/binary-manifests/、src/、src-tauri/、package.json、src-tauri/Cargo.toml。

保留 Apache License 2.0。根据公开源码树和 full-chain 还原证据，补齐完整
应用行为、UI、Tauri command surface、Rust 后端、打包元数据和验证流程。先读
docs/reconstruction/full-chain-map.md、evidence/full-chain/internal/INDEX.md、
evidence/full-chain/raw/INDEX.md、evidence/full-chain/raw/command-index.json、
evidence/full-chain/raw/validation-summary.json。

如果需要参考数据库，从 https://github.com/MapleEve/OpenAiMami-IDB 获取外部归档
1.0.9/AiMaMi-1.0.9-i64-databases.zip，并使用里面的 macOS 和 Windows .i64 文件。以
evidence/binary-manifests/1.0.9/i64-databases.json 作为资产状态、大小和
哈希的依据。

不要依赖本机专属路径、机器状态、未发布文件、凭据或用户数据。如果完成了
更完整的还原，请以 Pull Request 形式提交。
```

---

## 构建

**环境要求：** Node.js · pnpm · Rust · [Tauri 系统依赖](https://v2.tauri.app/start/prerequisites/)

```bash
git clone https://github.com/borawong/AiMaMi.git
cd AiMaMi
pnpm install
pnpm tauri dev
```

```bash
pnpm build
cargo check --manifest-path src-tauri/Cargo.toml
pnpm tauri build
```

---

## 参与贡献

欢迎提交 Issue 和 Pull Request。完整还原、模块整理、隐私审阅、文档改进，
都可以通过 PR 提交。

---

## 许可证

[Apache License 2.0](LICENSE)

---

## 免责声明

AiMaMi 是面向本地 Codex 工作流的独立工具，不隶属于 OpenAI，也不代表
OpenAI 背书或赞助。
