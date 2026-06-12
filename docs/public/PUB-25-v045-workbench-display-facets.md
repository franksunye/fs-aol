# 25 · v0.4.5 Workbench Display Facets（关联对象 + 集成可配置）

> **状态**：生效中 · **性质**：Action 列表关联对象展示与 Turso overrides 纪律  
> **依赖**：[PUB-17](PUB-17-console-information-architecture.md) · [PUB-23](PUB-23-v043-integration-protocol-surface.md) · [PUB-24](PUB-24-v044-product-shell-live.md)  
> **最后修订**：2026-06-11

---

## 1. 目标

Action 中心「关联对象」列在 `工单号 + 类型` 下方展示 **facets**（首项：合同金额），展示项由集成页勾选并保存至 Turso `runtime_config.config.binding_overrides`，无需发版改代码。

## 2. 数据流

```text
xlink-fsm.v1.json (facet_catalog)
        +
runtime_config.binding_overrides
        → mergeWorkbenchDisplay
        → follow-up adapter → RelatedObjectCell
```

| 层 | 职责 |
|----|------|
| Binding SSOT | `workbench_display.facet_catalog` 定义可用字段与 resolver |
| Turso overrides | `binding_overrides["xlink-fsm@1.0.0"].workbench_display.enabled_facets` |
| Adapter | `mapFollowUpRow` 注入 `relatedObject.facets` |
| UI | 列名仍为「关联对象」；禁止独立主列（PUB-17） |

## 3. Resolver kinds（v0.4.5 wedge）

| kind | 数据源 |
|------|--------|
| `quote_amount_yuan` | `suggestion.情况判断.金额与方案` |
| `suggestion_path` | JSON path（预留 v0.5） |
| `row_field` | `SuggestionRow` 顶层/metadata（预留） |

无值时 facet **不渲染**（诚实空态）；金额已存在于 `follow_up_logs.suggestion`，无需新 DB 列。

## 4. 集成页配置

FSM 协议 Tab → **工作台展示**：

- 勾选 `facet_catalog` 项
- 内置样例 suggestion 预览 `RelatedObjectCell`
- 保存 / 恢复 `default_enabled`

## 5. 明确不做（v0.4.5）

- 按金额 SQL 排序/筛选
- `contracts.amount_yuan` 已签约 facet
- 在线编辑 resolver 定义
- 多连接器 facet 目录（仅 xlink-fsm work-order）
