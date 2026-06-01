# 01 · 愿景与战略切入点

## 一句话愿景

> **Field Service Cognitive Operating System（FS-COS）是服务行业的 System of Cognition。**
>
> 我们不负责「运行 Agent」，而负责**理解业务、理解客户、理解销售与项目风险，
> 并决定 Agent 应该做什么**。Agent 是执行器；**认知层（Cognitive Layer）才是核心资产**。

工程仓库名仍为 **fs-aol**（历史命名）；对外战略叙事以 **FS-COS**（Field Service Cognitive Operating System /
亦可称 **Field Service Cognitive Platform**）为准。

---

## 与《认知机器》五层对照（SSOT）

书中隐含分层与早期「LLM → Agent → AOL → FSM」**并不一一对应**。对齐后的世界观：

```text
Model Layer              Claude / GPT / Gemini / DeepSeek     ← 商品层，不建护城河
        ↑
Skill Layer              Follow-up · Estimate · Dispatch …    ← 领域能力，可替换（未来或内置为 Claude Skill）
        ↑
Business Harness         客户/项目/时间线/报价上下文组装       ← 核心资产 ★
        ↑
Cognitive Layer          Business Memory · Decision · Graph   ← 核心资产 ★
        ↑
Trusted Execution        审批 · 执行 · 记录 · 审计 · 回滚       ← 核心资产 ★
        ↑
Business Systems         FSM · Excel · QuickBooks · 企微 …
```

| 书中层 | 我们早期说法 | 修正后定位 |
|--------|--------------|------------|
| **Model** | LLM | 可插拔供应商；**永远不与模型公司争 Runtime** |
| **Skill** | × Agent | Follow-up / Estimate 等是 **Skill**，不是平台；commodity 化风险高 |
| **Harness** | Context Engine | 改名为 **Business Harness**：模型不知道你的 FSM/Excel/微信，由我们拼装 `Project Context` |
| **Cognitive** | （新增强调） | 客户是否价格敏感、平均 7 天成交等——**不是 Prompt/Skill** |
| **Trusted Execution** | Action + Approval 分散 | **合并为一层**：建议→审批→执行→归档→可审计；Claude 无法替企业担责 |
| **Business** | FSM | System of Record，commodity |

> **最危险**：把 Estimate / Follow-up 当成终局（纯 Skill）。  
> **最安全**：**Harness + Cognitive + Trusted Execution**——Claude 接不进客户 FSM、建不起行业图谱、承担不了审批与审计责任。

---

## 战略修正（相对早期「Agent Operating Layer」表述）

结合《认知机器》与平台演进判断，我们做五处关键修正——**修正的是定位与护城河，不是推翻当前 POC 技术栈**：

| # | 旧表述（危险区） | 新表述（护城河） |
|---|----------------|----------------|
| 1 | AOL = Agent Runtime，价值在「运行 Agent」 | **Business Reality → Business Knowledge → Business Decisions → Agent**；Agent 只是手脚 |
| 2 | Event Bus 是 Kernel 核心 | Event Bus 是**可替换基础设施**（Temporal / Kafka / 云厂商都能做） |
| 3 | Data Fabric 接上游即可 | 升级为 **Cognitive Layer**：客户/项目/销售/运营/行业认知 |
| 4 | 先开源 AOL Kernel | **不先开源 Kernel**；开源 Connector、Event Schema、Agent SDK |
| 5 | Agent Marketplace 是终局 | 终局是 **Decision Intelligence（决策智能）**，不是 Agent 应用商店 |

> **不要站在模型与用户之间做翻译层、中间层、拼装层。**
> OpenAI / Claude / Gemini 未来都可能内置 Runtime；若我们的价值仅是「运行 Agent」，就在死亡名单里。

---

## 从「记录业务」到「理解并决策业务」

| | 传统软件 | 未来软件（FS-COS） |
|---|---|---|
| 范式 | **System of Record** | **System of Cognition** |
| 职责 | 保存事实 | 形成认知、给出决策、再驱动行动 |
| 回答 | 记录发生了什么 | **理解意味着什么 → 下一步应该做什么** |

