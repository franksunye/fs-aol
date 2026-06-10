# 18 · AOL 工业化打磨计划（真实楔子 + 场景样例）

> **状态**：生效中 · **性质**：从当前 Console 混合态走向可演示、可试点、可产品化 AOL 的执行计划  
> **依赖**：[PUB-01](PUB-01-vision.md)（FS-COS 顶层定位）· [PUB-07](PUB-07-product-surface.md)（产品脊柱）· [PUB-17](PUB-17-console-information-architecture.md)（三层 IA）  
> **最后修订**：2026-06-10

---

## 1. 本文解决什么问题

当前 Console 已进入 **真实 Follow-up 楔子 + 大量未来场景样例** 的混合态：

- **真实层**：Follow-up 场景已有真实工单、Action、管家、Turso 追踪与处置闭环。
- **场景层**：Estimate / Inspection / Collection / Integrations / Governance / AI Infrastructure 等模块用 mock 先呈现 AOL 最终形态。

这条路线正确，但必须工业化处理，否则会出现两类风险：

1. **信任风险**：试点用户分不清哪些是真实运行，哪些是样例。
2. **叙事风险**：外部看不到 Follow-up 是楔子，只觉得是一组半真半假的页面。

本文把 mock 从「假数据」产品化为 **Scenario Layer（场景样例层）**，同时把真实 Follow-up 打磨成可信闭环。

---

## 2. 工业化目标

一句话：

> **先把 Follow-up 做真、做深、做可信；再把其他 mock 场景做成清晰的 AOL 未来版图。**

工业化后的 Console 必须同时回答：

| 问题 | 对应产品面 |
|------|------------|
| 现在真实跑得怎么样？ | Overview · Action 中心 · Runs · 评估 |
| 为什么 Agent 这么判断？ | Action 详情 · Run trace · 业务上下文 |
| 人在哪里批准和担责？ | Action 中心 · Governance · Audit |
| 结果有没有变好？ | Outcome · 评估 · ROI |
| AOL 未来能扩到哪些场景？ | Agents · Integrations · Scenario cards |

---

## 3. 产品标准

AOL 工业化标准：

```text
Action-first
+ Human-approved
+ Trace-visible
+ Outcome-measured
+ Governance-enforced
+ Scenario-expandable
```

对应 UI 纪律：

| 标准 | UI 要求 |
|------|---------|
| Action-first | 首页与 Work 层优先回答「今天该处理什么」 |
| Human-approved | 高影响动作必须有人审、可修改、可拒绝、留理由 |
| Trace-visible | 每条 Action 可追溯 Run、上下文、工具调用、模型/规则版本 |
| Outcome-measured | 采纳、修改、拒绝、反馈、推进、业务价值有稳定口径 |
| Governance-enforced | Agent 权限、动作权限、审批矩阵、脱敏与审计可见 |
| Scenario-expandable | 未来 Agent/集成/治理能力以场景样例表达，不冒充生产数据 |

---

## 4. 数据状态四态

全 Console 必须引入统一数据状态，不允许只在页面顶部笼统说明。

| 状态 | 含义 | 示例 | UI 表达 |
|------|------|------|---------|
| **真实运行** | 来自当前真实库或真实追踪表，可被验证 | Follow-up 待审核、真实工单、真实 outcome | `真实` badge + 更新时间 |
| **估算** | 基于真实数据推导，口径需说明 | 业务价值、ROI、转化增量 | `估算` badge + 口径说明 |
| **场景样例** | 未来能力 mock，用于表达产品形态 | Estimate Agent、Collection Agent、ERP 集成 | `样例` badge + 上线条件 |
| **未接入** | UI 壳已存在但未真实生效 | 新建连接、模型发布、部分治理动作 | `未接入` badge + 禁止误触发 |

### 4.1 文案纪律

禁止：

- “核心指标均来自库内统计”覆盖整页，但下方仍有 mock。
- mock Agent 显示成无解释的“已启用”。
- 演示数据按钮看起来会真实发布配置。

推荐：

- “当前试点：Follow-up Agent 为真实运行；其他 Agent 为场景样例。”
- “业务价值为估算，口径：已采纳 Action 关联金额 × 经验系数。”
- “该能力为企业版场景样例，需接入 CRM 写回权限后上线。”

---

## 5. 模块打磨原则

### 5.1 Overview

定位：AOL 决策驾驶舱，不是普通 BI。

必须拆成三段：

