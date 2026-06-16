# 26 · v0.4.6 Skill Registry（多 Agent 前的插件化边界）

> **状态**：计划中 · **性质**：第二 Skill 前的架构决策与最小交付范围  
> **依赖**：[PUB-01](PUB-01-vision.md) · [PUB-02](PUB-02-architecture.md) · [PUB-16](PUB-16-architecture-evolution.md) · [PUB-17](PUB-17-console-information-architecture.md) · [PUB-25](PUB-25-v045-workbench-display-facets.md)  
> **最后修订**：2026-06-12

---

## 1. 背景

v0.4 已经把 Follow-up 真实闭环、配置面、集成协议、产品壳 live 化和上下文列打通。下一步 v0.5 要新增真实 Agent，例如 Quote Review / Qualification / SLA 等。

如果继续以 `follow-up` 为平台默认分支，新增 Agent 时会自然长出：

```typescript
if (agentId === "follow-up") {
  // follow-up mapper / prompt / tools / UI
} else if (agentId === "quote-review") {
  // quote-review mapper / prompt / tools / UI
}
```

这会把 AOL Console 变成多个 Agent 的硬编码集合，而不是可复用的 Operator Platform。

**v0.4.6 的目标**：在新增第二个真实 Agent 前，先把 Follow-up 收缩成第一个注册的 Skill，让平台只认识通用运行原语。

---

## 2. 核心判断

产品上可以继续叫 **Follow-up Agent**、**Quote Review Agent**。  
工程上统一视为 **Skill Definition**：

```text
Skill Definition
  = prompt / context / tools / schema / policy / adapter / eval
```

平台只认识：

```text
Trigger -> Context -> Run -> Output -> WorkItem/Action -> Approval -> Execution -> Outcome -> Evaluation
```

平台不认识：

```text
FollowUpAgent.run()
QuoteReviewAgent.run()
```

---

## 3. 分层边界

| 层 | 稳定职责 | 不放什么 |
|----|----------|----------|
| Runtime | 调度、状态、持久化、trace、retry、HITL pause/resume | 业务判断规则 |
| Harness | 按 `contextSpec` 组装业务对象与上下文快照 | Agent 专属文案 |
| Skill Definition | prompt、触发器、工具权限、输出 schema、审批策略 | 平台生命周期代码 |
| Adapter | Skill 输出 → `WorkItem` / `Action` / `Run View` | 通用 Shell 布局 |
| Trusted Execution | 审批、执行、审计、回滚、outcome | 模型自由写业务系统 |
| Evaluation | per-skill 指标定义 + 平台通用指标聚合 | 只为 Follow-up 写死口径 |

---

## 4. Skill Definition 最小结构

v0.4.6 只定义最小 manifest，不做低代码 Studio。

```typescript
type SkillDefinition = {
  id: string;
  label: string;
  productName: string;
  status: "enabled" | "draft" | "disabled";

  businessObject: {
    type: string;
    sourceSystemId: string;
  };

  triggers: TriggerDefinition[];
  contextSpec: ContextSpec;
  promptPack: PromptPackRef;
  tools: ToolBinding[];
  outputSchema: SchemaRef;

  approvalPolicy: ApprovalPolicyRef;
  executionPolicy: ExecutionPolicyRef;

  adapters: {
    workItem: AdapterRef;
    run?: AdapterRef;
    listBadges?: AdapterRef;
  };

  evalSpec?: EvalSpecRef;
};
```

### 字段语义

| 字段 | 作用 |
|------|------|
| `id` | 平台唯一 Skill ID，如 `follow-up`、`quote-review` |
| `businessObject` | 本 Skill 主要处理什么对象：work_order / quote / lead / contract |
| `triggers` | 何时进入运行队列，可来自 cron、event、manual re-run |
| `contextSpec` | Harness 应取哪些上下文，不由 prompt 自己猜 |
| `promptPack` | 系统提示、few-shot、SOP、输出约束的版本化引用 |
| `tools` | 可调用工具与权限边界 |
| `outputSchema` | 模型/规则输出结构，必须可校验 |
| `approvalPolicy` | 是否必须人审、谁能审、哪些动作可自动 |
| `executionPolicy` | 允许生成哪些 Action，能否写回业务系统 |
| `adapters` | Skill 输出如何进入平台读模型 |
| `evalSpec` | 准确率、采纳率、完成率、成本、延迟等指标口径 |