- 过去 20 年，`CRM / ERP / FSM` 改变了企业**记录**业务的方式。
- 接下来，`Cognitive Operating System` 改变企业**理解并运营**业务的方式。

FSM 告诉你「发生了什么」；**认知层**告诉你「这对客户/项目意味着什么」；Agent 在人工批准后**执行**。

---

## 核心使命（Mission）

帮助每一家服务型企业，把分散在 FSM、表格、聊天里的**业务现实**，沉淀为可复用的**行业认知与决策能力**。

- 不是一个聊天机器人；
- 不是一个通用 Agent Runtime；
- 而是一套能持续回答 **「现在是什么情况、风险在哪、下一步做什么」** 的认知与决策系统，
  再由 Agent 把决策落到消息、任务与工单动作上。

### 未来的组织形态

```text
今天                  未来
老板                  老板
 ↓                     ↓
销售                  认知 + 决策系统
 ↓                     ↓
客服                  Agent 执行层
 ↓                     ↓
调度                  员工（判断、关系、现场）
施工
```

- **员工负责**：判断、沟通、执行、关系建立。
- **认知层负责**：画像、风险、时机、策略、优先级。
- **Agent 负责**：在 guardrails 内执行已批准的 Action。

---

## 产品定位：Cognitive Layer Above FSM

```text
                      FS-COS（理解 + 决策）
────────────────────────────────────────
  客户认知 · 项目认知 · 销售认知 · 决策引擎
  Follow-up / Estimate / Closing …（执行型 Agent）
────────────────────────────────────────
                      FSM（存储事实）
  Customer · Lead · Quote · Job · Invoice
```

- **FSM 负责**：存储事实（commodity layer，可替换）。
- **Cognitive Layer 负责**：业务世界模型、认知图谱、决策智能（**护城河**）。
- **Agent 负责**：在 Human-in-the-loop 下执行（commodity 趋势：未来可能 Skills 化）。

### 认知层 vs 系统事实（示例）

| 视角 | 看到什么 |
|------|----------|
| FSM | `Quote Sent` |
| LLM（裸文本） | 一些沟通记录 |
| **Cognitive Layer** | 高概率成交客户、当前犹豫、**最佳跟进窗口约 48 小时** |

---

## 长期架构（自下而上 · 与《认知机器》一致）

| 层 | 名称 | 护城河 | 职责 |
|---|------|--------|------|
| L0 | **Business Systems** | — | FSM / Excel / QuickBooks / 企微；Business Reality |
| L1 | **Trusted Execution Layer** | ★ | 建议 → **审批** → 执行 → **记录/审计/回滚**；企业级责任边界 |
| L2 | **Cognitive Layer** | ★ | Business Memory、Decision Engine、Cognitive Graph、Ontology（何谓高价值 Lead、危险 Quote） |
| L3 | **Business Harness** | ★ | 跨源组装 `customer` / `quote` / `timeline` / `job` / `sales` → **Project Context**，再交 Model |
| L4 | **Skill Layer** | — | Follow-up Skill、Estimate Skill…（产品可仍称 Agent，战略上视为 Skill） |
| L5 | **Model Layer** | — | 混元 / DeepSeek / Claude…可替换 |

> **Ontology** 归属 Cognitive Layer（行业世界模型），不是 Harness 的简单字段拼接。  
> 数据在底层，**Harness 与 Cognitive 在中间**，Skill/Model 在上且可替换。

---

## 核心资产（三块护城河）

与《认知机器》一致，长期付费点集中在：

| 资产块 | 含义 | 示例 |
|--------|------|------|
| **Business Harness** | 业务上下文组装器 | 客户/房屋/区域/施工史/规范库 → `Project Context`；Claude 不知道你的 FSM |
| **Cognitive Layer** | 企业独有认知 + 决策 | Cognitive Graph、Ontology、Business Memory、Decision Intelligence |
| **Trusted Execution** | 可信执行与责任 | 审批闸门、Action、Turso 审计轨、outcome 回写、回滚策略 |

**商品层（不建护城河）**：Model、Skill（含 Follow-up/Estimate 能力本身）、Event Bus、通用 Workflow、Agent Marketplace。

---

## Skill 演进路线（应用层 · 可替换）

