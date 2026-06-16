# 25 · v0.4.5 Workbench Display Facets（上下文列 + 集成可配置）

> **状态**：生效中 · **性质**：Action 列表上下文列与 Turso overrides 纪律  
> **依赖**：[PUB-17](PUB-17-console-information-architecture.md) · [PUB-23](PUB-23-v043-integration-protocol-surface.md) · [PUB-24](PUB-24-v044-product-shell-live.md)  
> **最后修订**：2026-06-16

---

## 1. 目标

Action 中心增加 **「上下文」** 列，展示 Agent/业务上下文的可扫视字段（首项：**合同金额**）。

- **关联对象**列：仅 `{ id, type }`（工单号 + 类型）
- **上下文**列：`{ label, value }[]`（如 `合同金额 · ¥4.1万`）
- 展示哪些字段：**集成页可配置**，保存至 Turso `runtime_config.config.binding_overrides`

## 2. 数据流

```text
xlink-fsm.v1.json (context_column.facet_catalog)
        +
runtime_config.binding_overrides
        → mergeWorkbenchDisplay
        → follow-up adapter → ContextColumnCell
```

| 层 | 职责 |
|----|------|
| Binding SSOT | `workbench_display.context_column.facet_catalog` |
| Turso overrides | `binding_overrides["xlink-fsm@1.0.0"].workbench_display.enabled_facets` |
| Adapter | `listDisplay.contextColumn` |
| UI | 「关联对象」= 身份；「上下文」= 可配置扫视字段 |

## 3. Resolver kinds

### v0.4.5（当前 wedge）

| kind | 数据源 | 备注 |
|------|--------|------|
| `quote_amount_yuan` | ~~`suggestion.情况判断.金额与方案`~~ → **`live_verdict` / Fact Plane** | v0.4.x 已改读事实轨；v0.5.2 **deprecated**，改用 `fact_role` |
| `stale_days_state_at` | `follow_up_logs.state_at` 现算（Mongo `updateTime` 锚点） | |
| `suggestion_path` | JSON path | 仅 Cognition 展示，不用于记账 |
| `row_field` | `SuggestionRow` 顶层/metadata | |

### v0.5.2（计划）

| kind | 数据源 |
|------|--------|
| `fact_role` | binding `fact_roles[id]` → `SubjectFacts` / `fact_snapshot` / timeline 业务轨 |
| `milestone_label` | binding `milestone_catalog[id]` 最近一条业务轨事件 |

```typescript
// 目标 resolver 形态（示意）
{ "kind": "fact_role", "fact_role": "primary_offer_amount", "format": "cny_wan" }
```

**Fact / Cognition 纪律**：`suggestion_path` 与 `fact_role` 不得混用同一 facet 表达「合同金额」；金额类 facet **必须**走 `fact_role`。

无值时该行上下文 **不展示该字段**（诚实空态）。

## 4. 集成页配置

FSM 协议 Tab → **上下文列**：

- 勾选 `context_column.facet_catalog` 项
- 内置样例 suggestion 预览 `ContextColumnCell`
- 保存 / 恢复 `default_enabled`

## 5. 明确不做（v0.4.5）

- 按金额 SQL 排序/筛选
- `contracts.amount_yuan` 已签约 facet
- 在线编辑 resolver 定义
- 多连接器 facet 目录（仅 xlink-fsm work-order）
