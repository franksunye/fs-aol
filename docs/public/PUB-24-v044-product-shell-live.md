# 24 · v0.4.4 Product Shell Live（mock 壳装入真实数据）

> **状态**：生效中 · **性质**：Console Agent/集成/模型策略产品化纪律  
> **依赖**：[PUB-17](PUB-17-console-information-architecture.md) · [PUB-22](PUB-22-v042-runtime-config-plane.md) · [PUB-23](PUB-23-v043-integration-protocol-surface.md)  
> **最后修订**：2026-06-11

---

## 1. 目标

第一版 UX/mock 是**产品壳规格**；v0.4.4 将 `runtime_config`、引擎快照、binding、trace 等真实数据**装入同一壳**，而非另起技术表单再折叠 mock。

## 2. 纪律

| 原则 | 说明 |
|------|------|
| Mock-as-shell | 保留双栏/三栏布局与 `SettingsSectionCard` 区块 |
| 适配层 | `lib/adapters/*` 产出 View；页面不直接读 env 字段名 |
| 诚实标注 | 未接能力在原位 `not_connected`，不藏 `<details>` |
| Wedge 收缩 | 任务路由/触发规则行数 = 引擎真实步骤 |
| 跨页 SSOT | FSM 摄取 → `/integrations`；LLM → `/settings/ai` |

## 3. 三页 slot 映射（摘要）

### Agent 设置

| 区块 | Live 源 |
|------|---------|
| 摄取策略 | `fsm_event_statuses` / `stale_days` / pilots |
| 数据来源 | xlink-fsm、wecom、turso |
| 运行行为 | `agent_mode` / `reanalyze` / `dry_run` |
| 发布历史 | `runtime_config_revisions` |

### 模型策略

| 区块 | Live 源 |
|------|---------|
| 当前模型 | `llm_provider` / `llm_model` |
| 任务路由 | enrich → suggest → heuristic |
| 评估指标 | `aol_traces` 7 日聚合 |

### 集成

| 区块 | Live 源 |
|------|---------|
| 列表 | `integration-registry`（live + scenario） |
| FSM 详情 | 4 Tab workspace（连接/摄取/协议/健康） |
| 洞察 | cron `syncHealth` |

## 4. API

- `GET /api/runtime/config/revisions?limit=10` — 发布历史

## 5. 验收

- 三页布局与第一版 mock 一致
- 无整页 scenario `<details>` 折叠产品壳
- 无页顶独立技术表单栈
