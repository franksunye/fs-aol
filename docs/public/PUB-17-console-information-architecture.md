# 17 · Console 信息架构与设计指导（三层导航）

> **状态**：生效中 · **性质**：Agent Console 产品信息架构与 UI 设计决策 SSOT  
> **依赖**：[PUB-07](PUB-07-product-surface.md)（产品脊柱）· [PUB-15](PUB-15-agentic-ui-design.md)（视觉）· [PUB-16](PUB-16-architecture-evolution.md)（技术读模型与演进纪律）  
> **最后修订**：2026-06-10

---

## 1. 本文解决什么问题

Console 功能持续增多（总览、Action 中心、日历、Runs、评估、Agents、集成、治理……），若侧栏长期**平铺菜单**，会出现：

- 运营动线（今天要处理什么）与配置动线（Agent 怎么配、系统怎么接）混在一起；
- 列表字段随楔子业务膨胀（工单阶段、金额、部位），阻碍多业务对象扩展；
- KPI 与详情语义不清（Case vs Action）。

本文定义 **Console 三层信息架构**——产品导航与模块归属的**设计指导**，供 PR、线框、代码目录与侧栏分组时对齐。

> **铁律**：文件名与路由语义即定义；新增页面须先归入三层之一，再落代码。

---

## 2. 与 FS-COS 技术分层的关系（正交，勿混）

| 维度 | 文档 | 回答的问题 |
|------|------|------------|
| **FS-COS 五层** | [PUB-02](PUB-02-architecture.md) | 系统在全栈中的位置：Model / Skill / Harness / Cognitive / Trusted Execution |
| **Console 技术三层** | [PUB-16](PUB-16-architecture-evolution.md) §3 | 代码怎么长：L0 Operator Shell · L1 Tracking · L2 Skill+Connector |
| **Console 产品三层** | **本文** | 用户怎么找功能：Work · Agents · Systems |

三者**正交**：例如 Runs 页在**产品层**属 Agents（可观测），在**技术层**读 L1 Tracking；Action 中心在**产品层**属 Work，在**技术层**走 L0 Shell + Adapter。

---

## 3. 三层导航模型

```text
┌─────────────────────────────────────────────────────────────────┐
│ Layer 1 · Work（工作层）                                           │
│ 人每天要处理的事：审核、执行、闭环、排期                             │
│ 总览* · Action 中心 · 日历 · Action/Case 详情                      │
└─────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────┐
│ Layer 2 · Agents（Agent 层）                                     │
│ 谁在生产、怎么配、跑得好不好、为何这么产出                           │
│ Agents · 评估 · Runs*                                            │
└─────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────┐
│ Layer 3 · Systems（系统层）                                      │
│ 接什么外部系统、怎么映射、谁有权、留什么痕、知识从哪来                  │
│ 集成 · 治理 · 设置*                                               │
└─────────────────────────────────────────────────────────────────┘

* 见 §5 说明
```

### Layer 1 · Work（工作层）

**回答**：我今天要处理哪些 Action？每条建议/Action 该同意还是执行？关联的业务对象是什么？

| 能力 | 说明 |
|------|------|
| **Inbox / Action 中心** | 统一工作台；Tab 表达生命周期阶段，而非多个侧栏入口 |
| **Action 列表** | 平台语义列：标题、来源 Agent、关联对象、来源系统、执行人、状态、时间 |
| **Action / Case 详情** | 上分栏：Action 内容与执行态；下/侧：Business Context（工单快照等），**Case 是上下文，不是列表主实体** |
| **日历** | Work 的时间维：截止、SLA、排期 |

### Layer 2 · Agents（Agent 层）

**回答**：有哪些 Agent？策略与模型怎么配？效果如何？这次 Run 为何产出这条 Action？

| 能力 | 说明 |
|------|------|
| **Agent 列表 / 详情** | 运行画像、负责阶段、支持系统 |
| **Agent 配置** | 规则、Prompt、模型策略、权限范围 |
| **效果（评估）** | 采纳率、误报、成本、ROI、质量抽样 |
| **Runs** | Agent 运行可观测：触发 → 上下文 → 产出；从 Work 详情与 Agent 详情均可下钻 |

### Layer 3 · Systems（系统层）

**回答**：接了哪些系统？字段如何映射？谁可以审批/执行？审计与脱敏？知识源在哪？

| 子区 | 能力 |
|------|------|
| **Connectivity（连接）** | 集成、同步状态、Webhook、字段映射 |
| **Control Plane（管控）** | 角色权限、Action 执行模式、审批矩阵、敏感字段脱敏、审计日志 |
| **Knowledge（知识）** | 知识源、文档索引、RAG 配置（宜从 Agent 设置逐步升为 L3 一等公民） |
| **Infrastructure（基础设施）** | 模型 Provider、环境（设置页） |

---

## 4. Work 层对象生命周期（HITL 主线）

Action 中心管理的是**同一条业务链上的两个阶段**，不是两套无关实体：

