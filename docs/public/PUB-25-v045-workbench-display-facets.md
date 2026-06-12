# 25 · v0.4.5 Workbench Display Facets（上下文列 + 集成可配置）

> **状态**：生效中 · **性质**：Action 列表上下文列与 Turso overrides 纪律  
> **依赖**：[PUB-17](PUB-17-console-information-architecture.md) · [PUB-23](PUB-23-v043-integration-protocol-surface.md) · [PUB-24](PUB-24-v044-product-shell-live.md)  
> **最后修订**：2026-06-11

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

## 3. Resolver kinds（v0.4.5 wedge）

| kind | 数据源 |
|------|--------|
| `quote_amount_yuan` | `suggestion.情况判断.金额与方案`（Agent 认知） |
| `stale_days_state_at` | `follow_up_logs.state_at` 现算（Mongo `updateTime` 锚点） |
| `suggestion_path` | JSON path（预留 v0.5） |
| `row_field` | `SuggestionRow` 顶层/metadata（预留） |

无值时该行上下文 **不展示该字段**（诚实空态）；数据来自 `follow_up_logs.suggestion`，无需新 DB 列。

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