| 段落 | 内容 | 数据状态 |
|------|------|----------|
| 真实试点运行 | Follow-up 今日建议、待审核、待执行、已反馈、异常 | 真实运行 / 估算 |
| AOL 场景版图 | 多 Agent、集成、治理、未来业务线覆盖 | 场景样例 |
| 今日需要处理 | 高优建议、超时 Action、Run 异常、集成延迟 | 真实优先，样例需标注 |

验收：

- 3 秒内能回答「今天真实有几件事要处理」。
- 每个 KPI 下钻后保留筛选状态。
- 每个指标能看到数据状态与更新时间。

### 5.2 Action 中心

定位：Trusted Execution 主战场。

必须打穿：

```text
Suggestion -> 审核 / 修改 / 拒绝 -> Action -> 分发 -> 反馈 -> Outcome -> Audit
```

验收：

- 待审核、待执行、已闭环、存档四个生命周期清晰。
- Action 详情包含：主行动、业务上下文、Agent 判断依据、审批记录、执行记录、结果。
- 每条真实 Action 可跳转对应 Run。

### 5.3 日历

定位：Action SLA 与时间责任，不做普通日程表。

验收：

- 日历事项来源于 Action 截止 / SLA / 计划，不混成泛日程。
- 今日安排可直接回到 Action 流转。
- 逾期项显示负责人、影响、下一步动作。

### 5.4 Runs

定位：信任轨，不是纯工程日志。

验收：

- Run 详情显示触发、上下文、工具调用、模型/规则、产出 Action。
- 异常 Run 显示业务影响：影响几条 Action、是否需补跑、补救入口。
- Action 详情和 Run 详情双向链接。

### 5.5 评估

定位：Agent 质量与业务价值证明，不是普通经营报表。

验收：

- 真实 Follow-up 指标与多 Agent 样例指标分区展示。
- 准确率、采纳率、修改率、拒绝率、反馈率、完成率有口径说明。
- ROI / 业务价值必须标 `估算`，并给出计算口径。

### 5.6 Agents

定位：能力目录 + 上线状态。

验收：

- 每个 Agent 标明：`真实运行` / `场景样例` / `规划中` / `停用`。
- 每个 Agent 显示职责范围、触发条件、接入系统、输出 Action、能力边界。
- Follow-up 是真实楔子；其他 Agent 是场景样例，不冒充生产可用。

### 5.7 集成

定位：Business Harness 控制台。

验收：

- 每个系统显示提供哪些上下文、允许哪些写回、被哪些 Agent 使用。
- 真实接入系统与未来集成样例分区或标注。
- 同步失败能显示影响哪些 Agent / Action。

### 5.8 治理

定位：Trusted Execution 的企业管控层。

验收：

- 真实化 Follow-up 审批规则、角色权限、审计记录。
- 未来企业能力标为场景样例。
- 发布配置、新建权限、批量触达等未接入动作必须防误触。

### 5.9 设置 / AI 基础设施

定位：模型与基础设施可替换，不抢 AOL 主叙事。

验收：

- 模型供应商如为 mock，必须标 `场景样例`。
- Agent 级模型策略与平台级模型路由边界清晰。
- 成本、延迟、错误率如非真实，不得作为生产指标展示。

---

## 6. 小闭环迭代计划

每轮必须满足：

- 可独立验收。
- 可发布 / 可回滚。
- 不破坏真实 Follow-up 链路。
- 结束时更新截图、验收记录与 changelog。

### I0 · Baseline Audit（0.5-1 天）

目标：冻结当前混合态基线。

交付：

- 逐页面标记真实 / 估算 / 场景样例 / 未接入现状。
- 记录线上 Console hydration error、数据日期不一致、下钻状态缺口。
- 输出一张模块矩阵：Work / Agents / Systems × 数据状态 × 风险等级。

验收：

- PO 能确认“哪些已经真实运行，哪些只是未来样例”。

### I1 · Data State System（1-2 天）

目标：建立全局数据状态语言。

交付：

- 新增统一 badge / tooltip / help text 组件。
- Overview、Agents、Integrations、Governance、Settings 先完成状态标注。
- 顶部文案改为：Follow-up 真实运行，其他模块为 AOL 场景样例。

验收：

- 任意页面 5 秒内能判断数据状态。
- mock 不再伪装成生产真实。

### I2 · Follow-up Execution Chain（2-4 天）

目标：把真实 Follow-up 闭环打深。

交付：

- Action 详情重构：主行动、上下文、Agent 判断依据、审批、执行、Outcome、Run 链接。
- Run 详情补业务影响和产出 Action。
- Action <-> Run 双向链接。

验收：

- 任选一条真实 Follow-up Action，可从建议追到 Run，再回到执行结果。
- PO 能用一条真实工单讲完整 AOL 故事。

