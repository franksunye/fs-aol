# FS-AOL 文档

> 本目录是 **fs-aol** 仓库的「共识层」。所有战略与设计先落成文字，再随市场反馈迭代。
> 文档是活的，欢迎 PR 修订。

## 一屏看懂

**一句话**：用最接地气的传统业务（防水维修工单跟进），撕开口子，构建服务行业的
**Field Service Cognitive Operating System（FS-COS）**——FSM 之上的 **System of Cognition**；
Agent 是执行器，认知与决策才是核心资产。工程仓库名仍为 **fs-aol**。

| 维度 | 内容 |
|------|------|
| **目标** | 理解业务与客户，决定「下一步做什么」，再由 Agent 在审批后执行 |
| **切入** | 现场服务工单的「跟进真空期」——Follow-up 作 Phase 1 楔子，验证业务价值 |
| **路径** | Phase 1 Follow-up Skill → Phase 2 Harness+Cognitive → Phase 3 Decision → Phase 4 更多 Skill → Phase 5 Connector/SDK 开源 |
| **分层** | Model / Skill（商品）→ Harness / Cognitive / Trusted Execution（护城河）→ Business Systems |
| **产品化** | 两轨纪律：`poc-*` 验证（headless）/ `vX.Y` 产品轨（必有 UI+UX+可感知 KPI）。见 [PUB-07](public/PUB-07-product-surface.md) |
| **当下** | Stage 0：`poc-followup` 引擎已跑通并对 XLink 真实工单库（生产只读）验证；产品起点 = v1.0 Console MVP |

## 核心隐喻

> 工单完工 = `Event`；AI 生成的二次报价/关怀 = `Suggestion`；销售点「发送」= `Approval`。

整个系统就是把这三件事，做成任何行业（CRM / 招聘 / 医疗随访）都能复用的基础设施。

> **能复用的前提**：Agent 必须在**领域语言**里思考，而不是 XLink 的系统黑话
> （`status=403`）。领域语义层 = Agent 的语义层，是通用化的命门。见
> [04-domain-semantics](public/PUB-04-domain-semantics.md)。

## 文档分层（公开 / 本地私有）

### A. 公开文档（可进 Git）

| 文档 | 说明 |
|------|------|
| [PUB-01-vision.md](public/PUB-01-vision.md) | **为什么**：FS-COS 愿景（System of Cognition）+ 战略修正 + Follow-up 楔子 |
| [PUB-02-architecture.md](public/PUB-02-architecture.md) | **是什么**：FS-COS 架构 v1.2（Model/Skill/Harness/Cognitive/Trusted Execution + 四原语映射） |
| [PUB-03-roadmap.md](public/PUB-03-roadmap.md) | **怎么走**：Phase 1→5（价值验证→认知→决策→执行→Connector 开源） |
| [PUB-04-domain-semantics.md](public/PUB-04-domain-semantics.md) | **用什么语言思考**：领域语义对齐（Agent 的语义层） |
| [PUB-changelog.md](public/PUB-changelog.md) | **版本摘要表**：每版一行，讨论功能放进哪个小版本 |
| [PUB-05-releases.md](public/PUB-05-releases.md) | **发哪些版**：两轨（POC vs 产品轨）+ 产品 OKR/KPI 总表 → Live |
| [PUB-06-llm-providers.md](public/PUB-06-llm-providers.md) | **用什么模型**：混元 Lite 日常 + DeepSeek 抽样验证 |
| [PUB-07-product-surface.md](public/PUB-07-product-surface.md) | **怎么变成产品**：两轨纪律 + 产品脊柱 S1–S6（UI/UX）+ 产品化 DoD |
| [PUB-13-action-spec-v02.md](public/PUB-13-action-spec-v02.md) | **跟进建议 JSON v0.2**（输出结构） |
| [PUB-14-v030-scope.md](public/PUB-14-v030-scope.md) | **v0.3.0 范围 SSOT**（Agentic UI + 试点目标、验收） |
| [PUB-15-agentic-ui-design.md](public/PUB-15-agentic-ui-design.md) | **v0.3 Agentic UI 视觉规范**（色彩、侧栏框架、设计稿映射） |
| [PUB-16-architecture-evolution.md](public/PUB-16-architecture-evolution.md) | **架构演进纪律**：每版架构自检、Operator 读模型、渐进式边界微调 |
| [PUB-17-console-information-architecture.md](public/PUB-17-console-information-architecture.md) | **Console 三层信息架构**：Work / Agents / Systems 导航、Action 生命周期、列表与 KPI 纪律 |
| [PUB-18-aol-industrialization-plan.md](public/PUB-18-aol-industrialization-plan.md) | **AOL 工业化打磨计划**：真实楔子与场景样例混合态的执行路线 |
| [PUB-19-console-data-list.md](public/PUB-19-console-data-list.md) | **Console 企业级列表控件**：DataList 布局、URL scope、分页与列设置纪律 |
| [sops/](../sops/README.md) | **L2 SOP**（v0.4 启用，当前为大纲） |
| [PUB-private-docs-template.md](public/PUB-private-docs-template.md) | 私有文档管理模板与边界 |

### B. 本地私有文档（企业内部，不进 Git）

命名与目录规则（双保险）：

- 目录：`docs/private/`
- 文件前缀：`PRIV-`
- Git 忽略：`.gitignore` 中 `docs/private/**` 与 `docs/PRIV-*.md`

示例（本地存在，不入库）：

- `docs/private/PRIV-xlink-data.md`
- `docs/private/PRIV-09-business-decisions.md`

维护原则：公开文档写“方法与架构”，私有文档写“企业规则、生产口径、内部 SOP、账号与运维细节”。

## 防误提交流程（推荐）

可将私有文档拦截脚本挂到本地 pre-commit：

```bash
ln -sf ../../scripts/check_no_private_docs.sh .git/hooks/pre-commit
```

脚本位置：`scripts/check_no_private_docs.sh`（拦截 `docs/private/**` 与 `docs/PRIV-*.md`）。

## 状态

- 版本：**v0.2.5** 已封版；**v0.3 线**进行中（`v0.3.1`…`v0.3.5` 迭代打 tag），见 [PUB-14](public/PUB-14-v030-scope.md) §2.1 · [PUB-15](public/PUB-15-agentic-ui-design.md)
- 阶段：Phase 1 → **工业级 Agentic UI**（3～5 步）+ 真发运营收官（`v0.3.5`）
- 最近更新：2026-06-10（`PUB-19` DataList 列表控件；`PUB-18` 工业化计划；`PUB-17` Console 三层 IA）