---

## 5. Follow-up 迁入方式

v0.4.6 不重写 Follow-up 运行链，只把现有硬编码归档进注册项。

```typescript
export const followUpSkill: SkillDefinition = {
  id: "follow-up",
  label: "Follow-up",
  productName: "Follow-up Agent",
  status: "enabled",
  businessObject: {
    type: "work_order",
    sourceSystemId: "xlink-fsm",
  },
  triggers: ["fsm.status_206_stale", "manual.reanalysis"],
  contextSpec: "skills/follow-up/context.v1",
  promptPack: "skills/follow-up/prompts.v1",
  tools: ["read_fsm", "read_tracking", "write_action"],
  outputSchema: "contracts/suggestion.schema.json",
  approvalPolicy: "human_approval_required",
  executionPolicy: "dry_run_or_approved_execution",
  adapters: {
    workItem: "adapters/follow-up.work-item",
    run: "adapters/follow-up.run",
    listBadges: "adapters/follow-up.list-badges",
  },
  evalSpec: "skills/follow-up/eval.v1",
};
```

现有代码可先保持：

- `apps/console/lib/adapters/follow-up.ts`
- `apps/console/lib/adapters/follow-up-agent-settings.ts`
- `packages/aol/aol/domain.py`
- `contracts/suggestion.schema.json`

但调用方应通过 `skillRegistry.get("follow-up")` 取得元信息，而不是从平台层散落引用 Follow-up 常量。

---

## 6. Quote Review 预期形态

v0.4.6 不上线 Quote Review，只用它检验定义是否足够表达第二 Skill。

```typescript
export const quoteReviewSkill: SkillDefinition = {
  id: "quote-review",
  label: "Quote Review",
  productName: "Quote Review Agent",
  status: "draft",
  businessObject: {
    type: "quote",
    sourceSystemId: "xlink-fsm",
  },
  triggers: ["quote.created", "quote.updated", "manual.review"],
  contextSpec: "skills/quote-review/context.v1",
  promptPack: "skills/quote-review/prompts.v1",
  tools: ["read_fsm", "read_quote", "read_policy", "write_action"],
  outputSchema: "contracts/quote-review.schema.json",
  approvalPolicy: "human_approval_required",
  executionPolicy: "draft_action_only",
  adapters: {
    workItem: "adapters/quote-review.work-item",
  },
  evalSpec: "skills/quote-review/eval.v1",
};
```

如果这份 definition 需要改平台主流程才能表达，说明 v0.4.6 的抽象还不够。

---

## 6.1 Connector vs Skill：谁拥有「报价」？

| 层 | 拥有什么 | 不拥有什么 |
|----|----------|------------|
| **Integration Binding** | 里程碑目录、事实角色、`field_path`、enrich profile | Skill 名称、Action Spec 文案 |
| **Skill Definition** | `contextSpec` 声明需要哪些 `fact_roles`；`reprocess_rules` | Mongo 集合名、XLink 字段路径 |
| **Platform** | `Subject` / `Milestone` / `Fact` 读模型；`fact_snapshot` 指纹 | `quote`、`正式报价` 等业务词 |

Follow-up Skill 的 `contextSpec`（v0.5 形态示意）：

```yaml
# skills/follow-up/context.v1.yaml（示意）
required_fact_roles:
  - primary_offer_amount
  - signed_amount
required_milestones:
  - commercial_offer
  - signed_contract
reprocess_on:
  - fact_fingerprint_drift
  - signed_but_agent_needs_follow  # Skill 级规则名，非平台硬编码
```