```text
Agent 产出
    │
    ▼
┌──────────────────┐     HITL 审核      ┌──────────────────┐
│ 建议 / 待审核     │ ───────────────►  │ 正式 Action       │
│ (ActionReview)    │   同意/修改/驳回   │ (ExecutionAction) │
└──────────────────┘                    └────────┬─────────┘
                                                 │ 分发 · 执行
                                                 ▼
                                        ┌──────────────────┐
                                        │ 反馈 / 闭环       │
                                        │ (Outcome)         │
                                        └──────────────────┘
```

| 阶段 | 产品叫法 | Action 中心 Tab | 读模型（代码） |
|------|----------|-----------------|----------------|
| 审核前 | 建议 / 未审核 Action | **待审核** | `WorkItem` + `ActionReviewListDisplay` |
| 审核后待执行 | 正式 Action | **待执行** | `ExecutionAction` |
| 已处置 | 闭环 | **已闭环** / **存档** | `disposition` + `inbox_bucket` |

**列表字段纪律**（L1 通用，不绑工单楔子）：

| 列 | 语义 |
|----|------|
| 级 | 优先级 |
| Action 标题 | 主行动；空则 fallback 原因摘要 |
| 来源 Agent | `{ id, label }`，未来多 Agent 动态 |
| 关联对象 | `{ id, type }`，如工单 ID +「工单」 |
| 来源系统 | `{ id, label }`，如 XLink |
| 执行人 | 当前=管家 |
| 状态 | Tab 内语义：审核态 / 流转态 / 终态 |
| 时间 | 生成时间或截止时间 |

**禁止在 Work 列表主列出现**（沉入详情 / `metadata`）：商机阶段、金额、停滞天数、维修部位等**单一业务对象**字段。

**列表控件实现**（Frame 布局、分页、列设置、URL scope）见 [PUB-18](PUB-18-console-data-list.md)。

---

## 5. 模块与路由映射（现状 SSOT）

| 侧栏 / 模块 | 层 | 路由 | 代码锚点（`apps/console`） |
|-------------|-----|------|---------------------------|
| 总览 | L1 入口 / **跨层驾驶舱** | `/overview` | `app/(workbench)/overview/` · `lib/overview*.ts` |
| Action 中心 | L1 | `/` · `?tab=` | `app/(workbench)/page.tsx` · `components/action-center/` |
| — 待审核 | L1 | `?tab=active`（默认） | `action-review-*` · `lib/adapters/follow-up.ts` |
| — 待执行 | L1 | `?tab=execution` | `execution/*` · `lib/action-execution-mock.ts` |
| — 已闭环 / 存档 | L1 | `?tab=closed` · `archived` | 同上 · inbox bucket |
| 日历 | L1 | `/calendar` | `components/action-center/calendar/` |
| Action/Case 详情 | L1 | `/suggestions/[key]` · `/?key=` | `case-detail-*` · 分栏 Shell |
| Agents | L2 | `/agents` | `app/(workbench)/agents/` |
| Agent 配置 | L2 | `/agents/.../settings` | `follow-up-agent-settings-*` |
| 评估 | L2 | `/analytics` | `components/evaluation/` |
| Runs | L2 | `/runs` | `components/runs/` · `lib/runs-mock.ts` |
| 集成 | L3 | `/integrations` | `components/integrations/` |
| 治理 | L3 | `/governance` | `components/governance/` · `lib/governance-mock.ts` |
| 设置 | L3 | `/settings` | `app/(workbench)/settings/` |

### 跨层模块说明

| 模块 | 归属 | 理由 |
|------|------|------|
| **总览** | L1 入口，**数据跨层** | 聚合 Work + Agent + Systems 指标；KPI 点击下钻到对应层（§8） |
| **Runs** | L2，**桥梁** | 运营从 Action 查结果；技术从 Agent 查流水线 |
| **设置** | L3 基础设施 | 模型 Provider 等，与业务 Work 无关 |

---

## 6. 侧栏设计原则

1. **分组展示三层**（视觉分组即可，不必改 URL）：Work → Agents → Systems。  
2. **Work 层 Tab 不拆成多个侧栏项**（待审核/待执行/闭环同属 Action 中心）。  
3. **日历**为 L1 一级能力（排期），不与 Action 中心 Tab 混放。  
4. 新增菜单项前问：**用户此刻是在干活、在调 Agent、还是在接系统？**

> 视觉 Token 仍遵 [PUB-15](PUB-15-agentic-ui-design.md)；侧栏路由以**本文 §5** 为准（取代 PUB-15 §3 历史映射表）。

---

## 7. 详情页设计原则

```text
┌─────────────────────────────────────────────────────────┐
│ Action 详情（主）                                         │
│ · 标题 / 状态 / 来源 Agent / 执行人 / 分发与终端           │
│ · 主行动、话术、可执行操作（HITL / 催办 / 撤回）            │
├─────────────────────────────────────────────────────────┤
│ Business Context（上下文，可折叠）                         │
│ · 工单快照、阶段、金额、部位、时间轴…（楔子字段仅在此）       │
├─────────────────────────────────────────────────────────┤
│ Agent 认知（信任轨）                                       │
│ · Trace / Run 摘要 → 下钻 L2 Runs                        │
└─────────────────────────────────────────────────────────┘
```