对外产品可仍写「Agent」；战略上它们是 **Skill**——依赖 Harness 上下文与 Cognitive 决策，经 Trusted Execution 落盘。

### 第一代 · 获客到成交（销售域）

| Skill | Harness 输入 | Cognitive 问题 | 经 Trusted Execution 的输出 |
|-------|--------------|----------------|------------------------------|
| **Qualification** | 线索/渠道上下文 | 是否高价值 | 分级、跟进建议 → 审批 → 任务 |
| **Estimate** | 现场/图片/规范库 | 方案与风险 | 报价 PDF → 审批 → FSM |
| **Follow-up** | 报价/时间线/销售 | 是否流失、何时跟 | 建议 → Console 审批 → 企微/记录 |
| **Closing** | 报价/互动史 | 成交策略 | 策略建议 → 审批 → 执行 |

### 第二代 · 交付与回款

Scheduling · Dispatch · Procurement · Collection（同上：先认知/决策，再执行）。

### 第三代 · 跨域闭环

```text
认知更新 → 决策 → Agent 执行 → 事实回写 FSM → 认知再学习
```

---

## 战略切入点：Follow-up 楔子（Phase 1）

愿景虽大，落地必须克制。正确做法：**选一个痛点极深、闭环极短、容错极高、收益可量化的场景先验证业务价值**。

我们选择的第一个楔子是 **Follow-up Skill（产品名仍可叫 Agent）**——用于验证：

1. **业务价值**（转化、采纳率、流转时间）；
2. **Business Harness 雏形**（enrich → 统一 Project Context）；
3. **Cognitive 雏形**（情况判断 + 跟进方案）；
4. **Trusted Execution 雏形**（Suggestion → Approval → Action → trace/outcome 归档）。

### 为什么是 Follow-up

**1. 痛点极深、闭环极短**

防水维修等行业，大量流失发生在**勘查/施工完毕后的「跟进真空期」**——非结构化现场信息未转化为可跟进的决策。

**2. 完美的 Human-in-the-Loop**

引擎只产出 `Suggestion`，人类点同意/拒绝/修改，**不直接联系客户**。对公司零「AI 乱说话」风险，对引擎高容错。

### Follow-up 在路线图中的位置

Follow-up **不是**终局产品，而是 **Phase 1：验证业务价值与认知闭环** 的楔子。

最小竖切仍可用工程语言描述（与实现对齐）：

> 摄取 → **Harness**（enrich/上下文）→ **Cognitive+Decision**（JSON 建议）→ **Trusted Execution**（Console 审批 + 企微/追踪库）

工程四原语（Ingestion / Reasoning / Action Spec / Execution）分别映射 Harness、Cognitive、Trusted Execution 的 Phase 1 竖切，**不是**「AOL Kernel」品牌。

---

## 开源策略（方向）

| 开源（生态） | 闭源 / 商业（护城河） |
|--------------|----------------------|
| **Connector Layer**（Excel / Sheets / QuickBooks / FSM） | Cognitive Graph、行业 Ontology、Decision 模型与数据 |
| **Event Schema**（`LeadCreated` / `QuoteViewed` …） | Hosted 认知平台、行业 Pack |
| **Agent SDK**（`agent.execute(context)`） | Decision Intelligence、Benchmark 与运营数据 |

**不先开源**：Agent Runtime、Workflow Engine、Memory 等易被平台原生的「Kernel 拼装层」。

---

## 终局判断

再往前推 5～10 年，FS-COS 的终局不是「又一个 AI 功能」或「Agent 应用商店」，而是：

> **FSM 记录发生了什么；Harness 组装上下文；Cognitive 理解并决策；Trusted Execution 在审批后执行并留痕；Skill/Model 均可替换。**

---

## 衡量成功（Phase 1 → Phase 2）

- **业务指标**：跟进建议带来的转化/采纳/流转提升（Phase 1）。
- **认知指标**：同一客户/项目画像可被多场景复用，决策可解释、可审计（Phase 2）。
- **信任指标**：业务方在产品内处置建议，而非只翻群消息。
- **架构指标**：新增一个执行型 Agent 时，**不必重写认知与决策核心**（验证分层正确）。