Quote Review（§6 草案）的 `businessObject.type: "quote"` 应理解为 **Skill 产品表达**；平台 trace 与 timeline 应使用 binding 的 `milestone_catalog` id，而非平台内置 `quote` 类型。

迁移路线图：[PUB-16](PUB-16-architecture-evolution.md) §6.1 · binding 字段：[PUB-23](PUB-23-v043-integration-protocol-surface.md) §7。

---

## 7. v0.4.6 交付范围

| 区域 | 交付 |
|------|------|
| 文档 | 本文 + `PUB-05` / `PUB-16` / changelog / README 索引 |
| Registry | `skillRegistry` 最小模块：注册、按 ID 查询、列 enabled/draft |
| Manifest | Follow-up 作为第一个 `SkillDefinition` |
| 平台常量 | `sourceAgent`、`skillId`、productName 从 registry 读取 |
| Adapter 绑定 | Follow-up adapter 仍存在，但由 registry 引用 |
| Console | Agents 列表 / Action 筛选使用 registry 元信息，不散落硬编码列表 |
| Schema | 定义 `SkillDefinition` TS 类型；Python 侧可先以 JSON/常量镜像 |
| Guardrail | 禁止新增 `if agentId === "quote-review"` 主流程分支 |

---

## 8. 明确不做

- 不上线第二个真实 Agent。
- 不做 Agent Studio / 在线编辑任意 prompt。
- 不把所有 Follow-up 文件重命名为中性名。
- 不强制改表名 `follow_up_logs`。
- 不引入重型 workflow runtime 替换当前闭环。
- 不开放外部插件市场。

---

## 9. 验收清单

- [ ] Follow-up Agent 页面仍正常展示，但页面元信息来自 registry。
- [ ] Action / Execution / Calendar / Runs 至少一个入口可从 registry 获取 Agent 选项。
- [ ] `mapFollowUpRow` 输出的 `skillId` 与 `sourceAgent` 不再依赖平台层硬编码常量。
- [ ] 新增一个 `quote-review` draft manifest 不需要改 Work 列表列定义。
- [ ] 代码搜索中不新增新的 `if (agentId === "...")` 主流程分支。
- [ ] `pnpm build` 通过。
- [ ] changelog 记录 `[arch] Skill Registry`。

---

## 10. 反模式

| 反模式 | 替代 |
|--------|------|
| 每个 Agent 一套路由、列表、执行状态机 | 一个 Action 生命周期 + Skill adapter |
| prompt 里暗含全部权限和数据边界 | `contextSpec` + `tools` + `approvalPolicy` 显式化 |
| UI 组件直接读某个 Skill 的 raw JSON | Adapter 输出平台读模型 |
| 新 Agent 复制 Follow-up 页面再改字段 | 复用 Shell，新增 registry + adapter + schema |
| 把 Skill 当护城河 | 护城河在 Harness / Cognitive / Trusted Execution / Evaluation |

---

## 11. 与 v0.5 的关系

v0.5 `two-real-agents` 的阶段门改为：

1. 新 Agent 必须先有 `SkillDefinition`。
2. 新 Agent 只能通过 registry 接入 Console。
3. 新 Agent 的差异优先落在 prompt/context/tools/schema/policy/adapter/eval。
4. 若必须改 Runtime / Action 生命周期，需写 ADR-lite 说明这是平台能力缺口，而不是 Agent 特例。

---

## 12. 结论

v0.4.6 是一个小版本，但它决定 v0.5 会长成两种完全不同的系统：

| 路线 | 结果 |
|------|------|
| 继续硬编码 Agent | AOL Console 变成多个业务插件的拼盘 |
| 先落 Skill Registry | AOL Console 成为可复用的 Operator Platform |

本版选择后者：**Agent 是产品表达，Skill 是架构单元，Runtime / Harness / Trusted Execution 是平台能力。**
