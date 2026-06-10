# 18 · Console 企业级列表控件（DataList）

> **状态**：生效中 · **性质**：Agent Console 列表 UI 与数据契约 SSOT  
> **依赖**：[PUB-17](PUB-17-console-information-architecture.md)（三层 IA、Action 列语义）· [PUB-15](PUB-15-agentic-ui-design.md)（视觉）  
> **最后修订**：2026-06-10

---

## 1. 本文解决什么问题

Console 多处需要「表格型数据视图」（Action 中心、Runs、评估抽检等）。若各页各自实现 `<table>`，会导致：

- 滚动发生在整页而非 Frame 内；
- 分页、排序、列宽状态无法复用；
- Tab 切换时 URL 参数互相污染。

本文定义 **`DataList` 组件族** 的布局契约、URL 命名空间、分页策略与接入纪律。

---

## 2. 组件分层

```text
DataListFrame          ← 布局壳：toolbar · scroll viewport · footer
  ├─ DataListToolbar   ← 可选：筛选旁 · 列设置 · 密度
  ├─ DataListTable     ← TanStack Table + sticky thead
  └─ DataListPagination← 共 N 条 · 页码 · 条/页

Hooks / 工具
  ├─ useDataListUrlState(scope)   ← page / pageSize / sort / order
  ├─ useDataListDensity()         ← compact | comfortable（localStorage）
  └─ useDataListColumnPreferences(tableId) ← 列显隐（localStorage）
```

**代码路径**：`apps/console/components/data-list/`

---

## 3. 布局契约（铁律）

| 规则 | 说明 |
|------|------|
| 父链高度 | `h-full → flex flex-col → min-h-0` 一路传到 `DataListFrame` |
| 唯一滚动区 | 仅 `DataListFrame` 内 viewport `overflow-auto` |
| 表头 | `position: sticky; top: 0` |
| 底栏 | 分页 footer `shrink-0`，不随 tbody 滚走 |
| 主列固定 | Action 标题列可 `sticky left`（宽表横滚时保留上下文） |

Split 详情打开时：**列表区与详情区各自滚动**，禁止整页滚动抢焦点。

---

## 4. URL 状态与命名空间

同一浏览器会话可能在 Action 中心、Runs、评估页之间跳转。各列表使用 **独立 scope**，避免 `sort` / `page` 串台：

| Scope | 用途 | 参数示例 |
|-------|------|----------|
| `inbox` | 待审核 / 闭环 / 存档 | `page`, `pageSize`, `sort`, `order` |
| `execution` | 待执行 | `ep`, `eps`, `es`, `eo` |
| `runs` | Runs 运行中心 | `rp`, `rps`, `rs`, `ro` |
| `quality` | 评估质量抽检 | `qp`, `qps`, … |

切换 Action 中心 Tab 时须 `stripDataListParamsForView` 清理非当前视图的列表参数。

**筛选变化** → 重置 `page` 为 1（`useDataListUrlState.resetDeps`）。

---

## 5. 分页策略

| 模式 | 何时使用 | 实现 |
|------|----------|------|
| **DB 分页** | 待审核默认排序（`latest`）、无搜索、无优先级筛选 | `listSuggestionsPage`（Turso `LIMIT/OFFSET` + `COUNT`） |
| **内存分页** | 复杂排序、搜索、优先级筛选 | 服务端取上限（500）→ 排序/筛选 → `slice` → 传 `totalCount` 给客户端 |
| **Mock 分页** | 待执行、Runs | 客户端 `paginateItems` + scope URL |

列表组件通过 `totalCount` 区分「页数据已切片」与「客户端切片」。

---

## 6. 宽 / 窄与列设置

| 维度 | 机制 |
|------|------|
| **布局宽度** | `layout: wide \| narrow`（Split 开 = narrow） |
| **窄列预设** | `NARROW_HIDDEN_COLUMN_IDS` 隐藏次要列（Agent、来源系统、执行人） |
| **用户列设置** | `DataListColumnSettings` + `useDataListColumnPreferences(tableId)` |
| **密度** | `DataListDensityToggle`：`compact` / `comfortable` |

列定义与 `tableId` 登记见 `components/data-list/column-presets.ts`。

---

## 7. 已接入页面

| 页面 | tableId | 备注 |
|------|---------|------|
| Action 待审核 / 闭环 / 存档 | `action-review` | DB 分页（条件满足时） |
| Action 待执行 | `action-execution` | Mock + 终端反馈列 |
| Runs | `runs` | Mock |
| 评估 · 质量抽检 | `evaluation-samples` | Mock |

**新列表页**：须先登记 `DATA_LIST_TABLE_IDS` 与列 preset，再接入 `DataListFrame`，禁止新建裸 `<table>`。

---

## 8. 与 PUB-17 的关系

- **列语义**遵守 [PUB-17 § Action 列表](PUB-17-console-information-architecture.md) 平台字段；楔子字段不进列。
- **Work 层**列表统一本组件；**Agents 层** Runs / 评估抽检同族；**Systems 层**治理列表后续接入。

---

## 9. 后续演进（非阻塞）

- SQL 层支持更多排序键（优先级、执行人）
- 列拖拽排序、批量行选择
- 虚拟滚动（`@tanstack/react-virtual`）用于单页 100+ 行
