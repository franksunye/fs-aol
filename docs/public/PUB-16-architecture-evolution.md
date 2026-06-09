# 16 · Operator Platform 架构演进纪律（Architecture Evolution）

> **状态**：生效中 · **性质**：每个版本打 tag 前的架构自检 SSOT  
> **依赖**：[PUB-02](PUB-02-architecture.md)（FS-COS 分层）· [PUB-07](PUB-07-product-surface.md)（产品脊柱）· [PUB-14](PUB-14-v030-scope.md)（v0.3 交付）  
> **最后修订**：2026-06-09

---

## 1. 本文解决什么问题

我们要做**通用 Agentic UI + 多 Agent 能力**，未来可对接 CRM / FSM / ERP——但**不指望一步到位**。

本文定义一种**版本节奏上的架构纪律**：

1. **每个版本只问一件事**：「此刻最值得做的一小步架构调整是什么？」  
2. **保护已验证的抽象**，把楔子语义逐步关进 Adapter / Connector，而不是推倒 Console。  
3. **让架构在正轨上自然生长**——少欠债、少过度设计、每步可演示可回滚。

> **铁律**：没有「大重构版本」。只有「本版产品交付 + 附带 1～3 项有明确边界的架构微调」。

---

## 2. 我们已经具备的平台价值（勿拆）

当前最小版本（`v0.2.5` + `v0.3.x` Console）**已有抽象价值**，应视为资产而非过渡代码。

### 2.1 产品交互模式（跨行业可复用）

| 模式 | 代码锚点 | 通用语义 |
|------|----------|----------|
| 分栏收件箱 | `WorkbenchSplitLayout` · `?key=` | 队列 → Case Workspace |
| Inbox 三桶 | `inbox_bucket` · 侧栏 Tab | pending / handled / archived |
| HITL 处置 | `DispositionBar` · `POST /api/outcomes` | approve / reject / modify / acknowledge |
| 结构化负反馈 | `POST /api/blockers` | 操作员对 Agent 的分类纠错 |
| 多轮 Run | `?round=` · `/api/traces` | Agent 版本化分析 |
| 双轨时间轴 | `lane: business \| agent` | 业务事实轨 + Agent 认知轨 |
| URL 状态 | `lib/workbench-nav.ts` | 可分享深链，无全局 store |
| Lite → Full 观测 | `getTraceLite` + 客户端拉全量 | 重 trace 的性能模式 |
| Operator Shell | `AppShell` · `DesktopSidebar` | 侧栏 · 指标 · 筛选 · 详情侧栏 |

### 2.2 数据与责任切分（架构正确）

```text
Business System (Mongo/CRM/ERP)
        │ 只读 · ACL
        ▼
Python Harness + Skill (packages/aol)
        │ 写 logs / traces / timeline
        ▼
Turso 追踪层 (contracts/aol_schema.sql)
        │ Console 只读 + HITL 写 outcomes/blockers
        ▼
Console — Trusted Execution 面 (apps/console)
```

这与 [PUB-02](PUB-02-architecture.md) 一致：**Console 不直连业务写库**，是通用 Agentic 产品的正确形态。

### 2.3 契约层（跨语言 SSOT）

| 资产 | 路径 | 角色 |
|------|------|------|
| DDL | `contracts/aol_schema.sql` | 追踪表结构 |
| 建议载荷 | `contracts/suggestion.schema.json` | Action Spec v0.2 |
| 表名清单 | `contracts/tables.json` | 运行时前缀 |

追踪表在**语义上**已接近通用 Agent 平台（命名仍带 follow-up 烙印，可渐进改名）：

| 表 | 平台语义 |
|----|----------|
| `follow_up_logs` | **Work Item**（一次 Agent 建议实例） |
| `reasoning_traces` | **Run / Trace** |
| `suggestion_outcomes` | **Human Disposition** |
| `blocker_feedback` | **Operator Feedback** |
| `timeline_events` | **Activity Feed** |

---

## 3. 目标分层（生长方向，非本版交付清单）

Console 与引擎向三层壳生长，**楔子只留在最外层**：

```text
┌─────────────────────────────────────────────────────────┐
│ L0 · Operator Shell（通用 Agentic UI）                   │
│ AppShell · Inbox · CaseWorkspace · HITL · TraceViewer    │
│ 只认识：WorkItem / Recommendation / Run / Activity     │
└───────────────────────────┬─────────────────────────────┘
                            │ ViewModel Adapters
┌───────────────────────────▼─────────────────────────────┐
│ L1 · Tracking Client（平台读模型 + TE 写 API）            │
│ 契约生成类型 · inbox / traces / timeline / outcomes    │
└───────────────────────────┬─────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────┐
│ L2 · Skill + Connector（可插拔）                         │
│ follow-up-wedge · 未来 estimate / dispatch / crm-x       │
│ Harness 写追踪层；定义 payload schema 与 enrich 步骤       │
└─────────────────────────────────────────────────────────┘
```

**L0 稳定、L2 可插**——版本迭代时优先巩固 L0/L1 边界，而不是在 UI 里长业务规则。

---

