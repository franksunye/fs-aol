# 23 · v0.4.3 Integration Protocol Surface

> **状态**：生效中 · **依赖**：[PUB-05](PUB-05-releases.md) §v0.4.3 · [PUB-04](PUB-04-domain-semantics.md) · [PUB-22](PUB-22-v042-runtime-config-plane.md)

## 1. 目标

将 XLink FSM 防腐层从写死的 `domain.py` 提取为 **Integration Binding**（`contracts/integration-bindings/xlink-fsm.v1.json`），并在 Console 以企业级集成工作台呈现：

- **连接 / 摄取**：可编辑（`runtime_config`）
- **集成协议**：对象映射、字段、码表、事件规则 — 只读可见
- **同步健康**：来自 `engine_runtime_snapshots.run_summary_json`
- **样例转换**：原始 `serviceAppointment` → `WorkOrder`

**不做**：写回业务系统、`binding_overrides` 可编辑（v0.4.4）。

## 2. Binding 契约

| 路径 | 说明 |
|------|------|
| `contracts/integration-bindings/schema.json` | JSON Schema |
| `contracts/integration-bindings/xlink-fsm.v1.json` | XLink FSM SSOT |
| `packages/aol/aol/integration/binding.py` | 加载与校验 |
| `packages/aol/aol/integration/mapper.py` | `map_record()` 原语：direct / lookup / coalesce / source_ref |

引擎 `work_order_from_sa()` 委托 `map_record()`；parity 测试防漂移。

## 3. Console API

| 端点 | 说明 |
|------|------|
| `GET /api/integrations/fsm` | binding + runtime 合并视图 + sync health |
| `POST /api/integrations/fsm/sample-transform` | Mongo 1 条或内置样例 → WorkOrder |

## 4. UI（`/integrations`）

**已接入（live）**：

- `FsmIntegrationWorkspace` — Tab：连接 / 摄取策略 / 集成协议 / 同步健康
- `WecomLiveCard` · `TursoBootstrapCard`
- Agent 设置 FSM 字段 → `FsmConfigMirrorCard` 只读 + 链到集成页

**目标态样例（scenario）**：mock 三栏折叠保留。

Deep link：`/integrations?integration=xlink-fsm&tab=protocol`

## 5. 验收

```bash
# Python binding parity
.venv/bin/python -m pytest packages/aol/tests/test_binding_mapper.py -q

# Console E2E
bash scripts/e2e-v043-integration-protocol.sh

pnpm build
```

- [ ] `map_record` 与 mock SA 记录 parity
- [ ] FSM 工作台四 Tab 可保存连接/摄取
- [ ] 集成协议 Tab 展示 binding + 样例转换
- [ ] Agent 设置无 FSM 双编辑
- [ ] 同步健康来自真实 cron 快照

## 6. v0.4.4 预留

- `runtime_config.binding_overrides` — 码表 / 字段路径 patch
- 协议 Tab 内编辑入口 + revision 回滚

## 7. v0.5 — Milestone / Fact 扩展（推荐路径）

> 与 [PUB-16](PUB-16-architecture-evolution.md) §6.1 对齐。目标：平台不再内置 `quote`；XLink「正式报价」由 binding 声明。

### 7.1 新增字段（草案）

| 字段 | 类型 | 说明 |
|------|------|------|
| `milestone_catalog[]` | 目录 | 业务里程碑类型：`id`、`label`、`source`（collection + path）、`timeline_kind` |
| `fact_roles[]` | 目录 | 可引用事实角色：`id`、`type`（money/enum/bool/text）、`label`、`milestone_ref`、`field_path` |
| `enrichment_profiles[]` | 目录 | enrich 执行配置：`id`、`milestones[]`、`fact_roles[]`、`mongo_collections` |
| `timeline_kind_aliases` | map | 旧 `kind` → 新 milestone id（如 `quote` → `commercial_offer`） |

### 7.2 XLink FSM 楔子映射（示例）

| 平台 role / milestone | XLink 来源 | 展示名（中文） |
|----------------------|------------|----------------|
| `milestone.commercial_offer` | `order` + `totalPrice` | 正式报价 |
| `milestone.signed_contract` | `contract` + `afterRefundMoney` | 生效签约 |
| `fact.primary_offer_amount` | `order.totalPrice` | 合同金额 |
| `fact.signed_amount` | `contract.afterRefundMoney` | 签约金额 |

### 7.3 引擎消费

```text
binding.milestone_catalog
        → timeline.py 业务轨事件 kind / 标题
binding.fact_roles + enrichment_profiles
        → enrich_subject_context() → fact_snapshot.v1
        → polish._ground_to_facts() / fact_drift reprocess
```

### 7.4 Console 消费

- **Case 详情**：`SubjectFacts` 从 timeline 业务轨 + `live_verdict` 解析（已实现 v0.4.x）
- **列表 facet**：v0.5.2 起 `fact_role` resolver 读 Fact Plane，弃用 `quote_amount_yuan` 读 suggestion（见 [PUB-25](PUB-25-v045-workbench-display-facets.md)）

### 7.5 迁移纪律

1. **先 schema + xlink binding**，再改引擎；旧字段只读兼容一版。
2. **不**在 `packages/aol/aol/` 根目录新增 `quote.py` / `contract.py`。
3. 第二 Connector（mock CRM）用同一 schema 验证，再删楔子硬编码。

## 8. 脏数据吸收：orderNum 非唯一（XLink 现状）

> **约束**：不改 XLink 企业系统；重复 `orderNum`、API `saNum` 透传是生产常态。AOL 只在 **Integration / Adapter** 层消化。

### 8.1 根因（已证实：`GD2026060029`）

| 层 | 行为 |
|----|------|
| 上游 API | 不同客户、不同地址，多次传入同一 `saNum` |
| XLink | 线索转工单时 `shbNum → orderNum`，**无唯一校验** |
| 生产库 | 多条 `state=1` 的 SA 共用同一 `orderNum`（非个例） |

### 8.2 AOL Subject 纪律

| 概念 | 字段 | 用途 |
|------|------|------|
| **Subject SSOT** | `work_order_id`（Mongo `_id`） | enrich、timeline、reprocess、inbox |
| **追踪键** | `dedupe_key` | Turso `follow_up_logs` 主键 |
| **展示号** | `order_num` | 给人看的工单号；**不得**单独用于 Mongo 定位 |

实现：`packages/aol/aol/integration/subject_resolve.py`

- 有 `work_order_id` → 直接查 `_id`
- 仅 `order_num` 且多条 active SA → **拒绝猜测**，打 warning，返回 `None`

### 8.3 脚本 / Console

| 入口 | 要求 |
|------|------|
| `reprocess_suggestions.py` | 优先 `work_order_id`；`--dedupe-key` 首选 |
| `sync_inbox.py` | 支持 `--work-order-id` |
| `backfill_timeline.py` | 支持 `--work-order-id` / `--dedupe-key` |
| Binding `xlink-fsm` | `identity.display_number_unique: false` |
| Console 列表/详情 | `formatWorkOrderRef`：`GD2026060029 · 840881` 尾号消歧 |

### 8.4 反模式

- `find_one({"orderNum": ...})` 作为唯一定位
- 按 `orderNum` reprocess 且未指定 `dedupe_key` / `work_order_id`
- 在 UI 把 `order_num` 当作全局唯一业务主键

> **最后修订**：2026-06-16