### I3 · Overview as AOL Cockpit（2-3 天）

目标：Overview 从 KPI 看板升级为 AOL 驾驶舱。

交付：

- 三段式结构：真实试点运行 / AOL 场景版图 / 今日需要处理。
- KPI 下钻带筛选状态与来源提示。
- 修正近 7 天日期口径，保证截至当前业务日期或明确截至日期。

验收：

- 3 秒回答“今天真实待处理什么”。
- 30 秒回答“AOL 未来能扩展到哪些场景”。

### I4 · Scenario Layer Productization（2-4 天）

目标：把未来 mock 变成产品化场景样例。

交付：

- Agents：真实运行 / 场景样例 / 规划中 / 停用状态统一。
- Integrations：真实接入 / 待接入 / 场景样例分层。
- Governance：真实 Follow-up 规则与企业版样例分层。

验收：

- 外部演示时不会误导“所有 Agent 都已上线”。
- 未来场景能清晰表达上线条件与复用路径。

### I5 · Trust, Evals & Governance Proof（3-5 天）

目标：补齐产品可信证明。

交付：

- 评估页分区：真实 Follow-up 指标 vs 多 Agent 场景样例。
- ROI / 业务价值口径说明。
- Governance 展示真实审批规则与审计样例。
- Runs 异常加入补救建议。

验收：

- 管理层能看到真实指标与估算指标边界。
- 运营能看到异常后该做什么。

### I6 · Industrial Hardening（2-4 天）

目标：线上可演示、可试点。

交付：

- 修复 hydration mismatch（React #418），重点排查相对时间、日期、随机数、客户端宽度差异。
- loading / error / empty 状态覆盖所有主路由。
- 移动 / 窄屏关键路径检查。
- 性能与慢查询提示。

验收：

- 主路由无阻断性 console error。
- Overview / Action / Runs / Agents / Integrations / Governance 首屏可稳定演示。

---

## 7. 推荐版本切分

当前近端里程碑以 [PUB-05](PUB-05-releases.md) 为准：

| 版本 | 主题 | AOL 工业化意义 |
|------|------|----------------|
| `v0.4.0` | followup-real-loop | 打穿真实 Follow-up 楔子，形成第一条可信执行闭环 |
| `v0.5.0` | two-real-agents | 新增 2 个真实 Agent，证明 AOL 不是 Follow-up 专用实现 |
| `v0.6.0` | engineering-hardening | 前端、后端、数据契约、性能、测试、CI 工程硬化，达到产品和开源质量门槛 |
| `v0.7.0` | bilingual-i18n | 支持中文和英文，完成 Console 文案、枚举、格式化和英文 Quickstart |
| `v0.8.0` | configurable-oss-core | 解耦、配置化、产品化，发布开源 AOL Core / Console alpha |

旧规划不废弃：`context-sop` 作为 v0.4 的 Context Builder / Decision Policy，`proof-metrics` 作为 v0.4 Evaluation / Outcome 与 v0.5 多 Agent proof 的基础。

若沿 `v0.3.x` 后续补丁 / `v0.4` 前置执行：

| 迭代 | 建议 tag | 主题 |
|------|----------|------|
| I0 | 不打 tag | 基线审计 |
| I1 | `v0.3.6` | data-state |
| I2 | `v0.3.7` | followup-chain |
| I3 | `v0.3.8` | aol-cockpit |
| I4 | `v0.3.9` | scenario-layer |
| I5 + I6 | 并入 `v0.4.0` | trust-proof + hardening，服务 Follow-up real loop |

---

## 8. 验收门槛

进入 `v1.0` 前必须满足：

- [ ] 所有主页面有数据状态标识。
- [ ] 真实 Follow-up Action 可完整追溯到 Run、审批、Outcome。
- [ ] Overview 清楚区分真实试点与未来场景。
- [ ] Agents / Integrations / Governance 不误导 mock 为生产可用。
- [ ] 评估页区分真实指标、估算指标、样例指标。
- [ ] 主路由无阻断性 hydration / runtime error。
- [ ] 至少 1 条真实工单可用于外部演示完整 AOL 故事。

---

## 9. 相关文档更新要求

每完成一个迭代：

1. 更新 [PUB-changelog](PUB-changelog.md)。
2. 若改动导航 / 生命周期，更新 [PUB-17](PUB-17-console-information-architecture.md)。
3. 若改变产品脊柱或 DoD，更新 [PUB-07](PUB-07-product-surface.md)。
4. 若改变版本切分，更新 [PUB-05](PUB-05-releases.md)。