## 4. 平台读模型（概念 SSOT）

UI 与 L1 应逐步只依赖下列**语义中性**类型。楔子字段沉入 `metadata` / `raw`，不删除、不急于改表。

```typescript
/** 概念模型 — 实现可置于 apps/console/lib/operator-model.ts */
type WorkItem = {
  id: string;                 // dedupe_key
  subjectId: string;          // work_order_id / case_id / ticket_id
  skillId: string;            // 默认 "follow-up"
  assigneeId?: string;
  inbox: "active" | "closed" | "archived";
  priority?: "high" | "medium" | "low";
  summary: string;
  statusBadges: StatusBadge[];
  recommendation: Recommendation;
  disposition?: Disposition;
  /** 楔子/Connector 扩展；UI 通用组件不得依赖此处具体键 */
  metadata: Record<string, unknown>;
};

type Recommendation = {
  headline: string;
  rationale: string;
  primaryAction: string;
  talkingPoints: string[];
  citations: string[];
  raw: unknown;               // Action Spec v0.2 原样
};

type ActivityEvent = {
  id: string;
  lane: "business" | "agent";
  kind: string;
  at: string;
  title: string;
  summary?: string;
  payload: unknown;           // 由 kind 对应 renderer 解析
};
```

**Follow-up Adapter**（首个实现）：`mapFollowUpRow(SuggestionRow) → WorkItem`。  
换 CRM 时换 Adapter + Python Connector，不换 `CaseWorkspace` 布局。

---

## 5. 每版架构自检清单（打 tag 前 15 分钟）

每个 `vX.Y.N` tag 前，PO / 工程共同过一遍：

| # | 问题 | 若答「是」→ 本版应做 |
|---|------|----------------------|
| A1 | 是否有**新 UI 组件**直接读取 `SuggestionDoc` 中文字段？ | 经 Adapter 或集中 mapper 暴露英文字段 |
| A2 | 是否在 Console 新增**业务系统字段**（Mongo 状态码等）的展示逻辑？ | 下沉 `metadata`，或仅在 wedge 专用组件 |
| A3 | 是否复制了**已在 contracts 定义**的类型/枚举？ | 改为生成或从单一模块 re-export |
| A4 | 本版是否引入**第二个 Skill 或第二个 Connector** 的迹象？ | 预留 `skillId` / renderer 注册点，不必全实现 |
| A5 | `lib/suggestions.ts` 是否又增 100+ 行 unrelated 职责？ | 拆到 `tracking/` 或 wedge adapter |
| A6 | 时间轴是否为新 `kind` 硬编码了解析？ | 注册 `timeline-renderers[kind]` |
| A7 | 本版 Shell / HITL / 分栏动线是否可复用于下一 Skill？ | 若是，写入 changelog「架构资产」一行 |

**通过标准**：本版可以零架构改动，但**必须显式回答** A1–A7（哪怕全是「否」）。避免无意识漏债。

---

## 6. 版本级架构微调路线图

> 与产品交付**并行**，每项独立可验收、可跳过（须记录原因）。  
> **不是**本表全部做完才能发版；每版拣 **0～3 项**。

### v0.3.x（Agentic UI 工业级 — 当前）

| 优先级 | 微调项 | 交付物 | 理由 |
|--------|--------|--------|------|
| P0 | **文档 SSOT** | 本文 + README 索引 | 统一「生长纪律」 |
| P1 | **Adapter 骨架** | `lib/operator-model.ts` + `lib/adapters/follow-up.ts` | 新 UI 只接 WorkItem；旧路径可薄包装 |
| P1 | **拆读模型** | `lib/tracking/*` 从 `suggestions.ts` 抽出 SQL | 为多 Skill 读路径腾位 |
| P2 | **时间轴注册表** | `lib/timeline-renderers/` + default fallback | 新 Connector 不加 if-else |
| P2 | **命名中性化** | `OpportunityRow` props 接受 `WorkItem`（文件名可后置） | 降低心理耦合 |
| — | ~~改表名 follow_up_logs~~ | 延后 | 语义抽象优先于物理改名 |

与 [PUB-14](PUB-14-v030-scope.md) 关系：**不挤占运营收官**；P1 可并入 `v0.3.4`/`v0.3.5` 间隙或 `v0.3.6` 补丁。

### v0.4.x（第二 Skill 或第二 Connector 前）

| 微调项 | 交付物 |
|--------|--------|
| 契约生成 TS | `suggestion.schema.json` → 生成类型，消灭手写 `SuggestionDoc` 漂移 |
| `skill_id` 列（可空，默认 `follow-up`） | migration + 引擎写入 |
| 侧栏 Skill 槽 | 配置驱动导航项 |
| Trace API 别名 | `/api/runs/[subjectId]` 与现有 traces 并存 |
| Connector 接口草案 | Python `integration/base.py` 注册 enrich/fetch |

### v1.0（产品轨）