- **列表**：只认 Action 平台字段（§4）。  
- **详情**：允许楔子丰富展示，但视觉上从属于 Action，而非「商机详情页套 Action」。

---

## 8. KPI 下钻规则（总览 → 各层）

| 指标类型 | 下钻目标 |
|----------|----------|
| 待审核 / 待执行数量 | L1 Action 中心对应 Tab |
| 采纳率 / 误报 / 质量 | L2 评估 |
| Run 失败 / 超时 / 异常 | L2 Runs |
| 集成失败 / 同步延迟 | L3 集成 |
| 权限拦截 / 脱敏命中 | L3 治理 |

**禁止**：在 L1 列表 resurrect 已移除的楔子 KPI 列「方便运营一眼看金额」——金额类指标留在总览或详情 Context。

---

## 9. 代码目录与命名约定

与三层对齐的**目标目录语义**（持续迁移中，以仓库为准）：

| 层 | 目录 / 前缀 | 示例 |
|----|-------------|------|
| L1 Work | `components/action-center/` | `action-review-*`（待审核）· `execution/*`（待执行）· `action-center-nav.ts` |
| L2 Agents | `components/agents/` · `evaluation/` · `runs/` | `lib/agents-mock.ts` · `lib/evaluation.ts` |
| L3 Systems | `components/integrations/` · `governance/` · `settings/` | `lib/governance-mock.ts` |
| 跨层读模型 | `lib/operator-model.ts` · `lib/action-list-display.ts` | UI 列表共用类型 |
| 楔子 Adapter | `lib/adapters/follow-up.ts` | `SuggestionRow → WorkItem` |

**URL 参数纪律**：

| 参数 | 语义 |
|------|------|
| `tab=active` | 待审核（后续可演进为 `tab=review`） |
| `tab=execution` | 待执行 |
| `tab=closed` / `archived` | 闭环 / 存档 |
| `key` | 待审核详情选中 |
| `action` | 待执行详情选中 |

---

## 10. 演进原则

| 原则 | 说明 |
|------|------|
| **三层稳定，楔子可插** | 新 Skill 增加 Adapter + L2 Agent 配置，不改 Work 列表列定义 |
| **Work 列表中性，详情丰富** | 列表 = 平台；详情 = 平台 + Context |
| **一个 Action 中心，多个生命周期 Tab** | 不為每个阶段单独开侧栏 |
| **Runs 归属 L2 但双向链接 L1** | 每条 Action 可追到 Run；每个 Run 可回到 Action |
| **Systems 合并信息架构、可分入口** | 集成与治理可保留两个侧栏项，同属 L3 |
| **与 PUB-16 自检清单并用** | 新 UI 组件过 A1–A7；新导航过本文三层归属 |

---

## 11. 与产品脊柱（PUB-07）的对应

| 脊柱 | 三层归属 | 备注 |
|------|----------|------|
| S1 总览 | L1 入口 + 跨层 | 驾驶舱，非第四层 |
| S2 Inbox + HITL | **L1 Work** | Action 中心 · 待审核/待执行 |
| S3 Trace / Run | **L2 Agents**（Runs）+ L1 详情嵌入 | 信任轨 |
| S4 ROI | **L2 评估** | 效果看板 |
| S5 Studio | **L2 配置** + **L3 知识** | Agent 设置 + 未来知识源 |
| S6 Tenant | **L3 治理** | 权限 · 审计 · 多租户 |

---

## 12. 相关文档

| 文档 | 关系 |
|------|------|
| [PUB-07](PUB-07-product-surface.md) | 产品脊柱 S1–S6；本文细化 Console 导航 |
| [PUB-15](PUB-15-agentic-ui-design.md) | 色彩与 App Shell；侧栏路由以本文 §5 为准 |
| [PUB-16](PUB-16-architecture-evolution.md) | WorkItem 读模型 · Adapter · 每版架构自检 |
| [PUB-04](PUB-04-domain-semantics.md) | 领域语义；详情 Context 展示领域语言 |
| [PUB-13](PUB-13-action-spec-v02.md) | Action Spec 载荷；`recommendation.raw` |
| `apps/console/README.md` | 工程入口；链接本文 |

---

## 13. 总结

| 问题 | 结论 |
|------|------|
| Console 该分几层？ | **Work · Agents · Systems** 三层导航 |
| Action 中心管什么？ | **建议 → 正式 Action → 闭环** 全生命周期，Tab 区分阶段 |
| 列表该显示什么？ | **Action 平台字段**；业务对象字段仅在详情 Context |
| 总览 / Runs / 评估放哪？ | 总览=跨层入口；Runs+评估=L2 |
| 代码怎么对齐？ | `action-review` / `execution` / `agents` / `systems` 语义目录与路由 |