| 微调项 | 交付物 |
|--------|--------|
| 正式 `@fs-aol/operator-types` 或 monorepo package | UI 与引擎消费同一读模型 |
| 多管家 → 多 Assignee 配置 | 去硬编码 `pilot-housekeepers` |
| 埋点与 TE 审计字段 | disposition 链路可追溯到 Run |
| 第二 wedge 端到端证明 | **同一 Shell** 加载第二 Skill 的 WorkItem |

### Phase 2+（Cognitive / 多租户）

- Memory / Graph 不进 Console 热路径  
- Tenant 隔离在追踪层 + Auth，不在组件里 if-tenant  
- Studio（S5）编辑的是 Harness 模板与 Skill 开关，不是 Runtime Kernel  

---

## 7. 原则与反模式

### 7.1 坚持

| 原则 | 说明 |
|------|------|
| **Shell 稳定，Skill 可插** | App Shell、分栏、HITL、Trace 查看器不轻易改 |
| **楔子在 Adapter + ACL** | Python `domain.py` / Console adapter；UI 不读 `mongo_status` |
| **URL 是状态 SSOT** | 不引入重量级全局 store |
| **写路径最小** | Console 写 TE 表；重分析、re-run 走引擎 API |
| **契约先行** | 表结构 / JSON Schema 改在前，UI 改在后 |
| **一小步可回滚** | 每步架构改动可单独 revert |

### 7.2 避免

| 反模式 | 后果 |
|--------|------|
| 「等架构完美再发版」 | 运营与产品反馈断档 |
| Console 直连 CRM 写库 | 破坏 TE 边界，无法多租户 |
| 为通用性引入空接口层 | 无第二 Skill 时的过度抽象 |
| 全库 rename 追语义 | 迁移成本 > 收益；用 adapter 别名即可 |
| 在 UI 复制 inbox  reconcile 规则 | 与 Python `inbox/sync.py` 双轨失真 |

---

## 8. 架构决策记录（每版 0～1 条 ADR-lite）

打 tag 时若本版有架构微调，在 [PUB-changelog](PUB-changelog.md) 该版本行追加 **`[arch]`** 前缀，或记入本地 `PRIV-09`：

```markdown
### ADR-lite · v0.3.x-arch-01
- **背景**：Case 组件直接读 Action Spec 中文键，阻碍第二 Skill。
- **决策**：引入 WorkItem adapter；本版仅 follow-up 实现，UI 新代码只接 WorkItem。
- **不做**：不改 Turso 表名；不拆 Python 包。
- **复验**：下版 A1 清单应为「否」。
```

---

## 9. 模块边界对照（现状 → 目标）

| 现状 | 目标 | 迁移方式 |
|------|------|----------|
| `lib/suggestions.ts` 上帝模块 | `lib/tracking/` + `lib/adapters/follow-up.ts` | 渐进 re-export，不 big-bang |
| `SuggestionRow` 直达 UI | `WorkItem` + adapter | 新组件用新类型；旧组件薄包装 |
| `lib/timeline.ts` 楔子解析 | `timeline-renderers[kind]` | 按 kind 逐个迁出 |
| `OpportunityRow` | `WorkItemRow`（props: WorkItem） | 重命名可延后 |
| `housekeeper-filter` | `assignee-filter` + 配置标签 | v1.0 前 |
| `contracts/` copy to `.contracts` | + 生成 TS 类型 | v0.4 |
| 单 Skill 假设 | `skill_id` + 侧栏槽 | v0.4 |

---

## 10. 与产品脊柱的对应

| 脊柱 | 架构生长重点 |
|------|----------------|
| S1 总览 | Shell 与指标 API 技能无关 |
| S2 Inbox + HITL | `WorkItem` + disposition API 稳定 |
| S3 Trace | Run 语义通用；enrich 步骤名配置化 |
| S4 ROI | 指标定义 per-skill，壳复用 |
| S5 Studio | 不动 Console 核心；未来独立模块 |
| S6 Tenant | 追踪层 + Auth；Console 无租户 if-else |

---

## 11. 总结

| 问题 | 结论 |
|------|------|
| 最小版本有抽象价值吗？ | **有** — Inbox / HITL / Trace / Timeline / Shell 已是 Operator Platform 内核 |
| 每版都要大重构吗？ | **否** — 每版 0～3 项边界微调 + 清单自检 |
| 当前最该做的第一步？ | **Adapter + operator 读模型**（文档已落；代码可随下一 patch 跟进） |
| 如何衡量「正轨生长」？ | 第二 Skill 接入时，**Shell 与 Case 布局零改动**，只加 adapter + renderer |

---

## 12. 相关文档

| 文档 | 关系 |
|------|------|
| [PUB-02](PUB-02-architecture.md) | FS-COS 分层目标态 |
| [PUB-04](PUB-04-domain-semantics.md) | 领域语义 / ACL |
| [PUB-07](PUB-07-product-surface.md) | 产品脊柱与 UI 复用率 DoD |
| [PUB-14](PUB-14-v030-scope.md) | v0.3 产品交付范围 |
| [PUB-15](PUB-15-agentic-ui-design.md) | L0 Shell 视觉 SSOT |
| [PUB-changelog](PUB-changelog.md) | 版本摘要；架构项用 `[arch]` 标注 |
